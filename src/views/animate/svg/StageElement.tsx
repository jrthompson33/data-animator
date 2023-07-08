import React from 'react';
import ReactDOM from 'react-dom';

import Hammer from 'hammerjs';

import {MARGIN} from '../TimelineLayers';
import * as d3 from 'd3';

const STAGE = {
    H: 32,
    KH: 24,
    KW: 7,
    DH: 4,
    HH: 30,
    HW: 20,
    R: 5,
};
const FORMAT = d3.format('.0%');

export class DragContext {
    public listeners = {drag: [], end: []};

    public onDrag(listener: (e) => void) {
        this.listeners['drag'].push(listener);
    }

    public onEnd(listener: (e) => void) {
        this.listeners['end'].push(listener);
    }

    public emit(type: string, event: any) {
        this.listeners[type].forEach((l) => l(event));
    }
}

export interface StageElementProps {
    startKey: number;
    endKey: number;
    scale: any;
    name: string;
    parentScale: any;
    isInteractive: boolean;
    onDragStart?: (draggable: any, context: DragContext) => void;
}

export interface StageElementState {
    currStartKey: number;
    currEndKey: number;
    dragging: boolean;
}

export default class StageElement extends React.Component<
    StageElementProps,
    StageElementState
> {
    constructor(props: StageElementProps) {
        super(props);
        this.state = {
            dragging: false,
            currStartKey: this.props.startKey,
            currEndKey: this.props.endKey,
        };
    }

    public hammerStart: any;
    public hammerEnd: any;

    public componentDidMount() {
        this.hammerStart = new Hammer(this._refs.startKey.current);
        this.hammerStart.add(
            new Hammer.Pan({threshold: 1, enable: this.props.isInteractive})
        );
        this.hammerEnd = new Hammer(this._refs.endKey.current);
        this.hammerEnd.add(
            new Hammer.Pan({threshold: 1, enable: this.props.isInteractive})
        );

        let contextEnd: DragContext;
        let oldEndKey: number;

        this.hammerEnd.on('panstart', (e) => {
            oldEndKey = this.props.endKey;
            contextEnd = new DragContext();
            this.setState({
                dragging: true,
                currEndKey: oldEndKey,
            });
            if (this.props.onDragStart) {
                this.props.onDragStart('end', contextEnd);
            }
            contextEnd.emit('drag', {
                raw: this.props.startKey,
                scaled: this.props.parentScale(this.props.startKey),
                startOrEnd: 'start',
                which: 'start',
            });
        });
        this.hammerEnd.on('pan', (e) => {
            const currEndKey = this._convertKey(e.deltaX, oldEndKey);
            this.setState({
                currEndKey,
            });
            contextEnd.emit('drag', {
                raw: currEndKey,
                scaled: this.props.parentScale(currEndKey),
                startOrEnd: 'end',
                which: 'end',
            });
        });
        this.hammerEnd.on('panend', (e) => {
            const currEndKey = this._convertKey(e.deltaX, oldEndKey);
            this.setState({
                dragging: false,
                currEndKey,
            });
            contextEnd.emit('end', {
                raw: currEndKey,
                scaled: this.props.parentScale(currEndKey),
                startOrEnd: 'end',
                which: 'end',
            });
        });

        let contextStart: DragContext;
        let oldStartKey: number;

        this.hammerStart.on('panstart', (e) => {
            oldStartKey = this.props.startKey;
            contextStart = new DragContext();
            this.setState({
                dragging: true,
                currStartKey: oldStartKey,
            });
            if (this.props.onDragStart) {
                this.props.onDragStart('start', contextStart);
            }
            contextStart.emit('drag', {
                raw: this.props.endKey,
                scaled: this.props.parentScale(this.props.endKey),
                startOrEnd: 'end',
                which: 'end',
            });
        });
        this.hammerStart.on('pan', (e) => {
            const currStartKey = this._convertKey(e.deltaX, oldStartKey);
            this.setState({
                currStartKey,
            });
            contextStart.emit('drag', {
                raw: currStartKey,
                scaled: this.props.parentScale(currStartKey),
                startOrEnd: 'start',
                which: 'start',
            });
        });
        this.hammerStart.on('panend', (e) => {
            const currStartKey = this._convertKey(e.deltaX, oldStartKey);
            this.setState({
                dragging: false,
                currStartKey,
            });
            contextStart.emit('end', {
                raw: currStartKey,
                scaled: this.props.parentScale(currStartKey),
                startOrEnd: 'start',
                which: 'start',
            });
        });
    }

    public componentWillUnmount() {
        this.hammerStart.destroy();
        this.hammerEnd.destroy();
    }

    public static getDerivedStateFromProps(props, state) {
        if (!state.dragging) {
            return {
                dragging: state.dragging,
                currStartKey: props.startKey,
                currEndKey: props.endKey,
            };
        }
        return null;
    }

    protected _refs = {
        startKey: React.createRef<SVGGElement>(),
        endKey: React.createRef<SVGGElement>(),
    };

    public render() {
        const {isInteractive, name} = this.props;
        const parentStart = this.props.scale(this.props.parentScale(0)),
            parentWidth =
                this.props.scale(this.props.parentScale(1.0)) - parentStart,
            startKey = this.props.scale(
                this.props.parentScale(this.state.currStartKey)
            ),
            endKey = this.props.scale(this.props.parentScale(this.state.currEndKey)),
            thisWidth = endKey - startKey,
            draggingClass = this.state.dragging ? 'dragging' : '',
            interactiveClass = isInteractive ? 'interactive' : '';

        // Update interactivity
        if (this.hammerStart && this.hammerEnd) {
            this.hammerStart.get('pan').set({enable: this.props.isInteractive});
            this.hammerEnd.get('pan').set({enable: this.props.isInteractive});
        }
        return (
            <g
                transform={`translate(${MARGIN.L}, 0)`}
                className={`layer-element layer-element-${name} ${draggingClass} ${interactiveClass}`}
            >
                <path
                    className="layer-duration"
                    d={`M${startKey},${
                        STAGE.H / 2 - STAGE.DH / 2
                    } l${thisWidth},0 v${STAGE.DH} l${-thisWidth},0 z`}
                />
                <text className="stage-name" y={STAGE.H / 2 - 5} x={startKey + 10}>
                    {name}
                </text>
                <g
                    className="layer-keyframe-group"
                    ref={this._refs.startKey}
                    transform={`translate(${startKey}, 0)`}
                >
                    <text
                        className="layer-percent"
                        y={STAGE.H / 2 - 2}
                        x={-2}
                        style={{textAnchor: 'end'}}
                    >
                        {FORMAT(this.state.currStartKey)}
                    </text>
                    <path
                        className="layer-keyframe start"
                        d={`M0,${STAGE.H / 2 - STAGE.KH / 2} h${
                            STAGE.KW - STAGE.R
                        } a${[STAGE.R, STAGE.R]} 0 0 1 ${[STAGE.R, STAGE.R]} v${
                            STAGE.KH - STAGE.R * 2
                        } a${[STAGE.R, STAGE.R]} 0 0 1 ${[-STAGE.R, STAGE.R]} h${
                            -STAGE.KW + STAGE.R
                        } z`}
                    />
                    <rect />
                    <rect
                        className="layer-hover start"
                        height={STAGE.HH}
                        width={STAGE.HW}
                        y={STAGE.H / 2 - STAGE.HH / 2}
                        x={STAGE.HH / -2}
                    />
                </g>
                <g
                    className="layer-keyframe-group"
                    ref={this._refs.endKey}
                    transform={`translate(${endKey},0)`}
                >
                    <text y={STAGE.H / 2 - 2} className="layer-percent" x={2}>
                        {FORMAT(this.state.currEndKey)}
                    </text>
                    <path
                        className="layer-keyframe end"
                        d={`M0,${STAGE.H / 2 + STAGE.KH / 2} h${
                            -STAGE.KW + STAGE.R
                        } a${[STAGE.R, STAGE.R]} 0 0 1 ${[-STAGE.R, -STAGE.R]} v${
                            -STAGE.KH + STAGE.R * 2
                        } a${[STAGE.R, STAGE.R]} 0 0 1 ${[STAGE.R, -STAGE.R]} h${
                            STAGE.KW - STAGE.R
                        } z`}
                    />
                    <rect
                        className="layer-hover end"
                        height={STAGE.HH}
                        width={STAGE.HW}
                        y={STAGE.H / 2 - STAGE.HH / 2}
                        x={STAGE.HH / -2}
                    />
                </g>
            </g>
        );
    }

    private _convertKey(delta, oldKey): number {
        let {parentScale, scale} = this.props;
        return +parentScale
            .invert(scale.invert(delta + scale(parentScale(oldKey))))
            .toFixed(2);
    }
}
