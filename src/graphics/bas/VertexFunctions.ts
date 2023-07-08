import * as THREE from 'three';
import * as BAS from 'three-bas';

const linear_interp = `float linearInterpClamp(float t, float a, float b) {
    return max(0.0, min(1.0, ((t - a) / (b - a))));
}

float linearInterpDuration(float t, float a, float d) {
    return max(0.0, min(1.0, ((t - a) / d)));
}`;

export const VERTEX_FUNCTIONS = [
    'catmull_rom_spline',
    'ease_back_in',
    'ease_back_in_out',
    'ease_back_out',
    'ease_bezier',
    'ease_bounce_in',
    'ease_bounce_in_out',
    'ease_bounce_out',
    'ease_circ_in',
    'ease_circ_in_out',
    'ease_circ_out',
    'ease_cubic_in',
    'ease_cubic_in_out',
    'ease_cubic_out',
    'ease_elastic_in',
    'ease_elastic_in_out',
    'ease_elastic_out',
    'ease_expo_in',
    'ease_expo_in_out',
    'ease_expo_out',
    'ease_quad_in',
    'ease_quad_in_out',
    'ease_quad_out',
    'ease_quart_in',
    'ease_quart_in_out',
    'ease_quart_out',
    'ease_quint_in',
    'ease_quint_in_out',
    'ease_quint_out',
    'ease_sine_in',
    'ease_sine_in_out',
    'ease_sine_out',
    'cubic_bezier',
    'quadratic_bezier',
    'quaternion_rotation',
    'quaternion_slerp',
]
    .map((k) => BAS.ShaderChunk[k])
    .concat(linear_interp);
