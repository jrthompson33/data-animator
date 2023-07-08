export class AnimationEffect {
    constructor(
        type: 'enter' | 'exit',
        title: string,
        direction: string,
        glslKeys: string[],
        glslTimeProps: string[],
        glslHardTimeProps: any[],
        defaultProperties: any,
        copyProperties?: any
    ) {
        this.type = type;
        this.title = title;
        this.direction = direction;
        this.glslKeys = glslKeys;
        this.glslTimeProps = glslTimeProps;
        this.glslHardTimeProps = glslHardTimeProps;
        this.defaultProperties = defaultProperties;
    }

    public type: 'enter' | 'exit';
    public title: string;
    public direction: string;
    public glslKeys: string[];
    public glslTimeProps: string[];
    public glslHardTimeProps: any[];
    public defaultProperties: any;
}

export interface AnimationEffectGroup {
    title: string;
    effects: AnimationEffect[];
}

const FADE_IN = new AnimationEffect(
    'enter',
    'Fade In',
    '',
    ['a_opacity'],
    ['opacity'],
    [],
    {
        opacity: 0,
    }
);

const FADE_OUT = new AnimationEffect(
    'exit',
    'Fade Out',
    '',
    ['b_opacity'],
    ['opacity'],
    [],
    {
        opacity: 0,
    }
);

const SCALE_IN = new AnimationEffect(
    'enter',
    'Scale In',
    '',
    ['a_scale'],
    ['width', 'height'],
    [],
    {
        width: 0,
        height: 0,
    }
);

const SCALE_OUT = new AnimationEffect(
    'exit',
    'Scale Out',
    '',
    ['b_scale'],
    ['width', 'height'],
    [],
    {
        width: 0,
        height: 0,
    }
);

const FADE_SCALE_IN = new AnimationEffect(
    'enter',
    'Scale & Fade',
    '',
    ['a_opacity', 'a_scale'],
    ['opacity', 'width', 'height'],
    [],
    {
        width: 0,
        height: 0,
        opacity: 0,
    }
);

const FADE_SCALE_OUT = new AnimationEffect(
    'exit',
    'Scale & Fade',
    '',
    ['b_opacity', 'b_scale'],
    ['opacity', 'width', 'height'],
    [],
    {
        width: 0,
        height: 0,
        opacity: 0,
    }
);

const WIPE_LEFT_IN = new AnimationEffect(
    'enter',
    'Wipe → from Left',
    '→ from Left',
    ['a_scale', 'a_position'],
    ['width'],
    [],
    {
        height: (p) => p.height,
        width: 0,
        left: (p) => p.left,
        top: (p) => p.top,
    }
);

const WIPE_LEFT_OUT = new AnimationEffect(
    'exit',
    'Wipe → from Left',
    '→ from Left',
    ['b_scale', 'b_position'],
    ['width', 'x_position'],
    [],
    {
        height: (p) => p.height,
        width: 0,
        left: (p) => p.left + p.width,
        top: (p) => p.top,
    }
);

const WIPE_RIGHT_IN = new AnimationEffect(
    'enter',
    'Wipe ← from Right',
    '← from Right',
    ['a_scale', 'a_position'],
    ['width', 'x_position'],
    [],
    {
        height: (p) => p.height,
        width: 0,
        left: (p) => p.left + p.width,
        top: (p) => p.top,
    }
);

const WIPE_RIGHT_OUT = new AnimationEffect(
    'exit',
    'Wipe ← from Right',
    '← from Right',
    ['b_scale', 'b_position'],
    ['width'],
    [],
    {
        height: (p) => p.height,
        width: 0,
        left: (p) => p.left,
        top: (p) => p.top,
    }
);

const WIPE_TOP_IN = new AnimationEffect(
    'enter',
    'Wipe ↓ from Top',
    '↓ from Top',
    ['a_scale', 'a_position'],
    ['height'],
    [],
    {
        height: 0,
        width: (p) => p.width,
        left: (p) => p.left,
        top: (p) => p.top,
    }
);

const WIPE_TOP_OUT = new AnimationEffect(
    'exit',
    'Wipe ↓ from Top',
    '↓ from Top',
    ['b_scale', 'b_position'],
    ['height', 'y_position'],
    [],
    {
        height: 0,
        width: (p) => p.width,
        left: (p) => p.left,
        top: (p) => p.top + p.height,
    }
);

