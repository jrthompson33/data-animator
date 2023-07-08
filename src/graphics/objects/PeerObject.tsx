import * as THREE from 'three';
import * as BAS from 'three-bas';

import _ from 'underscore';

import {VERTEX_FUNCTIONS} from '../bas/VertexFunctions';

import IPeerObject from './IPeerObject';
import {getElementCounter} from '../../utils/counter';
import ObjectTiming from '../../animation/ObjectTiming';
import {getGLSLTimeProp} from '../graphic_utils';
import {AnimationEffect} from '../../animation/AnimationEffect';
import {EasingOption} from '../../animation/EasingOption';

export default class PeerObject implements IPeerObject {
    public constructor(count) {
        this.peerCount = count;
    }

    public type: string = 'Object';
    public id: number = 0;
    public peerCount: number = 0;
    public classId = `${this.type}-${this.id}`;
    protected _mesh;
    protected _geometry;
    protected _prefab;
    protected _animateMaterial;
    protected _staticMaterial;
    protected _bufferFunctions;
    protected _animateBufferKeys;
    protected _staticBufferKeys;

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
        let tempArray = [];
        this._staticBufferKeys.forEach((key) => {
            properties.forEach((p, i) => {
                this._bufferFunctions[key].forEach((fxn, ff) => {
                    tempArray[ff] = fxn(p);
                });
                this._geometry.setPrefabData(key, i, tempArray);
            });
            this._geometry.attributes[key].needsUpdate = true;
        });
    }

    public animatePropertiesWithMerge(
        startProperties: any,
        endProperties: any,
        dataScopes: any,
        startIndex: number,
        timing: ObjectTiming
    ) {
        this._mesh.material = this._animateMaterial;
        let tempArray = [];
        let propMap = timing.getPropTimeMap();
        let updateUniforms = {};
        _.keys(propMap).forEach((key) => {
            let t = propMap[key];
            updateUniforms[`t_start_${getGLSLTimeProp(key)}`] = t.start;
            updateUniforms[`t_end_${getGLSLTimeProp(key)}`] = t.end;
        });
        this._animateMaterial.setUniformValues(updateUniforms);
        this._animateBufferKeys.forEach((key) => {
            for (let i = 0; i < startProperties.length; i++) {
                let prop = startProperties[i];

                let t = timing.getPeer(dataScopes[i], prop);
                if (key[0] === 'b') {
                    prop = endProperties[i];
                }
                this._bufferFunctions[key].forEach((fxn, ff) => {
                    tempArray[ff] = fxn(prop, t);
                });
                this._geometry.setPrefabData(key, i + startIndex, tempArray);
            }
            this._geometry.attributes[key].needsUpdate = true;
        });
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
        let tempArray = [];
        let propMap = timing.getPropTimeMap();
        let updateUniforms = {};
        _.keys(propMap).forEach((key) => {
            let t = propMap[key];
            updateUniforms[`t_start_${getGLSLTimeProp(key)}`] = t.start;
            updateUniforms[`t_end_${getGLSLTimeProp(key)}`] = t.end;
        });
        this._animateMaterial.setUniformValues(updateUniforms);
        this._animateBufferKeys.forEach((key) => {
            for (let i = 0; i < startProperties.length; i++) {
                let prop = startProperties[i];
                //    TODO how to handle transitioning data?
                let data = startDataScopes[i];
                let t = timing.getPeer(data, prop);
                if (key[0] === 'b') {
                    prop = endProperties[i];
                }
                this._bufferFunctions[key].forEach((fxn, ff) => {
                    tempArray[ff] = fxn(prop, t);
                });
                this._geometry.setPrefabData(key, i + startIndex, tempArray);
            }
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
        this._mesh.material = this._animateMaterial;
        let tempArray = [],
            updateUniforms = {},
            pt = timing.getPropTimes('effect');

        // Update time uniforms, for effect
        effect.glslTimeProps.forEach((p) => {
            updateUniforms[`t_start_${p}`] = pt.start;
            updateUniforms[`t_end_${p}`] = pt.end;
        });

        effect.glslHardTimeProps.forEach((p) => {
            updateUniforms[`t_start_${p.name}`] = p.start;
            updateUniforms[`t_end_${p.name}`] = p.end;
        });

        this._animateMaterial.setUniformValues(updateUniforms);

        this._animateBufferKeys.forEach((key) => {
            for (let i = 0; i < properties.length; i++) {
                let prop = properties[i];
                //    TODO how to handle transitioning data?
                let data = dataScopes[i];
                let t = timing.getPeer(data, prop);
                if (effect.glslKeys.indexOf(key) > -1) {
                    prop = _.mapObject(effect.defaultProperties, (v, k) => {
                        return _.isFunction(v) ? v(prop, bounds) : v;
                    });
                }
                this._bufferFunctions[key].forEach((fxn, ff) => {
                    tempArray[ff] = fxn(prop, t);
                });
                this._geometry.setPrefabData(key, i + startIndex, tempArray);
            }
            this._geometry.attributes[key].needsUpdate = true;
        });
    }

    protected _initId() {
        this.id = getElementCounter(this.type);
        this.classId = `${this.type}-${this.id}`;
    }

    protected _initGeometry() {
        this._geometry = new BAS.PrefabBufferGeometry(this._prefab, this.peerCount);
    }

    protected _initBuffers() {
        this._animateBufferKeys.forEach((key) => {
            this._geometry.createAttribute(key, this._bufferFunctions[key].length);
        });
    }

    protected _initAnimateMaterial(vertexParameters, vertexPosition, uniforms) {
        let vertexFunctions = VERTEX_FUNCTIONS.concat(`float useEasing(float t) {
    return t;
}`);
        this._animateMaterial = new BAS.BasicAnimationMaterial({
            transparent: true,
            flatShading: false,
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

    protected _initStaticMaterial(vertexParameters, vertexPosition) {
        this._staticMaterial = new BAS.BasicAnimationMaterial({
            transparent: true,
            flatShading: false,
            uniforms: {
                diffuse: {value: new (THREE.Color as any)(0xffffff)},
                opacity: {value: 1},
            },
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
        });
    }
}
