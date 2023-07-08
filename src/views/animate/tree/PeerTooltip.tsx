import {Position, Tag, Tooltip} from '@blueprintjs/core';
import React from 'react';

export interface PeerTooltipProps {}

export interface PeerTooltipState {
    isOpen: boolean;
    peerLabel: string;
    peerCount: number;
    peerPosition: number[];
    peerDimension: number[];
}

export default class PeerTooltip extends React.Component<
    PeerTooltipProps,
    PeerTooltipState
> {
    constructor(props) {
        super(props);
        this.state = {
            isOpen: false,
            peerLabel: '',
            peerCount: 0,
            peerPosition: [0, 0],
            peerDimension: [10, 10],
        };
    }

    public render() {
        return (
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: '100%',
                    pointerEvents: 'none',
                }}
            >
                <Tooltip
                    content={
                        <span style={{pointerEvents: 'none'}}>
                            <span
                                style={{
                                    marginRight: '10px',
                                    fontSize: '0.9em',
                                }}
                            >
                                {this.state.peerLabel}
                            </span>
                            <Tag>{this.state.peerCount}</Tag>
                        </span>
                    }
                    usePortal={false}
                    isOpen={this.state.isOpen}
                    position={Position.LEFT}
                >
                    <div
                        style={{
                            width: `${
                                this.state.peerDimension[0] +
                                this.state.peerPosition[0] +
                                84
                            }px`,
                            height: `${
                                this.state.peerDimension[1] +
                                this.state.peerPosition[1] * 2 +
                                30
                            }px`,
                        }}
                    />
                </Tooltip>
            </div>
        );
    }
}
