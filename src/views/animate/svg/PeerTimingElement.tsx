import React from 'react';
import ReactDOM from 'react-dom';

import Hammer from 'hammerjs';
import * as d3 from 'd3';

const LAYER = {H: 60, NH: 22, T: 18, KH: 7, KW: 7, HH: 14, HW: 20, DH: 3};
const FORMAT = d3.format('.0%');

import {MARGIN} from '../TimelineLayers';

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

export interface PeerTimingElementProps {
    groups: any[];
    totalCount: number;
    defaultDuration: number;
    startKey: number;
    endKey: number;
    scale: any;
    parentScale: any;
    onPeerEnter: (
        g: any,
        position: number[],
        dimension: number[],
        e: React.MouseEvent<SVGGElement>
    ) => void;
    onPeerLeave: (g: any, e: React.MouseEvent<SVGGElement>) => void;
    onDragStart: (draggable: any, context: DragContext) => void;
}

export interface PeerTimingElementState {
    currDefaultDuration: number;
    dragging: boolean;
}

export default class PeerTimingElement extends React.Component<
    PeerTimingElementProps,
    PeerTimingElementState
> {
    constructor(props) {
        super(props);
        this.state = {
            dragging: false,
            currDefaultDuration: this.props.defaultDuration,
        };
    }

    protected _refs = {
        durationKey: React.createRef<SVGGElement>(),
    };
    public hammerDuration: any;

    public componentDidMount() {
        this.hammerDuration = new Hammer(this._refs.durationKey.current);
        this.hammerDuration.add(new Hammer.Pan({threshold: 1}));

        let context: DragContext;
        let oldDuration: number;

        this.hammerDuration.on('panstart', (e) => {
            oldDuration = this.props.defaultDuration;
            context = new DragContext();
            this.setState({
                dragging: true,
                currDefaultDuration: oldDuration,
            });
            if (this.props.onDragStart) {
                this.props.onDragStart('duration', context);
            }
            context.emit('drag', {
                raw: this.props.startKey,
                scaled: this.props.parentScale(this.props.startKey),
                startOrEnd: 'start',
                which: 'duration',
            });
        });
        this.hammerDuration.on('pan', (e) => {
            const currDefaultDuration = this._convertKey(e.deltaX, oldDuration);
            this.setState({
                currDefaultDuration,
            });
            context.emit('drag', {
                raw: currDefaultDuration,
                scaled: this._convertScaled(currDefaultDuration),
                startOrEnd: 'end',
                which: 'duration',
            });
        });
        this.hammerDuration.on('panend', (e) => {
            const currDefaultDuration = this._convertKey(e.deltaX, oldDuration);
            this.setState({
                dragging: false,
                currDefaultDuration,
            });
            context.emit('end', {
                raw: currDefaultDuration,
                scaled: this._convertScaled(currDefaultDuration),
                startOrEnd: 'end',
                which: 'duration',
            });
        });
    }

    public componentWillUnmount() {
        this.hammerDuration.destroy();
    }

    static getDerivedStateFromProps(props, state) {
        if (props.defaultDuration !== state.currDefaultDuration && !state.dragging) {
            return {
                currDefaultDuration: props.defaultDuration,
            };
        }
        return null;
    }

    public render() {
        const {scale, parentScale} = this.props;
        const startKey = scale(parentScale(this.props.startKey)),
            endKey = scale(parentScale(this.props.endKey)),
            thisWidth = endKey - startKey,
            peerWidth = this.state.currDefaultDuration * thisWidth,
            availWidth = thisWidth - peerWidth,
            padding = (LAYER.H - 3) / this.props.totalCount,
            keyframeClasses = `peer-keyframe-duration ${
                this.state.dragging ? 'dragging' : ''
            }`;
        let currY = 0;
        const peerDurations =
            this.props.groups.length > 1 ? (
                this.props.groups.map((g, i) => {
                    currY += g.count * padding;
                    let gPosition = [g.delay * thisWidth, currY - g.count * padding],
                        gDimension = [g.duration * thisWidth, g.count * padding];
                    return (
                        <g
                            className="peer-group"
                            key={`peer-${i}`}
                            onMouseEnter={(e) =>
                                this.props.onPeerEnter(g, gPosition, gDimension, e)
                            }
                            onMouseLeave={(e) => this.props.onPeerLeave(g, e)}
                        >
                            <rect
                                className="peer-duration"
                                height={gDimension[1]}
                                y={gPosition[1]}
                                x={gPosition[0]}
                                rx={1}
                                ry={1}
                                width={gDimension[0]}
                            />
                            <rect
                                className="peer-hover"
                                height={gDimension[1]}
                                y={gPosition[1]}
                                width={thisWidth}
                            />
                        </g>
                    );
                })
            ) : (
                <g className="peer-group" key={`peer-0`}>
                    <rect
                        className="peer-duration"
                        height={LAYER.NH}
                        rx={1}
                        ry={1}
                        width={thisWidth}
                    />
                    <text
                        x={thisWidth / 2}
                        y={LAYER.NH / 2}
                        dy="0.31em"
                        className="peer-label fg"
                    >
                        {`All Shapes (${this.props.totalCount})`}
                    </text>
                </g>
            );
        return (
            <g transform={`translate(${[MARGIN.L + startKey, LAYER.T]})`}>
                <g>{peerDurations}</g>
                <line className="layer-line" y1={-LAYER.T} y2={LAYER.H} />
                <line
                    className="layer-line"
                    transform={`translate(${thisWidth},0)`}
                    y1={-LAYER.T}
                    y2={LAYER.H}
                />
                <line className="property-line" y2={LAYER.H} />
                <line
                    className="property-line"
                    transform={`translate(${peerWidth},0)`}
                    y2={LAYER.H}
                />
                <g className="peer-label" transform={`translate(2, 9)`}>
                    <text className="peer-percent bg">0%</text>
                    <text className="peer-percent fg">0%</text>
                </g>
                <g
                    className="peer-label"
                    transform={`translate(${thisWidth - 2}, 9)`}
                >
                    <text className="peer-percent bg" style={{textAnchor: 'end'}}>
                        100%
                    </text>
                    <text className="peer-percent fg" style={{textAnchor: 'end'}}>
                        100%
                    </text>
                </g>
                <g
                    className={keyframeClasses}
                    ref={this._refs.durationKey}
                    transform={`translate(${peerWidth},${LAYER.H - 6})`}
                >
                    <rect
                        className="peer-bg"
                        height={LAYER.DH}
                        y={1.5}
                        x={0}
                        width={availWidth}
                    />
                    <rect
                        className="peer-default-duration"
                        height={LAYER.DH}
                        y={1.5}
                        x={-peerWidth}
                        width={peerWidth}
                    />
                    <text y={-2} className="peer-percent bg" x={2}>
                        {FORMAT(this.state.currDefaultDuration)}
                    </text>
                    <text y={-2} className="peer-percent fg" x={2}>
                        {FORMAT(this.state.currDefaultDuration)}
                    </text>
                    <text className="peer-duration-name bg" y={-2} x={-2}>
                        duration
                    </text>
                    <text className="peer-duration-name fg" y={-2} x={-2}>
                        duration
                    </text>
                    <rect
                        className="peer-keyframe end"
                        transform="translate(0,-2)rotate(45)"
                        height={LAYER.KH}
                        width={LAYER.KW}
                    />
                    <rect
                        className="peer-hover end"
                        height={LAYER.HH}
                        width={LAYER.HW}
                        y={LAYER.HH / -2}
                        x={LAYER.HW / -2}
                    />
                </g>
            </g>
        );
    }

    private _convertScaled(oldKey): number {
        let {parentScale, endKey, startKey} = this.props;
        return parentScale(oldKey * (endKey - startKey) + startKey);
    }

    private _convertKey(delta, oldKey): number {
        let {parentScale, scale, endKey, startKey} = this.props,
            parentDiff = endKey - startKey;
        return Math.max(
            0,
            Math.min(
                1,
                +(
                    parentScale.invert(
                        scale.invert(delta + scale(parentScale(oldKey * parentDiff)))
                    ) / parentDiff
                ).toFixed(2)
            )
        );
    }
}