const WIPE_BOTTOM_IN = new AnimationEffect(
    'enter',
    'Wipe ↑ from Bottom',
    '↑ from Bottom',
    ['a_scale', 'a_position'],
    ['height', 'y_position'],
    [],
    {
        height: 0,
        width: (p) => p.width,
        left: (p) => p.left,
        top: (p) => p.top + p.height,
    }
);

const WIPE_BOTTOM_OUT = new AnimationEffect(
    'exit',
    'Wipe ↑ from Bottom',
    '↑ from Bottom',
    ['b_scale', 'b_position'],
    ['height'],
    [],
    {
        height: 0,
        width: (p) => p.width,
        left: (p) => p.left,
        top: (p) => p.top,
    }
);

const MOVE_LEFT_IN = new AnimationEffect(
    'enter',
    'Move → from Left',
    '→ from Left',
    ['a_position', 'a_opacity'],
    ['x_position'],
    [{name: 'opacity', start: 0, end: 0.01}],
    {
        opacity: 0,
        height: (p) => p.height,
        width: (p) => p.width,
        left: (p, b) => b.left - p.width,
        top: (p) => p.top,
    }
);

const MOVE_LEFT_OUT = new AnimationEffect(
    'exit',
    'Move ← to Left',
    '← to Left',
    ['b_position', 'b_opacity'],
    ['x_position'],
    [{name: 'opacity', start: 0.99, end: 1}],
    {
        opacity: 0,
        height: (p) => p.height,
        width: (p) => p.width,
        left: (p, b) => b.left - p.width,
        top: (p) => p.top,
    }
);

const MOVE_RIGHT_IN = new AnimationEffect(
    'enter',
    'Move ← from Right',
    '← from Right',
    ['a_position', 'a_opacity'],
    ['x_position'],
    [{name: 'opacity', start: 0, end: 0.01}],
    {
        opacity: 0,
        height: (p) => p.height,
        width: (p) => p.width,
        left: (p, b) => b.right,
        top: (p) => p.top,
    }
);

const MOVE_RIGHT_OUT = new AnimationEffect(
    'exit',
    'Move → to Right',
    '→ to Right',
    ['b_position', 'b_opacity'],
    ['x_position'],
    [{name: 'opacity', start: 0.99, end: 1}],
    {
        opacity: 0,
        height: (p) => p.height,
        width: (p) => p.width,
        left: (p, b) => b.right,
        top: (p) => p.top,
    }
);

const MOVE_TOP_IN = new AnimationEffect(
    'enter',
    'Move ↓ from Top',
    '↓ from Top',
    ['a_position', 'a_opacity'],
    ['y_position'],
    [{name: 'opacity', start: 0, end: 0.01}],
    {
        opacity: 0,
        height: (p) => p.height,
        width: (p) => p.width,
        left: (p) => p.left,
        top: (p, b) => b.top - p.height,
    }
);

const MOVE_TOP_OUT = new AnimationEffect(
    'exit',
    'Move ↑ to Top',
    '↑ to Top',
    ['b_position', 'b_opacity'],
    ['y_position'],
    [{name: 'opacity', start: 0.99, end: 1}],
    {
        opacity: 0,
        height: (p) => p.height,
        width: (p) => p.width,
        left: (p) => p.left,
        top: (p, b) => b.top - p.height,
    }
);

const MOVE_BOTTOM_IN = new AnimationEffect(
    'enter',
    'Move ↑ from Bottom',
    '↑ from Bottom',
    ['a_position', 'a_opacity'],
    ['y_position'],
    [{name: 'opacity', start: 0, end: 0.01}],
    {
        opacity: 0,
        height: (p) => p.height,
        width: (p) => p.width,
        left: (p) => p.left,
        top: (p, b) => b.bottom,
    }
);

const MOVE_BOTTOM_OUT = new AnimationEffect(
    'exit',
    'Move ↓ to Bottom',
    '↓ to Bottom',
    ['b_position', 'b_opacity'],
    ['y_position'],
    [{name: 'opacity', start: 0.99, end: 1}],
    {
        opacity: 0,
        height: (p) => p.height,
        width: (p) => p.width,
        left: (p) => p.left,
        top: (p, b) => b.bottom,
    }
);

const MOVE_SCALE_LEFT_IN = new AnimationEffect(
    'enter',
    'Move & Scale → from Left',
    '→ from Left',
    ['a_position', 'a_scale'],
    ['width', 'height', 'x_position'],
    [],
    {
        height: 0,
        width: 0,
        left: (p, b) => b.left,
        top: (p) => p.top,
    }
);

