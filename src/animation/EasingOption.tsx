import * as d3 from 'd3';
import _ from 'underscore';
import {iconWrapper} from '../views/common/CustomIcon';
import React from 'react';

export class EasingOption {
    constructor(
        title: string,
        glslCall: string,
        timeFunction: (normalizedTime: number) => number,
        isCustom?: boolean,
        customProperties?: any
    ) {
        this.title = title;
        this.glslCall = glslCall;
        this.timeFunction = timeFunction;

        this.isCustom = isCustom;
        this.customProperties = customProperties;
        this.line36 = this.getCurve(36, 36);
        this.icon = iconWrapper(
            <g transform="translate(6,6)">
                <path
                    d={this.line36}
                    style={{
                        stroke: 'currentColor',
                        fill: 'none',
                        strokeWidth: '4px',
                        strokeLinecap: 'round',
                    }}
                />
            </g>,
            this.glslCall,
            16
        );
    }

    public title: string;
    public glslCall: string;
    public timeFunction: any;
    public isCustom: boolean;
    public customProperties: any;
    public icon: any;
    public line36: string;

    public getCurve = (width: number, height: number): string => {
        X_SCALE.range([0, width]);
        Y_SCALE.range([height, 0]);
        return LINE(
            d3
                .ticks(0, 1, width)
                .map((t) => [X_SCALE(t), Y_SCALE(this.timeFunction(t))])
        );
    };
}

const X_SCALE = d3.scaleLinear();
const Y_SCALE = d3.scaleLinear();
const LINE = d3.line();

