import React from 'react';
import ReactDOM from 'react-dom';
import {connect} from 'react-redux';

import {Button, Collapse} from '@blueprintjs/core';
import AnimateRenderer from '../../graphics/AnimateRenderer';
import AnimatePlayer from './AnimatePlayer';
import {AnimationGenerator} from '../../animation/AnimationGenerator';
import {getBrowserInnerHeight, getBrowserInnerWidth} from '../../selectors';

interface AnimationCanvasProps {
    generator: AnimationGenerator;
    onTime: (time: number) => void;
    onPlayback: (playback: string) => void;
    show: boolean;
    canvasWidth: number;
    canvasHeight: number;
}

export class AnimateCanvas extends React.Component<
    AnimationCanvasProps,
    {isStatOpen}
> {
    constructor(props) {
        super(props);
        this.state = {
            isStatOpen: true,
        };
    }

    private _refs = {
        $statContainer: React.createRef<HTMLDivElement>(),
        $canvas: React.createRef<HTMLCanvasElement>(),
        $container: React.createRef<HTMLDivElement>(),
        $svg: React.createRef<SVGSVGElement>(),
    };

    public renderer: AnimateRenderer;
    public player: AnimatePlayer;

    public componentDidMount() {
        this._refs.$canvas.current.height = this.props.canvasHeight;
        this._refs.$canvas.current.width = this.props.canvasWidth;
        console.log(this.props.canvasWidth, this.props.canvasHeight);
        console.log(window.innerWidth * 0.55);
        this.renderer = new AnimateRenderer(
            this._refs.$canvas.current,
            this._refs.$svg.current,
            this._refs.$statContainer.current
        );
        this.player = new AnimatePlayer(this.renderer);
        this.player.addTimeListener(this.props.onTime);
        this.player.addPlaybackListener(this.props.onPlayback);
        this.renderer.startRendering();
    }

    public render() {
        this._loadTransition();

        if (
            this._refs.$canvas.current &&
            (this._refs.$canvas.current.height !== this.props.canvasHeight ||
                this._refs.$canvas.current.width !== this.props.canvasWidth)
        ) {
            this._refs.$canvas.current.height = this.props.canvasHeight;
            this._refs.$canvas.current.width = this.props.canvasWidth;
            this.renderer.updateSize(
                this.props.canvasWidth,
                this.props.canvasHeight
            );
        }

        const icon = this.state.isStatOpen ? 'small-minus' : 'small-plus';
        return (
            <div
                id="an-animate-canvas"
                ref={this._refs.$container}
                style={{display: this.props.show ? 'block' : 'none'}}
            >
                <div id="an-canvas-container">
                    <canvas id="an-canvas" ref={this._refs.$canvas} />
                    <svg id="an-svg" ref={this._refs.$svg}></svg>
                </div>
                <div id="an-performance-container">
                    <Button
                        text="Performance"
                        icon={icon}
                        onClick={this._onPerformanceClick}
                        minimal={true}
                        small={true}
                    />
                    <Collapse
                        isOpen={this.state.isStatOpen}
                        keepChildrenMounted={true}
                    >
                        <div
                            id="an-stat-container"
                            ref={this._refs.$statContainer}
                        />
                    </Collapse>
                </div>
            </div>
        );
    }

    private _onPerformanceClick = () => {
        this.setState({
            isStatOpen: !this.state.isStatOpen,
        });
    };

    private _loadTransition = () => {
        // TODO only load transition when the transition is new or makes changes
        if (
            this.props.generator &&
            this.props.generator !== this.player._generator
        ) {
            this.player.setGenerator(this.props.generator);
        }
    };
}

const mapStateToProps = (state, ownProps) => {
    let canvasWidth = Math.floor(getBrowserInnerWidth(state) * 0.55),
        canvasHeight = Math.floor(getBrowserInnerHeight(state) - 50);

    return {canvasWidth, canvasHeight};
};

const mapDispatchToProps = (dispatch) => {
    return {};
};

export default connect(mapStateToProps, mapDispatchToProps, null, {
    forwardRef: true,
})(AnimateCanvas);