const MOVE_SCALE_LEFT_OUT = new AnimationEffect(
    'exit',
    'Move & Scale ← to Left',
    '← to Left',
    ['b_position', 'b_scale'],
    ['width', 'height', 'x_position'],
    [],
    {
        height: 0,
        width: 0,
        left: (p, b) => b.left,
        top: (p) => p.top,
    }
);

const MOVE_SCALE_RIGHT_IN = new AnimationEffect(
    'enter',
    'Move & Scale ← from Right',
    '← from Right',
    ['a_position', 'a_scale'],
    ['width', 'height', 'x_position'],
    [],
    {
        height: 0,
        width: 0,
        left: (p, b) => b.right,
        top: (p) => p.top,
    }
);

const MOVE_SCALE_RIGHT_OUT = new AnimationEffect(
    'exit',
    'Move & Scale → to Right',
    '→ to Right',
    ['b_position', 'b_scale'],
    ['width', 'height', 'x_position'],
    [],
    {
        height: 0,
        width: 0,
        left: (p, b) => b.right,
        top: (p) => p.top,
    }
);

const MOVE_SCALE_TOP_IN = new AnimationEffect(
    'enter',
    'Move & Scale ↓ from Top',
    '↓ from Top',
    ['a_position', 'a_scale'],
    ['width', 'height', 'y_position'],
    [],
    {
        height: 0,
        width: 0,
        left: (p) => p.left,
        top: (p, b) => b.top,
    }
);

const MOVE_SCALE_TOP_OUT = new AnimationEffect(
    'exit',
    'Move & Scale ↑ to Top',
    '↑ to Top',
    ['b_position', 'b_scale'],
    ['width', 'height', 'y_position'],
    [],
    {
        height: 0,
        width: 0,
        left: (p) => p.left,
        top: (p, b) => b.top,
    }
);

const MOVE_SCALE_BOTTOM_IN = new AnimationEffect(
    'enter',
    'Move & Scale ↑ from Bottom',
    '↑ from Bottom',
    ['a_position', 'a_scale'],
    ['width', 'height', 'y_position'],
    [],
    {
        height: 0,
        width: 0,
        left: (p) => p.left,
        top: (p, b) => b.bottom,
    }
);

const MOVE_SCALE_BOTTOM_OUT = new AnimationEffect(
    'exit',
    'Move & Scale ↓ to Bottom',
    '↓ to Bottom',
    ['b_position', 'b_scale'],
    ['width', 'height', 'y_position'],
    [],
    {
        height: 0,
        width: 0,
        left: (p) => p.left,
        top: (p, b) => b.bottom,
    }
);

const FLY_LEFT_IN = new AnimationEffect(
    'enter',
    'Fly → from Left',
    '→ from Left',
    ['a_position', 'a_scale', 'a_opacity'],
    ['opacity', 'width', 'height', 'x_position'],
    [],
    {
        opacity: 0,
        height: 0,
        width: 0,
        left: (p, b) => b.left,
        top: (p) => p.top,
    }
);

const FLY_LEFT_OUT = new AnimationEffect(
    'exit',
    'Fly ← to Left',
    '← to Left',
    ['b_position', 'b_scale', 'b_opacity'],
    ['opacity', 'width', 'height', 'x_position'],
    [],
    {
        opacity: 0,
        height: 0,
        width: 0,
        left: (p, b) => b.left,
        top: (p) => p.top,
    }
);

const FLY_RIGHT_IN = new AnimationEffect(
    'enter',
    'Fly ← from Right',
    '← from Right',
    ['a_position', 'a_scale', 'a_opacity'],
    ['opacity', 'width', 'height', 'x_position'],
    [],
    {
        opacity: 0,
        height: 0,
        width: 0,
        left: (p, b) => b.right,
        top: (p) => p.top,
    }
);

const FLY_RIGHT_OUT = new AnimationEffect(
    'exit',
    'Fly → to Right',
    '→ to Right',
    ['b_position', 'b_scale', 'b_opacity'],
    ['opacity', 'width', 'height', 'x_position'],
    [],
    {
        opacity: 0,
        height: 0,
        width: 0,
        left: (p, b) => b.right,
        top: (p) => p.top,
    }
);

const FLY_TOP_IN = new AnimationEffect(
    'enter',
    'Fly ↓ from Top',
    '↓ from Top',
    ['a_position', 'a_scale', 'a_opacity'],
    ['opacity', 'width', 'height', 'y_position'],
    [],
    {
        opacity: 0,
        height: 0,
        width: 0,
        left: (p) => p.left,
        top: (p, b) => b.top,
    }
);

