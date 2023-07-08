import * as THREE from 'three';
import * as BAS from 'three-bas';

import _ from 'underscore';

import {VERTEX_FUNCTIONS} from '../bas/VertexFunctions';
import NonUniformVertexBufferGeometry from '../bas/NonUniformVertexBufferGeometry';

import IPeerObject from './IPeerObject';
import {getElementCounter} from '../../utils/counter';
import ObjectTiming from '../../animation/ObjectTiming';
import {getGLSLTimeProp} from '../graphic_utils';
import {EasingOption} from '../../animation/EasingOption';
import {AnimationEffect} from '../../animation/AnimationEffect';
import * as d3 from 'd3';

export default class PeerFlubber implements IPeerObject {
    public constructor(count, properties) {
        this.idList = _.range(count);
        this.peerCount = count;

        this._initId();
        properties.forEach(() => {
            this._processGeometry(properties[0].type, this.position);
        });
        this._initGeometry();
        this._addAttributes();
        this._setAttributesA();
        this._initStaticMaterial(STATIC_VERTEX_PARAMETERS, STATIC_VERTEX_POSITION);
        this._initAnimateMaterial(
            ANIMATE_VERTEX_PARAMETERS,
            ANIMATE_VERTEX_POSITION,
            ANIMATE_UNIFORMS
        );
        this._mesh = new THREE.Mesh(this._geometry, this._staticMaterial);
        this._mesh.frustumCulled = false;
    }

    public type: string = 'Flubber';

    protected _prefab = new THREE.BufferGeometry();

    public id: number = 0;
    public peerCount: number = 0;
    public classId = `${this.type}-${this.id}`;
    protected idList;
    protected _mesh;
    protected _geometry;
    protected _animateMaterial;
    protected _staticMaterial;

    protected position = [];
    protected b_vertices = [];
    protected indices_array = [];

    protected _bufferFunctions = {
        a_position: FUNCTIONS.POSITION,
        b_position: FUNCTIONS.POSITION,
        a_scale: FUNCTIONS.SCALE,
        b_scale: FUNCTIONS.SCALE,
        a_fill_color: FUNCTIONS.COLOR,
        b_fill_color: FUNCTIONS.COLOR,
        a_opacity: FUNCTIONS.OPACITY,
        b_opacity: FUNCTIONS.OPACITY,
        start_time: FUNCTIONS.START,
        duration_time: FUNCTIONS.DURATION,
    };
    protected _staticBufferKeys = [
        'a_position',
        'a_scale',
        'a_fill_color',
        'a_opacity',
    ];
    protected _animateBufferKeys = [
        'start_time',
        'duration_time',
        'a_position',
        'a_scale',
        'a_fill_color',
        'a_opacity',
        'b_position',
        'b_scale',
        'b_fill_color',
        'b_opacity',
    ];

    get visible() {
        return this._mesh.visible;
    }

    set visible(value: boolean) {
        this._mesh.visible = value;
    }

    get mesh() {
        return this._mesh;
    }

    public setProgress(value: number) {
        this._animateMaterial.setUniformValues({time: value});
    }

    public setEasingOption(easing: EasingOption) {
        this._animateMaterial.vertexFunctions = VERTEX_FUNCTIONS.concat(`float useEasing(float t) {
    return ${easing.glslCall};
}`);
        this._animateMaterial.vertexShader = this._animateMaterial.concatVertexShader();
        this._animateMaterial.needsUpdate = true;
    }

    public staticProperties(properties: any) {
        this._mesh.material = this._staticMaterial;
        // this.position = [];
        // Update geometry based on type
        this._setAttributesA();

        let tempArray = [];
        this._staticBufferKeys.forEach((key) => {
            this.idList.forEach((id) => {
                let p = properties[id];
                this._bufferFunctions[key].forEach((fxn, ff) => {
                    tempArray[ff] = fxn(p);
                });
                this._geometry.setPrefabData(key, id, tempArray);
            });
            this._geometry.attributes[key].needsUpdate = true;
        });
    }

    public animatePropertiesWithEffect(
        properties: any,
        dataScopes: any,
        startIndex: number,
        timing: ObjectTiming,
        effect: AnimationEffect,
        bounds: any
    ) {
        console.log('just a test');
    }

