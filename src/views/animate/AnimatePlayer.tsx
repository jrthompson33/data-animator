import _ from 'underscore';

import AnimateRenderer from '../../graphics/AnimateRenderer';
import {AnimationGenerator} from '../../animation/AnimationGenerator';
import store from '../../store';
import {getCanvasObjects, getVisDecorations} from '../../selectors';

export const PLAY_STATE = {
    PLAY: 'play',
    PAUSE: 'pause',
};

export default class AnimatePlayer {
    constructor(renderer: AnimateRenderer) {
        this._renderer = renderer;
        this._renderer.addRenderListener(this.update.bind(this));
    }

    public currentTime: number = 0;
    public isRepeat: boolean = true;
    public state: string = 'pause';
    public speed: number = 1.0;

    public _generator: AnimationGenerator;
    private _renderer: AnimateRenderer;
    private _holdTime = 0;
    private _timeListeners = [];
    private _playbackListeners = [];

    public setGenerator(generator) {
        // Set generator
        this._generator = generator;

        let bounds = this._generator.getBounds();
        this._renderer.setCenter(
            (bounds.left + bounds.right) / 2,
            (bounds.top + bounds.bottom) / 2
        );
        // TODO transition between backgrounds
        this._renderer.setBackground(this._generator.startVis.background);

        this.resetObjectsToRenderer();
    }

    public resetObjectsToRenderer() {
        // Clear renderer
        this._renderer.clearAll();

        // Add threejs objects and update the animation
        let objects = getCanvasObjects(store.getState()),
            decorations = getVisDecorations(store.getState());
        this._generator.getObjectIds().forEach((objectId) => {
            this._renderer.addObject(objects[objectId]);
        });
        this._generator.updateObjects();

        // Add decorations and render animation
        this._generator.getDecorationIds().forEach((decorationId) => {
            this._renderer.addDecoration(decorations[decorationId]);
        });
        this._renderer.renderAnimationSVG();
    }

    public get currentDuration(): number {
        return this._generator ? this._generator.duration : 5e3;
    }

    public stepTo(step: string) {
        this.state = 'pause';
        if (step === 'start') {
            this._forceCurrentTime(0);
        } else if (step === 'end') {
            this._forceCurrentTime(this.currentDuration);
        }
        this._dispatchTime();
        this._dispatchPlayback();
    }

    public scrubTo(time: number) {
        this._forceCurrentTime(time);
        this._dispatchTime();

        if (this.state === PLAY_STATE.PLAY) {
            this.state = PLAY_STATE.PAUSE;
            this._dispatchPlayback();
        }
    }

    public addTimeListener(listener) {
        this._timeListeners.push(listener);
    }

    public addPlaybackListener(listener) {
        this._playbackListeners.push(listener);
    }

    public update(rafTime: number) {
        switch (this.state) {
            case PLAY_STATE.PLAY:
                let lastTime = this.currentTime;
                this.currentTime =
                    ((rafTime - this._holdTime) %
                        (this.currentDuration / this.speed)) *
                    this.speed;

                // Pause playback if not repeating
                if (lastTime > this.currentTime && !this.isRepeat) {
                    this.state = PLAY_STATE.PAUSE;
                    this.currentTime = this.currentDuration;
                    this._dispatchPlayback();
                }
                this._dispatchTime();
                this._renderer.setProgressWithGenerator(
                    this._computeProgressTime(),
                    this._generator
                );
                break;
            case PLAY_STATE.PAUSE:
                this._holdTime =
                    (rafTime - this.currentTime / this.speed) %
                    (this.currentDuration / this.speed);
                break;
        }
    }

    private _computeProgressTime() {
        return this.currentTime / this.currentDuration;
    }

    private _forceCurrentTime(time: number) {
        if (this.state === PLAY_STATE.PAUSE) {
            this.currentTime = time;
            this._renderer.setProgressWithGenerator(
                this._computeProgressTime(),
                this._generator
            );
        }
    }

    private _dispatchPlayback() {
        this._playbackListeners.forEach((l) => l(this.state));
    }

    private _dispatchTime() {
        this._timeListeners.forEach((l) => l(this.currentTime));
    }

    private _updateRenderer() {
        //    Update the renderer for a new transition
    }
}