const FLY_TOP_OUT = new AnimationEffect(
    'exit',
    'Fly ↑ to Top',
    '↑ to Top',
    ['b_position', 'b_scale', 'b_opacity'],
    ['opacity', 'width', 'height', 'y_position'],
    [],
    {
        opacity: 0,
        height: 0,
        width: 0,
        left: (p) => p.left,
        top: (p, b) => b.top,
    }
);

const FLY_BOTTOM_IN = new AnimationEffect(
    'enter',
    'Fly ↑ from Bottom',
    '↑ from Bottom',
    ['a_position', 'a_scale', 'a_opacity'],
    ['opacity', 'width', 'height', 'y_position'],
    [],
    {
        opacity: 0,
        height: 0,
        width: 0,
        left: (p) => p.left,
        top: (p, b) => b.bottom,
    }
);

const FLY_BOTTOM_OUT = new AnimationEffect(
    'exit',
    'Fly ↓ to Bottom',
    '↓ to Bottom',
    ['b_position', 'b_scale', 'b_opacity'],
    ['opacity', 'width', 'height', 'y_position'],
    [],
    {
        opacity: 0,
        height: 0,
        width: 0,
        left: (p) => p.left,
        top: (p, b) => b.bottom,
    }
);

export const AnimationEffectMap = {
    FADE_IN,
    FADE_OUT,
    SCALE_IN,
    SCALE_OUT,
    FADE_SCALE_IN,
    FADE_SCALE_OUT,
    WIPE_LEFT_IN,
    WIPE_LEFT_OUT,
    WIPE_RIGHT_IN,
    WIPE_RIGHT_OUT,
    WIPE_TOP_IN,
    WIPE_TOP_OUT,
    WIPE_BOTTOM_IN,
    WIPE_BOTTOM_OUT,
    MOVE_LEFT_IN,
    MOVE_LEFT_OUT,
    MOVE_RIGHT_IN,
    MOVE_RIGHT_OUT,
    MOVE_TOP_IN,
    MOVE_TOP_OUT,
    MOVE_BOTTOM_IN,
    MOVE_BOTTOM_OUT,
};

export const AnimationEffectList = {
    enter: [
        {title: 'Fade In', effects: [FADE_IN]},
        {title: 'Scale In', effects: [SCALE_IN]},
        {title: 'Scale & Fade', effects: [FADE_SCALE_IN]},
        {
            title: 'Wipe In',
            effects: [WIPE_LEFT_IN, WIPE_RIGHT_IN, WIPE_TOP_IN, WIPE_BOTTOM_IN],
        },
        {
            title: 'Move In',
            effects: [MOVE_LEFT_IN, MOVE_RIGHT_IN, MOVE_TOP_IN, MOVE_BOTTOM_IN],
        },
        {
            title: 'Move & Scale',
            effects: [
                MOVE_SCALE_LEFT_IN,
                MOVE_SCALE_RIGHT_IN,
                MOVE_SCALE_TOP_IN,
                MOVE_SCALE_BOTTOM_IN,
            ],
        },
        {
            title: 'Fly In',
            effects: [FLY_LEFT_IN, FLY_RIGHT_IN, FLY_TOP_IN, FLY_BOTTOM_IN],
        },
    ],
    exit: [
        {title: 'Fade Out', effects: [FADE_OUT]},
        {title: 'Scale Out', effects: [SCALE_OUT]},
        {title: 'Scale & Fade', effects: [FADE_SCALE_OUT]},
        {
            title: 'Wipe Out',
            effects: [WIPE_LEFT_OUT, WIPE_RIGHT_OUT, WIPE_TOP_OUT, WIPE_BOTTOM_OUT],
        },
        {
            title: 'Move Out',
            effects: [MOVE_LEFT_OUT, MOVE_RIGHT_OUT, MOVE_TOP_OUT, MOVE_BOTTOM_OUT],
        },
        {
            title: 'Move & Scale',
            effects: [
                MOVE_SCALE_LEFT_OUT,
                MOVE_SCALE_RIGHT_OUT,
                MOVE_SCALE_TOP_OUT,
                MOVE_SCALE_BOTTOM_OUT,
            ],
        },
        {
            title: 'Fly Out',
            effects: [FLY_LEFT_OUT, FLY_RIGHT_OUT, FLY_TOP_OUT, FLY_BOTTOM_OUT],
        },
    ],
};