    public animateProperties(
        startProperties: any,
        endProperties: any,
        startDataScopes: any,
        endDataScopes: any,
        startIndex: number,
        timing: ObjectTiming
    ) {
        this._mesh.material = this._animateMaterial;
        // this.position = [];
        this.b_vertices = [];
        console.log(startProperties);
        console.log(endProperties);
        endProperties.forEach(() => {
            this._updateGeometry(endProperties[0].type, this.b_vertices);
        });
        // Update vertices based on shape type
        // this._setAttributesA();
        this._setAttributesB();

        let tempArray = [];
        let propMap = timing.getPropTimeMap();
        let updateUniforms = {};
        _.keys(propMap).forEach((key) => {
            console.log(key);
            let t = propMap[key];
            updateUniforms[`t_start_${getGLSLTimeProp(key)}`] = t.start;
            updateUniforms[`t_end_${getGLSLTimeProp(key)}`] = t.end;
        });
        this._animateMaterial.setUniformValues(updateUniforms);
        this._animateBufferKeys.forEach((key) => {
            this.idList.forEach((id) => {
                let prop = startProperties[id];
                let data = startDataScopes[id];
                let t = timing.getPeer(data, prop);
                if (key[0] === 'b') {
                    prop = endProperties[id];
                }
                this._bufferFunctions[key].forEach((fxn, ff) => {
                    tempArray[ff] = fxn(prop, t);
                });
                this._geometry.setPrefabData(key, id, tempArray);
            });
            this._geometry.attributes[key].needsUpdate = true;
        });
        console.log(this);
    }

    protected _initStaticMaterial(vertexParameters, vertexPosition) {
        let defaultProps = {
            transparent: true,
            flatShading: THREE.FlatShading,
            vertexParameters,
            vertexFunctions: [],
            vertexPosition,
            fragmentParameters: [
                'varying float v_opacity;',
                'varying vec3 v_fill_color;',
            ],
            fragmentDiffuse: [
                'diffuseColor.a = v_opacity;',
                'diffuseColor.rgb = v_fill_color / 255.0;',
            ],
        };
        let materialProps = _.assign(defaultProps, {
            uniforms: {
                diffuse: {value: new (THREE.Color as any)(0xffffff)},
                opacity: {value: 1},
                // time: {value: 0},
                // lineWidth: {type: 'f', value: check(props['lineWidth'], 1)},
                // map: {type: 't', value: check(props['map'], null)},
                // useMap: {type: 'f', value: check(props['useMap'], 0)},
                // alphaMap: {type: 't', value: check(props['alphaMap'], null)},
                // useAlphaMap: {type: 'f', value: check(props['useAlphaMap'], 0)},
                // color: {
                //     type: 'c',
                //     value: check(props['color'], new THREE.Color(0xffffff)),
                // },
                // opacity: {type: 'f', value: check(props['opacity'], 1)},
                // visibility: {type: 'f', value: check(props['visibility'], 1)},
            },
        });
        this._staticMaterial = new BAS.BasicAnimationMaterial(materialProps);
    }

    protected _initId() {
        this.id = getElementCounter(this.type);
        this.classId = `${this.type}-${this.id}`;
    }

    protected _initGeometry() {
        this._geometry = new NonUniformVertexBufferGeometry(
            this._prefab,
            _.range(this.peerCount).map((p) => GL_SEGMENTS + 2),
            this.peerCount
        );
    }

    protected _initAnimateMaterial(vertexParameters, vertexPosition, uniforms) {
        let vertexFunctions = VERTEX_FUNCTIONS.concat(`float useEasing(float t) {
    return t;
}`);
        this._animateMaterial = new BAS.BasicAnimationMaterial({
            transparent: true,
            flatShading: THREE.FlatShading,
            toneMapped: false,
            uniforms,
            vertexParameters,
            vertexFunctions,
            vertexPosition,
            fragmentParameters: [
                'varying float v_opacity;',
                'varying vec3 v_fill_color;',
            ],
            fragmentDiffuse: [
                'diffuseColor.a = v_opacity;',
                'diffuseColor.rgb = v_fill_color / 255.0;',
            ],
        });
    }

