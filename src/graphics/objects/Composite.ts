import * as THREE from 'three';
import * as BAS from 'three-bas';

import _ from 'underscore';
import IPeerObject from './IPeerObject';
import {EasingOption} from '../../animation/EasingOption';
import {VERTEX_FUNCTIONS} from '../bas/VertexFunctions';
import ObjectTiming from '../../animation/ObjectTiming';
import {getGLSLTimeProp} from '../graphic_utils';
import {AnimationEffect} from '../../animation/AnimationEffect';
import {getElementCounter} from '../../utils/counter';

export default class PeerComposite implements IPeerObject {
    public constructor(count) {
        this.peerCount = count;
        this._initId();
        // This mesh is a dummy object, does not control graphics at all.
        this._mesh = new THREE.Group();
        this._mesh.frustumCulled = false;
    }

    public type: string = 'Composite';
    public id: number = 0;
    public peerCount: number = 0;
    public classId = `${this.type}-${this.id}`;
    protected _mesh;

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
        // this._animateMaterial.setUniformValues({time: value});
    }

    public setEasingOption(easing: EasingOption) {
        //         this._animateMaterial.vertexFunctions = VERTEX_FUNCTIONS.concat(`float useEasing(float t) {
        //     return ${easing.glslCall};
        // }`);
        //         this._animateMaterial.vertexShader = this._animateMaterial.concatVertexShader();
        //         this._animateMaterial.needsUpdate = true;
    }

    public staticProperties(properties: any) {
        // this._mesh.material = this._staticMaterial;
        // let tempArray = [];
        // this._staticBufferKeys.forEach((key) => {
        //     properties.forEach((p, i) => {
        //         this._bufferFunctions[key].forEach((fxn, ff) => {
        //             tempArray[ff] = fxn(p);
        //         });
        //         this._geometry.setPrefabData(key, i, tempArray);
        //     });
        //     this._geometry.attributes[key].needsUpdate = true;
        // });
    }

    public animatePropertiesWithMerge(
        startProperties: any,
        endProperties: any,
        startDataScopes: any,
        endDataScopes: any,
        startIndex: number,
        timing: ObjectTiming
    ) {
        // this._mesh.material = this._animateMaterial;
        // let tempArray = [];
        // let propMap = timing.getPropTimeMap();
        // let updateUniforms = {};
        // _.keys(propMap).forEach((key) => {
        //     let t = propMap[key];
        //     updateUniforms[`t_start_${getGLSLTimeProp(key)}`] = t.start;
        //     updateUniforms[`t_end_${getGLSLTimeProp(key)}`] = t.end;
        // });
        // this._animateMaterial.setUniformValues(updateUniforms);
        // this._animateBufferKeys.forEach((key) => {
        //     for (let i = 0; i < startProperties.length; i++) {
        //         let prop = startProperties[i];
        //         //    TODO how to handle transitioning data?
        //         let data = startDataScopes[i];
        //         let t = timing.getPeer(data, prop);
        //         if (key[0] === 'b') {
        //             prop = endProperties[i];
        //         }
        //         this._bufferFunctions[key].forEach((fxn, ff) => {
        //             tempArray[ff] = fxn(prop, t);
        //         });
        //         this._geometry.setPrefabData(key, i + startIndex, tempArray);
        //     }
        //     this._geometry.attributes[key].needsUpdate = true;
        // });
    }

    public animateProperties(
        startProperties: any,
        endProperties: any,
        startDataScopes: any,
        endDataScopes: any,
        startIndex: number,
        timing: ObjectTiming
    ) {
        // this._mesh.material = this._animateMaterial;
        // let tempArray = [];
        // let propMap = timing.getPropTimeMap();
        // let updateUniforms = {};
        // _.keys(propMap).forEach((key) => {
        //     let t = propMap[key];
        //     updateUniforms[`t_start_${getGLSLTimeProp(key)}`] = t.start;
        //     updateUniforms[`t_end_${getGLSLTimeProp(key)}`] = t.end;
        // });
        // this._animateMaterial.setUniformValues(updateUniforms);
        // this._animateBufferKeys.forEach((key) => {
        //     for (let i = 0; i < startProperties.length; i++) {
        //         let prop = startProperties[i];
        //         //    TODO how to handle transitioning data?
        //         let data = startDataScopes[i];
        //         let t = timing.getPeer(data, prop);
        //         if (key[0] === 'b') {
        //             prop = endProperties[i];
        //         }
        //         this._bufferFunctions[key].forEach((fxn, ff) => {
        //             tempArray[ff] = fxn(prop, t);
        //         });
        //         this._geometry.setPrefabData(key, i + startIndex, tempArray);
        //     }
        //     this._geometry.attributes[key].needsUpdate = true;
        // });
    }

    public animatePropertiesWithEffect(
        properties: any,
        dataScopes: any,
        startIndex: number,
        timing: ObjectTiming,
        effect: AnimationEffect,
        bounds: any
    ) {
        // this._mesh.material = this._animateMaterial;
        // let tempArray = [],
        //     updateUniforms = {},
        //     pt = timing.getPropTimes('effect');
        //
        // // Update time uniforms, for effect
        // effect.glslTimeProps.forEach((p) => {
        //     updateUniforms[`t_start_${p}`] = pt.start;
        //     updateUniforms[`t_end_${p}`] = pt.end;
        // });
        //
        // this._animateMaterial.setUniformValues(updateUniforms);
        //
        // this._animateBufferKeys.forEach((key) => {
        //     for (let i = 0; i < properties.length; i++) {
        //         let prop = properties[i];
        //         //    TODO how to handle transitioning data?
        //         let data = dataScopes[i];
        //         let t = timing.getPeer(data, prop);
        //         if (effect.glslKeys.indexOf(key) > -1) {
        //             prop = _.mapObject(effect.defaultProperties, (v, k) => {
        //                 return _.isFunction(v) ? v(prop, bounds) : v;
        //             });
        //         }
        //         this._bufferFunctions[key].forEach((fxn, ff) => {
        //             tempArray[ff] = fxn(prop, t);
        //         });
        //         this._geometry.setPrefabData(key, i + startIndex, tempArray);
        //     }
        //     this._geometry.attributes[key].needsUpdate = true;
        // });
    }

    protected _initId() {
        this.id = getElementCounter(this.type);
        this.classId = `${this.type}-${this.id}`;
    }
}
