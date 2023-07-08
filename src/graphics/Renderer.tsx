import * as THREE from 'three';
import * as d3 from 'd3';
import _ from 'underscore';

import Stats from 'stats.js';
import IObject from './objects/IObject';
import {Color, Vector3} from 'three';
import {AnimationGenerator} from '../animation/AnimationGenerator';
import IDecoration from './decorations/IDecoration';

export default class Renderer {
    constructor(canvas, svg, statContainer?) {
        this.$canvas = canvas;
        this.$svg = svg;
        this.height = this.$canvas.height;
        this.width = this.$canvas.width;

        if (statContainer) {
            this.$statContainer = statContainer;
            this.$statContainer.appendChild(this.stats.dom);
        }
        this._initWebGlRenderer();
        this._initSVG();
    }

    public height: number = 1000;
    public width: number = 800;
    public stats = new Stats();
    protected $statContainer: HTMLElement;
    protected $canvas: OffscreenCanvas | HTMLCanvasElement;
    protected $svg: SVGSVGElement;
    public $binding: SVGGElement;
    protected _threeRenderer;
    protected _threeScene;
    protected _threeCamera;
    protected _objects: IObject[] = [];
    protected _decorations: IDecoration[] = [];
    protected _listeners = [];
    protected _center = {x: 0, y: 0};

    public update(time: number) {
        this._listeners.forEach((update) => update(time));
    }

    set backgroundColor(value: number) {
        this._threeScene.background = value;
    }

    public startRendering() {
        window.requestAnimationFrame(this.render.bind(this));
    }

    public addRenderListener(listener) {
        this._listeners.push(listener);
    }

    public addObject(object: IObject) {
        this._objects.push(object);
        this._threeScene.add(object.mesh);
    }

    public removeObject(object: IObject) {
        this._objects = _.without(this._objects, object);
        this._threeScene.remove(object.mesh);
    }

    public addDecoration(decoration: IDecoration) {
        this._decorations.push(decoration);
        decoration.initToSVG(this.$binding);
    }

    public removeDecoration(decoration: IDecoration) {
        this._decorations = _.without(this._decorations, decoration);
        decoration.removeFromSVG(this.$binding);
    }

    public clearObjects() {
        this._objects.forEach((o) => this._threeScene.remove(o.mesh));
        this._objects = [];
    }

    public clearDecorations() {
        this._decorations.forEach((d) => d.removeFromSVG(this.$binding));
        this._decorations = [];
    }

    public clearAll() {
        this.clearObjects();
        this.clearDecorations();
    }

    public setBackground(background: Color) {
        this._threeScene.background = background;
    }

    public setStatContainer(statContainer) {
        this.$statContainer = statContainer;
        this.$statContainer.appendChild(this.stats.dom);
    }

    public setCenter(x: number, y: number) {
        this._threeCamera.position.set(x, -y, 10);
        this._threeCamera.updateProjectionMatrix();
        d3.select(this.$binding).attr(
            'transform',
            `translate(${[this.width / 2 - x, this.height / 2 - y]})`
        );
        this._center = {x, y};
    }

    public renderOnce() {
        this.stats.begin();
        this._threeRenderer.render(this._threeScene, this._threeCamera);
        this.stats.end();
    }

    public setProgressWithGenerator(
        progress: number,
        generator: AnimationGenerator
    ) {
        this._objects.forEach((o) => {
            let timing = generator.getTimingForObject(o);
            if (timing) {
                // Don't use progressScale for objects as peers set overall timing
                o.setProgress(progress);
            } else {
                console.error('ObjectTiming not found for object', o);
            }
        });
        this._decorations.forEach((d) => {
            let timing = generator.getTimingForDecoration(d);
            if (timing) {
                d.setProgress(timing.progressScale(progress));
            } else {
                console.error('DecorationTiming not found for decoration', d);
            }
        });
    }

    public render(time) {
        this.stats.begin();
        this.update(time);
        this._threeRenderer.render(this._threeScene, this._threeCamera);
        this.stats.end();
        window.requestAnimationFrame(this.render.bind(this));
    }

    public renderStaticSVG() {
        this._decorations.forEach((decoration) => {
            decoration.renderStaticToSVG(
                this.$binding,
                decoration.properties.default
            );
        });
    }

    public renderAnimationSVG() {
        this._decorations.forEach((decoration) => {
            if (decoration.properties.default) {
                decoration.renderAnimationToSVG(
                    this.$binding,
                    decoration.properties.start,
                    decoration.properties.end
                );
            }
        });
    }

    public updateSize(width: number, height: number) {
        this.height = height;
        this.width = width;

        this._threeCamera.aspect = width / height;
        this._threeCamera.left = width / -2;
        this._threeCamera.right = width / 2;
        this._threeCamera.top = height / 2;
        this._threeCamera.bottom = height / -2;
        this._threeCamera.updateProjectionMatrix();

        this._threeRenderer.setSize(width, height);

        d3.select(this.$binding).attr(
            'transform',
            `translate(${[width / 2 - this._center.x, height / 2 - this._center.y]})`
        );
    }

    protected _initSVG() {
        let binding = d3
            .select(this.$svg)
            .append('g')
            .attr('id', 'binding-decoration-group');
        this.$binding = binding.node();
    }

    protected _initWebGlRenderer() {
        this._threeRenderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            canvas: this.$canvas,
            preserveDrawingBuffer: true,
            logarithmicDepthBuffer: true,
        });
        this._threeRenderer.setPixelRatio(window.devicePixelRatio);
        this._threeRenderer.setSize(this.width, this.height);

        this._threeCamera = new THREE.OrthographicCamera(
            this.width / -2,
            this.width / 2,
            this.height / 2,
            this.height / -2,
            -1000,
            1000
        );
        this._threeCamera.position.set(this.width / 2, this.height / -2, 10);
        this._threeScene = new THREE.Scene();
        this._threeScene.background = new (THREE.Color as any)(0xffffff);
        this._threeScene.add(this._threeCamera);
    }
}