    private _processGeometry(type: string, vertices: any) {
        let indicesOffset = vertices.length / 3;
        this._updateGeometry(type, vertices);
        for (let i = 1; i <= GL_SEGMENTS; i++) {
            let n = i + indicesOffset;
            this.indices_array.push(n, n + 1, indicesOffset);
        }
    }

    private _updateGeometry(type: string, vertices: any) {
        if (type.toLowerCase() === 'ellipse') {
            vertices.push(0, 0, 0);
            for (let s = 0, i = 3; s <= GL_SEGMENTS; s++, i += 3) {
                const segment = (s / GL_SEGMENTS) * Math.PI * 2,
                    x = GL_RADIUS * Math.cos(segment),
                    y = GL_RADIUS * Math.sin(segment);
                vertices.push(x, y, 0);
            }
        } else {
            vertices.push(0, 0, 0);
            for (let s = 0, i = 3; s < GL_SEGMENTS / 8; s++, i += 3) {
                let segment = ((s / GL_SEGMENTS) * 8 * Math.PI) / 4,
                    y = GL_RADIUS * Math.tan(segment),
                    x = GL_RADIUS;

                vertices.push(x, y, 0);
            }

            for (let s = 0, i = 3; s < GL_SEGMENTS / 4; s++, i += 3) {
                let segment = ((s / GL_SEGMENTS) * 4 * Math.PI) / 2 - Math.PI / 4,
                    x = -GL_RADIUS * Math.tan(segment),
                    y = GL_RADIUS;

                vertices.push(x, y, 0);
            }

            for (let s = 0, i = 3; s < GL_SEGMENTS / 4; s++, i += 3) {
                let segment = ((s / GL_SEGMENTS) * 4 * Math.PI) / 2 - Math.PI / 4,
                    y = -GL_RADIUS * Math.tan(segment),
                    x = -GL_RADIUS;

                vertices.push(x, y, 0);
            }

            for (let s = 0, i = 3; s < GL_SEGMENTS / 4; s++, i += 3) {
                let segment = ((s / GL_SEGMENTS) * 4 * Math.PI) / 2 - Math.PI / 4,
                    x = GL_RADIUS * Math.tan(segment),
                    y = -GL_RADIUS;

                vertices.push(x, y, 0);
            }

            for (let s = GL_SEGMENTS / 8, i = 3; s >= 0; s--, i += 3) {
                let segment = ((s / GL_SEGMENTS) * 8 * Math.PI) / -4,
                    y = GL_RADIUS * Math.tan(segment),
                    x = GL_RADIUS;

                vertices.push(x, y, 0);
            }
        }
    }

    private _addAttributes() {
        this._geometry.createAttribute('position', 3);
        this._geometry.createAttribute('a_position', 2);
        this._geometry.createAttribute('a_scale', 2);
        this._geometry.createAttribute('a_fill_color', 3);
        this._geometry.createAttribute('a_opacity', 1);
        this._geometry.createAttribute('b_vertices', 3);
        this._geometry.createAttribute('b_position', 2);
        this._geometry.createAttribute('b_scale', 2);
        this._geometry.createAttribute('b_fill_color', 3);
        this._geometry.createAttribute('b_opacity', 1);
        this._geometry.createAttribute('start_time', 1);
        this._geometry.createAttribute('duration_time', 1);
        this._geometry.setIndex(
            new THREE.BufferAttribute(new Uint16Array(this.indices_array), 1)
        );
    }

    private _setAttributesA() {
        this._geometry.setAttributeArray(
            'position',
            new Float32Array(this.position)
        );
    }

    private _setAttributesB() {
        this._geometry.setAttributeArray(
            'b_vertices',
            new Float32Array(this.b_vertices)
        );
        this._geometry.attributes['b_vertices'].needsUpdate = true;
    }
}

const STATIC_VERTEX_PARAMETERS = [
    'attribute vec2 a_position;',
    'attribute vec2 a_scale;',
    'attribute vec3 a_fill_color;',
    'attribute float a_opacity;',

    'varying vec3 v_fill_color;',
    'varying float v_opacity;',
];

const STATIC_VERTEX_POSITION = [
    'vec3 normal = vec3(0.0, 0.0, 1.0);',
    'transformed *= vec3(a_scale, 1.0);',
    'transformed += vec3(a_position, 0.0);',
    'v_opacity = a_opacity;',
    'v_fill_color = a_fill_color;',
];

