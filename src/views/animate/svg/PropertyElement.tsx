import React from 'react';
import ReactDOM from 'react-dom';

import Hammer from 'hammerjs';
import * as d3 from 'd3';

import {MARGIN} from '../TimelineLayers';

const LAYER = {
    H: 20,
    BH: 2,
    DH: 3,
    KH: 7,
    KW: 7,
    HH: 14,
    HW: 20,
    RX: 2,
    RY: 2,
    EH: 5.5,
};
const FORMAT = d3.format('.0%');
const KEY_BY_DATA = '';
const KEY_BY_VISUAL = '';
const KEY_BY_EFFECT = '';

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

export interface PropertyElementProps {
    startKey: number;
    endKey: number;
    parentStartKey: number;
    parentEndKey: number;
    scale: any;
    peerScale: any;
    parentScale: any;
    name: string;
    linkType: 'enter' | 'exit' | 'linked';
    isEffect?: boolean;
    onDragStart?: (draggable: any, context: DragContext) => void;
}

export interface PropertyElementState {
    currStartKey: number;
    currEndKey: number;
    dragging: boolean;
}

export default class PropertyElement extends React.Component<
    PropertyElementProps,
    PropertyElementState
> {
    constructor(props: PropertyElementProps) {
        super(props);
        this.state = {
            dragging: false,
            currStartKey: this.props.startKey,
            currEndKey: this.props.endKey,
        };
    }

    public componentDidMount() {
        this.hammerStart = new Hammer(this._refs.startKey.current);
        this.hammerStart.add(new Hammer.Pan({threshold: 1}));
        this.hammerEnd = new Hammer(this._refs.endKey.current);
        this.hammerEnd.add(new Hammer.Pan({threshold: 1}));

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
                this.props.onDragStart('prop-end', contextEnd);
            }
            contextEnd.emit('drag', {
                raw: this.props.startKey,
                scaled: this._convertScaled(this.props.startKey),
                startOrEnd: 'start',
                which: this.props.name,
            });
        });
        this.hammerEnd.on('pan', (e) => {
            const currEndKey = this._convertKey(e.deltaX, oldEndKey);
            this.setState({
                currEndKey,
            });
            contextEnd.emit('drag', {
                raw: currEndKey,
                scaled: this._convertScaled(currEndKey),
                startOrEnd: 'end',
                which: this.props.name,
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
                scaled: this._convertScaled(currEndKey),
                startOrEnd: 'end',
                which: this.props.name,
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
                this.props.onDragStart('prop-start', contextStart);
            }
            contextStart.emit('drag', {
                raw: this.props.endKey,
                scaled: this._convertScaled(this.props.endKey),
                startOrEnd: 'end',
                which: this.props.name,
            });
        });
        this.hammerStart.on('pan', (e) => {
            const currStartKey = this._convertKey(e.deltaX, oldStartKey);
            this.setState({
                currStartKey,
            });
            contextStart.emit('drag', {
                raw: currStartKey,
                scaled: this._convertScaled(currStartKey),
                startOrEnd: 'start',
                which: this.props.name,
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
                scaled: this._convertScaled(currStartKey),
                startOrEnd: 'start',
                which: this.props.name,
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

    public hammerStart: any;
    public hammerEnd: any;

    public render() {
        const {
            linkType,
            isEffect,
            name,
            parentScale,
            peerScale,
            scale,
            parentEndKey,
            parentStartKey,
        } = this.props;
        const parentDiff = parentEndKey - parentStartKey,
            peerRange = this.props.peerScale.range(),
            startPeer = scale(
                parentScale(peerRange[0] * parentDiff + parentStartKey)
            ),
            endPeer = scale(parentScale(peerRange[1] * parentDiff + parentStartKey)),
            peerWidth = endPeer - startPeer;
        const startKey = scale(
                parentScale(
                    peerScale(this.state.currStartKey) * parentDiff + parentStartKey
                )
            ),
            endKey = scale(
                parentScale(
                    peerScale(this.state.currEndKey) * parentDiff + parentStartKey
                )
            ),
            thisWidth = endKey - startKey,
            draggingClass = this.state.dragging ? 'dragging' : '',
            startDH =
                linkType === 'enter' ? 1 : linkType === 'exit' ? 4.5 : LAYER.DH,
            endDH = linkType === 'exit' ? 1 : linkType === 'enter' ? 4.5 : LAYER.DH,
            startBH = linkType === 'enter' ? 1 : LAYER.BH,
            endBH = linkType === 'exit' ? 1 : LAYER.BH;
        return (
            <g
                transform={`translate(${MARGIN.L}, 0)`}
                className={`property-element property-element-${linkType} ${draggingClass}`}
            >
                <path
                    className="property-bg"
                    d={`M${startPeer},${
                        LAYER.H / 2 - startBH / 2 + (isEffect ? LAYER.EH : 0)
                    } h${startKey} l${thisWidth},${startBH / 2 - endBH / 2} h${
                        peerWidth - endKey
                    } v${endBH} h${endKey - peerWidth} l${-thisWidth},${
                        startBH / 2 - endBH / 2
                    } h${-startKey} z`}
                />
                <path
                    className="property-duration"
                    d={`M${startKey},${
                        LAYER.H / 2 - startDH / 2 + (isEffect ? LAYER.EH : 0)
                    } l${thisWidth},${
                        startDH / 2 - endDH / 2
                    } v${endDH} l${-thisWidth},${startDH / 2 - endDH / 2} z`}
                />
                <text className="property-name" y={LAYER.H / 2 - 3} x={startKey + 8}>
                    {isEffect ? '' : name}
                </text>
                <line
                    className="property-line"
                    transform={`translate(${startPeer},0)`}
                    y2={LAYER.H}
                />
                <line
                    className="property-line"
                    transform={`translate(${endPeer},0)`}
                    y2={LAYER.H}
                />
                <g
                    className="property-keyframe-group"
                    ref={this._refs.startKey}
                    transform={`translate(${startKey},${isEffect ? LAYER.EH : 0})`}
                >
                    <text
                        className="property-percent"
                        y={LAYER.H / 2 - 2}
                        x={-2}
                        style={{textAnchor: 'end'}}
                    >
                        {FORMAT(this.state.currStartKey)}
                    </text>
                    <rect
                        className="property-keyframe start"
                        transform="translate(0,5)rotate(45)"
                        height={LAYER.KH}
                        width={LAYER.KW}
                    />
                    <rect
                        className="layer-hover start"
                        height={LAYER.HH}
                        width={LAYER.HW}
                        y={LAYER.H / 2 - LAYER.HW / 2}
                        x={LAYER.HH / -2}
                    />
                </g>
                <g
                    className="property-keyframe-group"
                    ref={this._refs.endKey}
                    transform={`translate(${endKey},${
                        this.props.isEffect ? LAYER.EH : 0
                    })`}
                >
                    <text y={LAYER.H / 2 - 2} className="property-percent" x={2}>
                        {FORMAT(this.state.currEndKey)}
                    </text>
                    <rect
                        className="property-keyframe end"
                        transform="translate(0,5)rotate(45)"
                        height={LAYER.KH}
                        width={LAYER.KW}
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

    private _convertScaled(oldKey): number {
        let {parentScale, peerScale, parentEndKey, parentStartKey} = this.props;
        return parentScale(
            peerScale(oldKey) * (parentEndKey - parentStartKey) + parentStartKey
        );
    }

    private _convertKey(delta, oldKey): number {
        let {
                parentScale,
                peerScale,
                scale,
                parentEndKey,
                parentStartKey,
            } = this.props,
            parentDiff = parentEndKey - parentStartKey;
        return +peerScale
            .invert(
                parentScale.invert(
                    scale.invert(
                        delta + scale(parentScale(peerScale(oldKey) * parentDiff))
                    )
                ) / parentDiff
            )
            .toFixed(2);
    }
}
