import * as THREE from 'three';
import * as BAS from 'three-bas';

import _ from 'underscore';

import {VERTEX_FUNCTIONS} from '../bas/VertexFunctions';
import NonUniformVertexBufferGeometry from '../bas/NonUniformVertexBufferGeometry';

import IPeerObject from './IPeerObject';
import {getElementCounter} from '../../utils/counter';
import ObjectTiming from '../../animation/ObjectTiming';
import {getGLSLTimeProp} from '../graphic_utils';
import * as d3 from 'd3';
import {EasingOption} from '../../animation/EasingOption';
import {AnimationEffect} from '../../animation/AnimationEffect';

export default class PeerPath implements IPeerObject {
    public constructor(count, properties) {
        this.idList = _.range(count);
        this.peerCount = count;

        this._initId();
        properties.forEach((p) => {
            this.vertexCounts.push(
                this._processGeometry(
                    p.path[1].segments,
                    this.position,
                    this.a_previous,
                    this.a_next
                )
            );
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

    public type: string = 'Path';

    protected _prefab = new THREE.BufferGeometry();

    public id: number = 0;
    public peerCount: number = 0;
    public vertexCounts: number[] = [];
    public classId = `${this.type}-${this.id}`;
    protected idList;
    protected _mesh;
    protected _geometry;
    protected _animateMaterial;
    protected _staticMaterial;

    protected position = [];
    protected a_previous = [];
    protected a_next = [];
    protected b_position = [];
    protected b_previous = [];
    protected b_next = [];
    protected side = [];
    protected indices_array = [];
    protected counters = [];

    protected _bufferFunctions = {
        a_stroke_color: FUNCTIONS.STROKE_COLOR,
        b_stroke_color: FUNCTIONS.STROKE_COLOR,
        a_opacity: FUNCTIONS.OPACITY,
        b_opacity: FUNCTIONS.OPACITY,
        a_line_width: FUNCTIONS.STROKE_WIDTH,
        b_line_width: FUNCTIONS.STROKE_WIDTH,
        start_time: FUNCTIONS.START,
        duration_time: FUNCTIONS.DURATION,
    };
    protected _staticBufferKeys = ['a_stroke_color', 'a_opacity', 'a_line_width'];
    protected _animateBufferKeys = [
        'start_time',
        'duration_time',
        'a_stroke_color',
        'a_opacity',
        'a_line_width',
        'b_stroke_color',
        'b_opacity',
        'b_line_width',
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
        this.position = [];
        this.a_previous = [];
        this.a_next = [];
        this.idList.forEach((id) => {
            let p = properties[id];
            this._updateGeometry(
                p.path[1].segments,
                this.position,
                this.a_previous,
                this.a_next
            );
        });
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

    public animateProperties(
        startProperties: any,
        endProperties: any,
        startDataScopes: any,
        endDataScopes: any,
        startIndex: number,
        timing: ObjectTiming
    ) {
        this._mesh.material = this._animateMaterial;
        this.position = [];
        this.a_previous = [];
        this.a_next = [];
        this.b_position = [];
        this.b_previous = [];
        this.b_next = [];
        this.idList.forEach((id) => {
            let pA = startProperties[id];
            this._updateGeometry(
                pA.path[1].segments,
                this.position,
                this.a_previous,
                this.a_next
            );
            let pB = endProperties[id];
            this._updateGeometry(
                pB.path[1].segments,
                this.b_position,
                this.b_previous,
                this.b_next
            );
        });
        this._setAttributesA();
        this._setAttributesB();

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
        this.position = [];
        this.a_previous = [];
        this.a_next = [];
        this.b_position = [];
        this.b_previous = [];
        this.b_next = [];
        this.idList.forEach((id) => {
            let pA = properties[id];
            this._updateGeometry(
                pA.path[1].segments,
                this.position,
                this.a_previous,
                this.a_next
            );
            let pB = properties[id];
            this._updateGeometry(
                pB.path[1].segments,
                this.b_position,
                this.b_previous,
                this.b_next
            );
        });
        this._setAttributesA();
        this._setAttributesB();

        let tempArray = [],
            pt = timing.getPropTimes('effect'),
            updateUniforms = {};

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

    protected _initStaticMaterial(vertexParameters, vertexPosition) {
        let props = {
            useMap: false,
        };
        let defaultProps = {
            transparent: true,
            flatShading: THREE.FlatShading,
            vertexParameters,
            vertexFunctions: [],
            vertexPosition,
            fragmentParameters: ['varying vec4 v_stroke_color;'],
            fragmentDiffuse: ['diffuseColor = v_stroke_color;'],
        };
        let materialProps = _.assign(defaultProps, {
            uniforms: {
                time: {value: 0},
                lineWidth: {type: 'f', value: check(props['lineWidth'], 1)},
                map: {type: 't', value: check(props['map'], null)},
                useMap: {type: 'f', value: check(props['useMap'], 0)},
                alphaMap: {type: 't', value: check(props['alphaMap'], null)},
                useAlphaMap: {type: 'f', value: check(props['useAlphaMap'], 0)},
                color: {
                    type: 'c',
                    value: check(props['color'], new THREE.Color(0xffffff)),
                },
                opacity: {type: 'f', value: check(props['opacity'], 1)},
                sizeAttenuation: {
                    type: 'f',
                    value: check(props['sizeAttenuation'], 1),
                },
                dashArray: {type: 'f', value: check(props['dashArray'], 0)},
                dashOffset: {type: 'f', value: check(props['dashOffset'], 0)},
                dashRatio: {type: 'f', value: check(props['dashRatio'], 0.5)},
                useDash: {type: 'f', value: props['dashArray'] !== 0 ? 1 : 0},
                visibility: {type: 'f', value: check(props['visibility'], 1)},
                alphaTest: {type: 'f', value: check(props['alphaTest'], 0)},
                repeat: {
                    type: 'v2',
                    value: check(props['repeat'], new THREE.Vector2(1, 1)),
                },
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
            this.vertexCounts,
            this.peerCount
        );
    }

    // protected _initBuffers() {
    //     this._animateBufferKeys.forEach((key) => {
    //         this._geometry.createAttribute(key, this._bufferFunctions[key].length);
    //     });
    // }

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
            fragmentParameters: ['varying vec4 v_stroke_color;'],
            fragmentDiffuse: ['diffuseColor = v_stroke_color;'],
        });
    }

    private _processGeometry(
        segments,
        position: number[],
        previous: number[],
        next: number[]
    ): number {
        let l = segments.length;
        let positionOffset = position.length / 6,
            indicesOffset = position.length / 3;
        if (segments instanceof Float32Array || segments instanceof Array) {
            if (segments.length > 0 && segments[0] instanceof Array) {
                for (let j = 0; j < segments.length; j++) {
                    let c = j / segments.length;
                    position.push(segments[j][0], -segments[j][1], 0.0);
                    position.push(segments[j][0], -segments[j][1], 0.0);
                    this.counters.push(c);
                    this.counters.push(c);
                }
            } else {
                for (let j = 0; j < segments.length; j += 2) {
                    let c = j / segments.length;
                    position.push(segments[j], segments[j + 1], segments[j + 2]);
                    position.push(segments[j], segments[j + 1], segments[j + 2]);
                    this.counters.push(c);
                    this.counters.push(c);
                }
                l = segments.length / 3;
            }
        }

        for (let j = 0; j < l; j++) {
            this.side.push(1);
            this.side.push(-1);
        }

        let v;
        if (COMPARE_V3(position, indicesOffset, l - 1 + positionOffset)) {
            v = COPY_V3(position, l - 2 + positionOffset);
        } else {
            v = COPY_V3(position, positionOffset);
        }
        previous.push(v[0], v[1], v[2]);
        previous.push(v[0], v[1], v[2]);
        for (let j = 0; j < l - 1; j++) {
            v = COPY_V3(position, j + positionOffset);
            previous.push(v[0], v[1], v[2]);
            previous.push(v[0], v[1], v[2]);
        }

        for (let j = 1; j < l; j++) {
            v = COPY_V3(position, j + positionOffset);
            next.push(v[0], v[1], v[2]);
            next.push(v[0], v[1], v[2]);
        }

        if (COMPARE_V3(position, l - 1 + positionOffset, 0)) {
            v = COPY_V3(position, 1 + positionOffset);
        } else {
            v = COPY_V3(position, l - 1 + positionOffset);
        }
        next.push(v[0], v[1], v[2]);
        next.push(v[0], v[1], v[2]);

        for (let j = 0; j < l - 1; j++) {
            let n = j * 2 + indicesOffset;
            this.indices_array.push(n, n + 1, n + 2);
            this.indices_array.push(n + 2, n + 1, n + 3);
        }

        return l * 2;
    }

    private _updateGeometry(
        segments,
        position: number[],
        previous: number[],
        next: number[]
    ) {
        let l = segments.length;
        let positionOffset = position.length / 6,
            indicesOffset = position.length / 3;
        if (segments instanceof Float32Array || segments instanceof Array) {
            if (segments.length > 0 && segments[0] instanceof Array) {
                for (let j = 0; j < segments.length; j++) {
                    let c = j / segments.length;
                    position.push(segments[j][0], -segments[j][1], 0.0);
                    position.push(segments[j][0], -segments[j][1], 0.0);
                }
            } else {
                for (let j = 0; j < segments.length; j += 2) {
                    let c = j / segments.length;
                    position.push(segments[j], segments[j + 1], segments[j + 2]);
                    position.push(segments[j], segments[j + 1], segments[j + 2]);
                }
                l = segments.length / 3;
            }
        }

        let v;
        if (COMPARE_V3(position, indicesOffset, l - 1 + positionOffset)) {
            v = COPY_V3(position, l - 2 + positionOffset);
        } else {
            v = COPY_V3(position, positionOffset);
        }
        previous.push(v[0], v[1], v[2]);
        previous.push(v[0], v[1], v[2]);
        for (let j = 0; j < l - 1; j++) {
            v = COPY_V3(position, j + positionOffset);
            previous.push(v[0], v[1], v[2]);
            previous.push(v[0], v[1], v[2]);
        }

        for (let j = 1; j < l; j++) {
            v = COPY_V3(position, j + positionOffset);
            next.push(v[0], v[1], v[2]);
            next.push(v[0], v[1], v[2]);
        }

        if (COMPARE_V3(position, l - 1 + positionOffset, 0)) {
            v = COPY_V3(position, 1 + positionOffset);
        } else {
            v = COPY_V3(position, l - 1 + positionOffset);
        }
        next.push(v[0], v[1], v[2]);
        next.push(v[0], v[1], v[2]);
    }

    private _addAttributes() {
        this._geometry.createAttribute('a_stroke_color', 3);
        this._geometry.createAttribute('b_stroke_color', 3);
        this._geometry.createAttribute('a_opacity', 1);
        this._geometry.createAttribute('b_opacity', 1);
        this._geometry.createAttribute('a_line_width', 1);
        this._geometry.createAttribute('b_line_width', 1);
        this._geometry.createAttribute('position', 3);
        this._geometry.createAttribute('b_position', 3);
        this._geometry.createAttribute('a_previous', 3);
        this._geometry.createAttribute('b_previous', 3);
        this._geometry.createAttribute('a_next', 3);
        this._geometry.createAttribute('b_next', 3);
        this._geometry.createAttribute('counters', 1);
        this._geometry.createAttribute('side', 1);
        this._geometry.createAttribute('start_time', 1);
        this._geometry.createAttribute('duration_time', 1);

        this._geometry.setAttributeArray('side', new Float32Array(this.side));
        this._geometry.setAttributeArray(
            'counters',
            new Float32Array(this.counters)
        );
        this._geometry.setIndex(
            new THREE.BufferAttribute(new Uint16Array(this.indices_array), 1)
        );
    }

    private _setAttributesA() {
        this._geometry.setAttributeArray(
            'position',
            new Float32Array(this.position)
        );
        this._geometry.setAttributeArray(
            'a_previous',
            new Float32Array(this.a_previous)
        );
        this._geometry.setAttributeArray('a_next', new Float32Array(this.a_next));
    }

    private _setAttributesB() {
        this._geometry.setAttributeArray(
            'b_position',
            new Float32Array(this.b_position)
        );
        this._geometry.setAttributeArray(
            'b_previous',
            new Float32Array(this.b_previous)
        );
        this._geometry.setAttributeArray('b_next', new Float32Array(this.b_next));
    }
}

const COMPARE_V3 = (position: number[], a: number, b: number): boolean => {
    let aa = a * 6,
        bb = b * 6;
    return (
        position[aa] === position[bb] &&
        position[aa + 1] === position[bb + 1] &&
        position[aa + 2] === position[bb + 2]
    );
};

const COPY_V3 = (position: number[], a: number): number[] => {
    let aa = a * 6;
    return [position[aa], position[aa + 1], position[aa + 2]];
};

const STATIC_VERTEX_PARAMETERS = [
    'attribute float side;',
    'attribute float counters;',
    // 'attribute vec3 position;',
    'attribute vec3 a_previous;',
    'attribute vec3 a_next;',
    'attribute vec3 a_stroke_color;',
    'attribute float a_opacity;',
    'attribute float a_line_width;',

    'varying vec4 v_stroke_color;',
    'varying float v_counters;',
];

const STATIC_VERTEX_POSITION = [
    'v_stroke_color = vec4(a_stroke_color, a_opacity);',
    'v_counters = counters;',

    'vec3 final_position = vec3(position);',

    'vec2 dir = vec2(0.0);',
    'float w = a_line_width;',

    'if( a_next == position ) {',
    '    dir = normalize( position.xy - a_previous.xy );',
    '} else if( a_previous == position ) {',
    '    dir = normalize( a_next.xy - position.xy );',
    '} else {',
    '    vec2 dir_a = normalize(position.xy - a_previous.xy);',
    '    vec2 dir_b = normalize(a_next.xy - position.xy );',
    '    dir = normalize(dir_a + dir_b);',
    '    vec2 perp = vec2(-dir_a.y, dir_a.x);',
    '    vec2 miter = vec2(-dir.y, dir.x);',
    '    float miter_dot = dot(miter, perp);',
    '    w = miter_dot == 0.0 ? 0.0 : (w / miter_dot);',
    '    w = (w < 0.0 || w > a_line_width * 10.0) ? a_line_width : w;',
    '}',

    'vec2 normal = vec2( -dir.y, dir.x );',
    'normal *= 0.5 * w;',

    'vec4 offset = vec4(normal * side, 0.0, 0.0);',
    'final_position.xy += offset.xy;',
    'transformed = final_position.xyz;',
];

const ANIMATE_VERTEX_PARAMETERS = [
    'uniform float time;',
    'uniform float t_start_stroke_color;',
    'uniform float t_end_stroke_color;',
    'uniform float t_start_stroke_width;',
    'uniform float t_end_stroke_width;',
    'uniform float t_start_opacity;',
    'uniform float t_end_opacity;',

    'attribute float start_time;',
    'attribute float duration_time;',

    'attribute float side;',
    'attribute float counters;',
    // 'attribute vec3 position;',
    'attribute vec3 b_position;',
    'attribute vec3 a_previous;',
    'attribute vec3 b_previous;',
    'attribute vec3 a_next;',
    'attribute vec3 b_next;',
    'attribute vec3 a_stroke_color;',
    'attribute vec3 b_stroke_color;',
    'attribute float a_opacity;',
    'attribute float b_opacity;',
    'attribute float a_line_width;',
    'attribute float b_line_width;',

    'varying vec4 v_stroke_color;',
    'varying float v_counters;',
];

const ANIMATE_VERTEX_POSITION = [
    'float progress = linearInterpDuration(time, start_time, duration_time);',

    'float line_width = mix(a_line_width, b_line_width,' +
        ' useEasing(linearInterpClamp(progress, t_start_stroke_width, t_end_stroke_width)));',
    'vec3 stroke_color = mix(a_stroke_color, b_stroke_color,' +
        ' useEasing(linearInterpClamp(progress, t_start_stroke_color, t_end_stroke_color)));',
    'float v_opacity = mix(a_opacity, b_opacity, ' +
        'useEasing(linearInterpClamp(progress, t_start_opacity, t_end_opacity)));',
    'v_stroke_color = vec4(stroke_color, v_opacity);',
    'v_counters = counters;',

    'vec3 final_position = mix(position, b_position, useEasing(progress));',
    'vec3 prev_position = mix(a_previous, b_previous, useEasing(progress));',
    'vec3 next_position = mix(a_next, b_next, useEasing(progress));',

    'vec2 dir = vec2(0.0);',
    'float w = line_width;',

    'if( next_position == final_position ) {',
    '    dir = normalize( final_position.xy - prev_position.xy );',
    '} else if( prev_position == final_position ) {',
    '    dir = normalize( next_position.xy - final_position.xy );',
    '} else {',
    '    vec2 dir_a = normalize(final_position.xy - prev_position.xy);',
    '    vec2 dir_b = normalize(next_position.xy - final_position.xy );',
    '    dir = normalize(dir_a + dir_b);',
    '    vec2 perp = vec2(-dir_a.y, dir_a.x);',
    '    vec2 miter = vec2(-dir.y, dir.x);',
    '    float miter_dot = dot(miter, perp);',
    '    w = miter_dot == 0.0 ? 0.0 : (w / miter_dot);',
    '    w = (w < 0.0 || w > line_width * 10.0) ? line_width : w;',
    '}',

    'vec2 normal = vec2( -dir.y, dir.x );',
    'normal *= 0.5 * w;',

    'vec4 offset = vec4(normal * side, 0.0, 0.0);',
    'final_position.xy += offset.xy;',
    'transformed = final_position.xyz;',
];

const ANIMATE_UNIFORMS = {
    // diffuse: {value: new (THREE.Color as any)(0xffffff)},
    time: {value: 0},
    t_start_stroke_color: {value: 0},
    t_end_stroke_color: {value: 1},
    t_start_stroke_width: {value: 0},
    t_end_stroke_width: {value: 1},
    t_start_opacity: {value: 0},
    t_end_opacity: {value: 1},
    useMap: {value: false},
};

const FUNCTIONS = {
    STROKE_WIDTH: [(p) => p.path[1].strokeWidth],
    STROKE_COLOR: [
        (p) => p.path[1].strokeColor[0],
        (p) => p.path[1].strokeColor[1],
        (p) => p.path[1].strokeColor[2],
    ],
    OPACITY: [(p) => p.opacity],
    START: [(p, t) => t[0]],
    DURATION: [(p, t) => t[1]],
};

function check(v, d) {
    if (v === undefined) return d;
    return v;
}
