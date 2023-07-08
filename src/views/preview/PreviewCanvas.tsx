import React from 'react';
import ReactDOM from 'react-dom';
import {AnimationGenerator} from '../../animation/AnimationGenerator';
import PreviewRenderer from '../../graphics/PreviewRenderer';
import PreviewPlayer from './PreviewPlayer';
import {Button, Collapse} from '@blueprintjs/core';
import TransitionLink from '../../animation/TransitionLink';

interface PreviewCanvasProps {
    onTime?: (time: number) => void;
    onPlayback: (playback: string) => void;
}

export default class PreviewCanvas extends React.Component<PreviewCanvasProps, {}> {
    constructor(props) {
        super(props);
    }

    private _refs = {
        $canvas: React.createRef<HTMLCanvasElement>(),
        $container: React.createRef<HTMLDivElement>(),
        $svg: React.createRef<SVGSVGElement>(),
    };

    public renderer: PreviewRenderer;
    public player: PreviewPlayer;

    public componentDidMount() {
        let canvasWidth = Math.floor(window.innerWidth),
            canvasHeight = Math.floor(window.innerHeight - 100);
        this._refs.$canvas.current.height = canvasHeight;
        this._refs.$canvas.current.width = canvasWidth;
        this.renderer = new PreviewRenderer(
            this._refs.$canvas.current,
            this._refs.$svg.current
        );
        this.player = new PreviewPlayer(this.renderer);
        this.player.addTimeListener(this.props.onTime);
        this.player.addPlaybackListener(this.props.onPlayback);
        this.renderer.startRendering();
    }

    public render() {
        return (
            <div id="pv-preview-canvas" ref={this._refs.$container}>
                <div id="pv-canvas-container">
                    <canvas id="pv-canvas" ref={this._refs.$canvas} />
                    <svg id="pv-svg" ref={this._refs.$svg}></svg>
                </div>
            </div>
        );
    }

    public playTransition = (transition: TransitionLink, isReverse) => {
        this.player.state = 'pause';
        this.player.resetCurrentTime();
        this.player.setGenerator(transition.generator);
        this.player.isReverse = isReverse;
        this.player.state = 'play';
    };

    public pauseOnTransition = (transition: TransitionLink) => {
        this.player.setGenerator(transition.generator);
        this.player.state = 'pause';
        this.player.forceCurrentTime(0);
    };
}
