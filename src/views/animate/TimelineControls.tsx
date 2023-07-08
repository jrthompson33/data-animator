import React from 'react';
import ReactDOM from 'react-dom';

import * as d3 from 'd3';
import {
    Alignment,
    Button,
    HTMLSelect,
    Icon,
    Intent,
    Label,
    Switch,
} from '@blueprintjs/core';

interface TimelineControlsProps {
    onRepeat: (isRepeat: boolean) => void;
    onStep: (direction: string) => void;
    onPlayback: (playPause: string) => void;
    onSpeed: (speed: number) => void;
    playbackIcon: 'play' | 'pause';
    isRepeat: boolean;
    show: boolean;
}

interface TimelineControlsState {}

export class TimelineControls extends React.Component<
    TimelineControlsProps,
    TimelineControlsState
> {
    constructor(props) {
        super(props);
    }

    public render() {
        return (
            <div
                id="an-timeline-controls"
                className="row"
                style={{
                    display: this.props.show ? 'flex' : 'none'
                }}
            >
                <div className="col-md-4">
                    <Switch
                        label="Repeat"
                        alignIndicator={Alignment.RIGHT}
                        checked={this.props.isRepeat}
                        style={{float: 'right', margin: '10px 0 0 0'}}
                        onChange={() => this.props.onRepeat(!this.props.isRepeat)}
                    />
                </div>
                <div className="col-md-4">
                    <div style={{margin: 'auto', width: 'fit-content'}}>
                        <Button
                            icon={<Icon icon="step-backward" iconSize={16} />}
                            onClick={() => this.props.onStep('start')}
                            minimal={true}
                            large={true}
                            intent={Intent.PRIMARY}
                        />
                        <Button
                            icon={
                                <Icon icon={this.props.playbackIcon} iconSize={26} />
                            }
                            onClick={() =>
                                this.props.onPlayback(this.props.playbackIcon)
                            }
                            minimal={true}
                            large={true}
                            intent={Intent.PRIMARY}
                        />
                        <Button
                            icon={<Icon icon="step-forward" iconSize={16} />}
                            onClick={() => this.props.onStep('end')}
                            minimal={true}
                            large={true}
                            intent={Intent.PRIMARY}
                        />
                    </div>
                </div>
                <div className="col-md-4">
                    <Label style={{display: 'inline-block', margin: '8px 0 0 0'}}>
                        Speed
                        <HTMLSelect
                            onChange={(e) =>
                                this.props.onSpeed(parseFloat(e.currentTarget.value))
                            }
                        >
                            <option value={1}>1.0x</option>
                            <option value={0.5}>0.5x</option>
                            <option value={0.2}>0.2x</option>
                            <option value={0.1}>0.1x</option>
                        </HTMLSelect>
                    </Label>
                </div>
            </div>
        );
    }
}
