import React from 'react';
import ReactDOM from 'react-dom';

import Hammer from 'hammerjs';

import {MARGIN} from '../TimelineLayers';
import * as d3 from 'd3';

const LAYER = {
    H: 20,
    KH: 12,
    KW: 5,
    BH: 3,
    DH: 4,
    HH: 16,
    HW: 20,
    RAD: 5,
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

export interface LayerElementProps {
    startKey: number;
    endKey: number;
    scale: any;
    parentScale: any;
    isExpanded: boolean;
    isInteractive: boolean;
    isAnimating: boolean;
    linkType: 'enter' | 'exit' | 'linked';
    onDragStart?: (draggable: any, context: DragContext) => void;
}

export interface LayerElementState {
    currStartKey: number;
    currEndKey: number;
    dragging: boolean;
}

export default class LayerElement extends React.Component<
    LayerElementProps,
    LayerElementState
> {
    constructor(props: LayerElementProps) {
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
        const {linkType, isExpanded, isAnimating, isInteractive} = this.props;
        const parentStart = this.props.scale(this.props.parentScale(0)),
            parentWidth =
                this.props.scale(this.props.parentScale(1.0)) - parentStart,
            startKey = this.props.scale(
                this.props.parentScale(this.state.currStartKey)
            ),
            endKey = this.props.scale(this.props.parentScale(this.state.currEndKey)),
            startDH = linkType === 'enter' ? 1 : linkType === 'exit' ? 6 : LAYER.DH,
            endDH = linkType === 'exit' ? 1 : linkType === 'enter' ? 6 : LAYER.DH,
            startBH = linkType === 'enter' ? 1 : LAYER.BH,
            endBH = linkType === 'exit' ? 1 : LAYER.BH,
            thisWidth = endKey - startKey,
            lineOpacity = isExpanded ? 1 : 0,
            draggingClass = this.state.dragging ? 'dragging' : '',
            animatingClass = isAnimating ? '' : 'not-animating',
            interactiveClass = isInteractive ? 'interactive' : '';

        // Update interactivity
        if (this.hammerStart && this.hammerEnd) {
            this.hammerStart.get('pan').set({enable: this.props.isInteractive});
            this.hammerEnd.get('pan').set({enable: this.props.isInteractive});
        }
        return (
            <g
                transform={`translate(${MARGIN.L}, 0)`}
                className={`layer-element layer-element-${this.props.linkType} ${draggingClass} ${interactiveClass} ${animatingClass}`}
            >
                <path
                    className="layer-bg"
                    d={`M${parentStart},${
                        LAYER.H / 2 - startBH / 2
                    } h${startKey} l${thisWidth},${startBH / 2 - endBH / 2} h${
                        parentWidth - endKey
                    } v${endBH} h${endKey - parentWidth} l${-thisWidth},${
                        startBH / 2 - endBH / 2
                    } h${-startKey} z`}
                />
                <path
                    className="layer-duration"
                    d={`M${startKey},${LAYER.H / 2 - startDH / 2} l${thisWidth},${
                        startDH / 2 - endDH / 2
                    } v${endDH} l${-thisWidth},${startDH / 2 - endDH / 2} z`}
                />
                <g
                    className="layer-keyframe-group"
                    ref={this._refs.startKey}
                    transform={`translate(${startKey}, 0)`}
                >
                    <line
                        className="layer-line"
                        y1={LAYER.H / 2}
                        y2={LAYER.H}
                        style={{opacity: lineOpacity}}
                    />
                    <text
                        className="layer-percent"
                        y={LAYER.H / 2 - 2}
                        x={-3}
                        style={{textAnchor: 'end'}}
                    >
                        {FORMAT(this.state.currStartKey)}
                    </text>
                    <circle
                        className="layer-keyframe start"
                        r={LAYER.RAD}
                        cy={LAYER.H / 2}
                    />
                    <rect
                        className="layer-hover"
                        height={LAYER.HH}
                        width={LAYER.HW}
                        y={LAYER.H / 2 - LAYER.HH / 2}
                        x={LAYER.HH / -2}
                    />
                </g>
                <g
                    className="layer-keyframe-group"
                    ref={this._refs.endKey}
                    transform={`translate(${endKey},0)`}
                >
                    <line
                        className="layer-line"
                        y1={LAYER.H / 2}
                        y2={LAYER.H}
                        style={{opacity: lineOpacity}}
                    />
                    <text y={LAYER.H / 2 - 2} className="layer-percent" x={3}>
                        {FORMAT(this.state.currEndKey)}
                    </text>
                    <circle
                        className="layer-keyframe end"
                        r={LAYER.RAD}
                        cy={LAYER.H / 2}
                    />
                    <rect
                        className="layer-hover end"
                        height={LAYER.HH}
                        width={LAYER.HW}
                        y={LAYER.H / 2 - LAYER.HH / 2}
                        x={LAYER.HH / -2}
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