const ANIMATE_VERTEX_PARAMETERS = [
    'uniform float time;',
    'uniform float t_start_x_position;',
    'uniform float t_end_x_position;',
    'uniform float t_start_y_position;',
    'uniform float t_end_y_position;',
    'uniform float t_start_width;',
    'uniform float t_end_width;',
    'uniform float t_start_height;',
    'uniform float t_end_height;',
    'uniform float t_start_fill_color;',
    'uniform float t_end_fill_color;',
    'uniform float t_start_opacity;',
    'uniform float t_end_opacity;',
    'uniform float t_start_shape;',
    'uniform float t_end_shape;',

    'varying vec3 v_fill_color;',
    'varying float v_opacity;',

    'attribute float start_time;',
    'attribute float duration_time;',

    'attribute vec3 b_vertices;',
    'attribute vec2 a_position;',
    'attribute vec2 b_position;',
    'attribute vec2 a_scale;',
    'attribute vec2 b_scale;',
    'attribute vec3 a_fill_color;',
    'attribute vec3 b_fill_color;',
    'attribute float a_opacity;',
    'attribute float b_opacity;',
];

const ANIMATE_VERTEX_POSITION = [
    'vec3 normal = vec3(0.0, 0.0, 1.0);',
    'float progress = linearInterpDuration(time, start_time, duration_time);',

    'transformed = mix(position, b_vertices, useEasing(linearInterpClamp(progress, t_start_shape,' +
        ' t_end_shape)));',

    'float x = mix(a_position.x, b_position.x, useEasing(linearInterpClamp(progress, t_start_x_position,' +
        ' t_end_x_position)));',
    'float y = mix(a_position.y, b_position.y, useEasing(linearInterpClamp(progress, t_start_y_position,' +
        ' t_end_y_position)));',
    'float width = mix(a_scale.x, b_scale.x, useEasing(linearInterpClamp(progress, t_start_width, t_end_width)));',
    'float height = mix(a_scale.y, b_scale.y, useEasing(linearInterpClamp(progress, t_start_height, t_end_height)));',

    'transformed *= vec3(width, height, 1.0);',
    'transformed += vec3(x, y, 0.0);',

    'v_opacity = mix(a_opacity, b_opacity, useEasing(linearInterpClamp(progress, t_start_opacity, t_end_opacity)));',
    'v_fill_color = mix(a_fill_color, b_fill_color, useEasing(linearInterpClamp(progress, t_start_fill_color,' +
        ' t_end_fill_color)));',
];

const ANIMATE_UNIFORMS = {
    diffuse: {value: new (THREE.Color as any)(0xffffff)},
    time: {value: 0},
    t_start_y_position: {value: 0},
    t_end_y_position: {value: 1},
    t_start_x_position: {value: 0},
    t_end_x_position: {value: 1},
    t_start_width: {value: 0},
    t_end_width: {value: 1},
    t_start_height: {value: 0},
    t_end_height: {value: 1},
    t_start_fill_color: {value: 0},
    t_end_fill_color: {value: 1},
    t_start_stroke_color: {value: 0},
    t_end_stroke_color: {value: 1},
    t_start_stroke_width: {value: 0},
    t_end_stroke_width: {value: 1},
    t_start_shape: {value: 0},
    t_end_shape: {value: 1},
    t_start_opacity: {value: 0},
    t_end_opacity: {value: 1},
};

const FUNCTIONS = {
    POSITION: [(p) => p.left + p.width / 2, (p) => -p.height / 2 - p.top],
    SCALE: [(p) => p.width / 2 / GL_RADIUS, (p) => p.height / 2 / GL_RADIUS],
    COLOR: [
        (p) => d3.rgb(p.fillColor).r,
        (p) => d3.rgb(p.fillColor).g,
        (p) => d3.rgb(p.fillColor).b,
    ],
    OPACITY: [(p) => p.opacity],
    START: [(p, t) => t[0]],
    DURATION: [(p, t) => t[1]],
};

function check(v, d) {
    if (v === undefined) return d;
    return v;
}

const GL_RADIUS = 10;
const GL_SEGMENTS = 32;