const EASE_LINEAR = new EasingOption('Ease Linear', 't', d3.easeLinear);
const EASE_BACK_IN = new EasingOption(
    'Ease Back In',
    'easeBackIn(t)',
    d3.easeBackIn
);
const EASE_BACK_IN_OUT = new EasingOption(
    'Ease Back In/Out',
    'easeBackInOut(t)',
    d3.easeBackInOut
);
const EASE_BACK_OUT = new EasingOption(
    'Ease Back Out',
    'easeBackOut(t)',
    d3.easeBackOut
);
const EASE_BOUNCE_IN = new EasingOption(
    'Ease Bounce In',
    'easeBounceIn(t)',
    d3.easeBounceIn
);
const EASE_BOUNCE_IN_OUT = new EasingOption(
    'Ease Bounce In/Out',
    'easeBounceInOut(t)',
    d3.easeBounceInOut
);
const EASE_BOUNCE_OUT = new EasingOption(
    'Ease Bounce Out',
    'easeBounceOut(t)',
    d3.easeBounceOut
);
const EASE_CIRCLE_IN = new EasingOption(
    'Ease Circle In',
    'easeCircIn(t)',
    d3.easeCircleIn
);
const EASE_CIRCLE_IN_OUT = new EasingOption(
    'Ease Circle In/Out',
    'easeCircInOut(t)',
    d3.easeCircleInOut
);
const EASE_CIRCLE_OUT = new EasingOption(
    'Ease Circle Out',
    'easeCircOut(t)',
    d3.easeCircleOut
);
const EASE_SINE_IN = new EasingOption('Ease Sine In', 'easeSineIn(t)', d3.easeSinIn);
const EASE_SINE_IN_OUT = new EasingOption(
    'Ease Sine In/Out',
    'easeSineInOut(t)',
    d3.easeSinInOut
);
const EASE_SINE_OUT = new EasingOption(
    'Ease Sine Out',
    'easeSineOut(t)',
    d3.easeSinOut
);
const EASE_CUBIC_IN = new EasingOption(
    'Ease Cubic In',
    'easeCubicIn(t)',
    d3.easeCubicIn
);
const EASE_CUBIC_IN_OUT = new EasingOption(
    'Ease Cubic In/Out',
    'easeCubicInOut(t)',
    d3.easeCubicInOut
);
const EASE_CUBIC_OUT = new EasingOption(
    'Ease Cubic Out',
    'easeCubicOut(t)',
    d3.easeCubicOut
);
const EASE_ELASTIC_IN = new EasingOption(
    'Ease Elastic In',
    'easeElasticIn(t)',
    d3.easeElasticIn
);
const EASE_ELASTIC_IN_OUT = new EasingOption(
    'Ease Elastic In/Out',
    'easeElasticInOut(t)',
    d3.easeElasticInOut
);
const EASE_ELASTIC_OUT = new EasingOption(
    'Ease Elastic Out',
    'easeElasticOut(t)',
    d3.easeElasticOut
);
const EASE_EXP_IN = new EasingOption(
    'Ease Exponential In',
    'easeExpoIn(t)',
    d3.easeExpIn
);
const EASE_EXP_IN_OUT = new EasingOption(
    'Ease Exponential In/Out',
    'easeExpoInOut(t)',
    d3.easeExpInOut
);
const EASE_EXP_OUT = new EasingOption(
    'Ease Exponential Out',
    'easeExpoOut(t)',
    d3.easeExpOut
);
const EASE_QUAD_IN = new EasingOption(
    'Ease Quad In',
    'easeQuadIn(t)',
    d3.easeQuadIn
);
const EASE_QUAD_IN_OUT = new EasingOption(
    'Ease Quad In/Out',
    'easeQuadInOut(t)',
    d3.easeQuadInOut
);
const EASE_QUAD_OUT = new EasingOption(
    'Ease Quad Out',
    'easeQuadOut(t)',
    d3.easeQuadOut
);
const EASE_QUART_IN = new EasingOption(
    'Ease Quart In',
    'easeQuartIn(t)',
    d3.easePolyIn.exponent(4)
);
const EASE_QUART_IN_OUT = new EasingOption(
    'Ease Quart In/Out',
    'easeQuartInOut(t)',
    d3.easePolyInOut.exponent(4)
);
const EASE_QUART_OUT = new EasingOption(
    'Ease Quart Out',
    'easeQuartOut(t)',
    d3.easePolyOut.exponent(4)
);
const EASE_QUINT_IN = new EasingOption(
    'Ease Quint In',
    'easeQuintIn(t)',
    d3.easePolyIn.exponent(5)
);
const EASE_QUINT_IN_OUT = new EasingOption(
    'Ease Quint In/Out',
    'easeQuintInOut(t)',
    d3.easePolyInOut.exponent(5)
);
const EASE_QUINT_OUT = new EasingOption(
    'Ease Quint Out',
    'easeQuintOut(t)',
    d3.easePolyOut.exponent(5)
);

export const EasingOptionList = [
    EASE_LINEAR,
    EASE_BACK_IN,
    EASE_BACK_IN_OUT,
    EASE_BACK_OUT,
    EASE_BOUNCE_IN,
    EASE_BOUNCE_IN_OUT,
    EASE_BOUNCE_OUT,
    EASE_CIRCLE_IN,
    EASE_CIRCLE_IN_OUT,
    EASE_CIRCLE_OUT,
    EASE_SINE_IN,
    EASE_SINE_IN_OUT,
    EASE_SINE_OUT,
    EASE_CUBIC_IN,
    EASE_CUBIC_IN_OUT,
    EASE_CUBIC_OUT,
    EASE_ELASTIC_IN,
    EASE_ELASTIC_IN_OUT,
    EASE_ELASTIC_OUT,
    EASE_EXP_IN,
    EASE_EXP_IN_OUT,
    EASE_EXP_OUT,
    EASE_QUAD_IN,
    EASE_QUAD_IN_OUT,
    EASE_QUAD_OUT,
    EASE_QUART_IN,
    EASE_QUART_IN_OUT,
    EASE_QUART_OUT,
    EASE_QUINT_IN,
    EASE_QUINT_IN_OUT,
    EASE_QUINT_OUT,
];
