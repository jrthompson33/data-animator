import AnimateRenderer from '../../graphics/AnimateRenderer';

import store from '../../store';
import PreviewRenderer from '../../graphics/PreviewRenderer';
import {AnimationGenerator} from '../../animation/AnimationGenerator';
import {PLAY_STATE} from '../animate/AnimatePlayer';
import {getCanvasObjects, getVisDecorations} from '../../selectors';

export default class PreviewPlayer {
    constructor(renderer: AnimateRenderer) {
        this._renderer = renderer;
        this._renderer.addRenderListener(this.update.bind(this));
    }

    public state: string = 'pause';
    public currentTime: number = 0;
    // TODO figure out how to reverse the time?
    public isReverse: boolean = false;
    public currentDuration: number = 5e3;
    public generator: AnimationGenerator;

    private _renderer: PreviewRenderer;
    private _timeListeners = [];
    private _playbackListeners = [];
    private _holdTime = 0;
    private _rafTime = 0;

    public update(rafTime: number) {
        switch (this.state) {
            case 'play':
                let lastTime = this.currentTime;
                this.currentTime = (rafTime - this._holdTime) % this.currentDuration;
                // Pause playback when you hit the end
                if (lastTime > this.currentTime) {
                    console.log('pause called');
                    this.state = 'pause';
                    this.currentTime = this.currentDuration;
                    this._dispatchPlayback();
                }
                this._dispatchTime();
                this._renderer.setProgressWithGenerator(
                    this._computeProgressTime(),
                    this.generator
                );
                break;
            case 'pause':
                this._holdTime = (rafTime - this.currentTime) % this.currentDuration;
                break;
        }
        this._rafTime = rafTime;
    }

    public setGenerator(generator: AnimationGenerator) {
        let objects = getCanvasObjects(store.getState()),
            decorations = getVisDecorations(store.getState());
        // Clear previous generator
        if (this.generator) {
            this.generator.getObjectIds().forEach((objectId) => {
                this._renderer.removeObject(objects[objectId]);
            });
            this.generator.getDecorationIds().forEach((decorationId) => {
                this._renderer.removeDecoration(decorations[decorationId]);
            });
        }
        this.generator = generator;
        this.currentDuration = generator.duration;

        this.generator.getObjectIds().forEach((objectId) => {
            this._renderer.addObject(objects[objectId]);
        });
        this.generator.updateObjects();
        let bounds = this.generator.getBounds();
        this._renderer.setCenter(
            (bounds.left + bounds.right) / 2,
            (bounds.top + bounds.bottom) / 2
        );
        // TODO transition between backgrounds
        this._renderer.setBackground(this.generator.startVis.background);

        this.generator.getDecorationIds().forEach((decorationId) => {
            this._renderer.addDecoration(decorations[decorationId]);
        });
        this._renderer.renderAnimationSVG();
    }

    public animateTo(index: number) {
        // this.state = 'pause';
        // if (step === 'start') {
        //     this._forceCurrentTime(0);
        // } else if (step === 'end') {
        //     this._forceCurrentTime(this.currentDuration);
        // }
        // this._dispatchTime();
        // this._dispatchPlayback();
    }

    public forceCurrentTime(time: number) {
        if (this.state === PLAY_STATE.PAUSE) {
            this.currentTime = time;
            this._renderer.setProgressWithGenerator(
                this._computeProgressTime(),
                this.generator
            );
        }
    }

    public resetCurrentTime() {
        this.forceCurrentTime(0);
        this._holdTime = this._rafTime % this.currentDuration;
    }

    public addTimeListener(listener) {
        this._timeListeners.push(listener);
    }

    public addPlaybackListener(listener) {
        this._playbackListeners.push(listener);
    }

    private _computeProgressTime() {
        return this.isReverse
            ? (this.currentDuration - this.currentTime) / this.currentDuration
            : this.currentTime / this.currentDuration;
    }

    private _dispatchPlayback() {
        this._playbackListeners.forEach((l) => l(this.state));
    }

    private _dispatchTime() {
        this._timeListeners.forEach((l) => l(this.currentTime));
    }
}
