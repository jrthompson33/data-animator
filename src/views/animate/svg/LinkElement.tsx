import React from 'react';
import ReactDOM from 'react-dom';

import {MARGIN} from '../TimelineLayers';

const LAYER = {
    H: 20,
    KH: 12,
    KW: 5,
    BH: 3,
    DH: 4,
    HH: 16,
    HW: 20,
    RAD: 4.5,
};

export interface LinkElementProps {
    startKey: number;
    endKey: number;
    scaleKey: any;
    startRow: number;
    endRow: number;
}

export default class LinkElement extends React.Component<LinkElementProps, {}> {
    constructor(props: LinkElementProps) {
        super(props);
    }

    public render() {
        const startX = this.props.scaleKey(this.props.startKey),
            startY = this.props.startRow * 58 + 38,
            endX = this.props.scaleKey(this.props.endKey),
            endY = this.props.endRow * 58 + 38,
            diffX = endX - startX,
            diffY = endY - startY,
            c0 = [diffX / 3, 0],
            c1 = [(diffX * 2) / 3, diffY],
            c = [diffX, diffY];
        return (
            <g transform={`translate(${MARGIN.L}, 0)`}>
                <path className="link-duration" d={`M ${startX},${startY} c ${c0} ${c1} ${c}`}/>
                <g className="link-keyframe-group" transform={`translate(${[startX, startY]})`}>
                    <circle
                        className="link-keyframe start"
                        r={LAYER.RAD}
                    />
                </g>
                <g className="link-keyframe-group" transform={`translate(${[endX, endY]})`}>
                    <circle
                        className="link-keyframe end"
                        r={LAYER.RAD}
                    />
                </g>
            </g>
        );
    }
}
