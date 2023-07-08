import IPeerObject from './IPeerObject';
import PeerObject from './PeerObject';

import * as THREE from 'three';
import * as d3 from 'd3';

export default class PeerRectangle extends PeerObject implements IPeerObject {
    public constructor(count) {
        super(count);
        this._initId();
        this._initGeometry();
        this._initBuffers();
        this._initStaticMaterial(STATIC_VERTEX_PARAMETERS, STATIC_VERTEX_POSITION);
        this._initAnimateMaterial(
            ANIMATE_VERTEX_PARAMETERS,
            ANIMATE_VERTEX_POSITION,
            ANIMATE_UNIFORMS
        );
        this._mesh = new THREE.Mesh(this._geometry, this._staticMaterial);
        this._mesh.frustumCulled = false;
    }
    public type: string = 'Rectangle';

    protected _prefab = new THREE.PlaneGeometry(GL_WIDTH, GL_HEIGHT);
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
}

const GL_WIDTH = 10;
const GL_HEIGHT = 10;

const FUNCTIONS = {
    POSITION: [(p) => p.left + p.width / 2, (p) => -p.height / 2 - p.top],
    SCALE: [(p) => p.width / GL_WIDTH, (p) => p.height / GL_HEIGHT],
    COLOR: [
        (p) => d3.rgb(p.fillColor).r,
        (p) => d3.rgb(p.fillColor).g,
        (p) => d3.rgb(p.fillColor).b,
    ],
    OPACITY: [(p) => p.opacity],
    START: [(p, t) => t[0]],
    DURATION: [(p, t) => t[1]],
};

const STATIC_VERTEX_PARAMETERS = [
    'attribute vec2 a_position;',
    'attribute vec2 a_scale;',
    'attribute vec3 a_fill_color;',
    'attribute float a_opacity;',

    'varying vec3 v_fill_color;',
    'varying float v_opacity;',
];

const STATIC_VERTEX_POSITION = [
    'transformed *= vec3(a_scale, 1.0);',
    'transformed += vec3(a_position, 0.0);',
    'v_opacity = a_opacity;',
    'v_fill_color = a_fill_color;',
];

const ANIMATE_VERTEX_PARAMETERS = [
    'uniform float time;',
    'uniform float t_start_y_position;',
    'uniform float t_end_y_position;',
    'uniform float t_start_x_position;',
    'uniform float t_end_x_position;',
    'uniform float t_start_width;',
    'uniform float t_end_width;',
    'uniform float t_start_height;',
    'uniform float t_end_height;',
    'uniform float t_start_fill_color;',
    'uniform float t_end_fill_color;',
    'uniform float t_start_stroke_color;',
    'uniform float t_end_stroke_color;',
    'uniform float t_start_stroke_width;',
    'uniform float t_end_stroke_width;',
    'uniform float t_start_opacity;',
    'uniform float t_end_opacity;',

    'attribute float start_time;',
    'attribute float duration_time;',
    'attribute vec2 a_position;',
    'attribute vec2 a_scale;',
    'attribute vec2 b_position;',
    'attribute vec2 b_scale;',

    'attribute float a_opacity;',
    'attribute vec3 a_fill_color;',
    'attribute float b_opacity;',
    'attribute vec3 b_fill_color;',

    'varying float v_opacity;',
    'varying vec3 v_fill_color;',
];

const ANIMATE_VERTEX_POSITION = [
    'float progress = linearInterpDuration(time, start_time, duration_time);',

    'float x = mix(a_position.x, b_position.x, ' +
        'useEasing(linearInterpClamp(progress, t_start_x_position, t_end_x_position)));',
    'float y = mix(a_position.y, b_position.y, ' +
        'useEasing(linearInterpClamp(progress, t_start_y_position, t_end_y_position)));',
    'float width = mix(a_scale.x, b_scale.x, useEasing(linearInterpClamp(progress, t_start_width, t_end_width)));',
    'float height = mix(a_scale.y, b_scale.y, useEasing(linearInterpClamp(progress, t_start_height, t_end_height)));',

    'transformed *= vec3(width, height, 1.0);',
    'transformed += vec3(x, y, 0.0);',
    'v_opacity = mix(a_opacity, b_opacity, useEasing(linearInterpClamp(progress, t_start_opacity, t_end_opacity)));',
    'v_fill_color = mix(a_fill_color, b_fill_color, ' +
        'useEasing(linearInterpClamp(progress, t_start_fill_color, t_end_fill_color)));',
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
    t_start_opacity: {value: 0},
    t_end_opacity: {value: 1},
};
