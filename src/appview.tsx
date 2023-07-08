import React, {RefObject} from 'react';
import ReactDOM from 'react-dom';
import * as Rx from 'rxjs-compat';

import saveAs from 'file-saver';

import store from './store';

import _ from 'underscore';

import {StoryboardPanel} from './views/storyboard/StoryboardPanel';
import {AnimatePanel} from './views/animate/AnimatePanel';
import PreviewPanel from './views/preview/PreviewPanel';

import {Hotkey, Hotkeys, HotkeysTarget, TabId} from '@blueprintjs/core';
import MenuBar from './views/menu/MenuBar';
import OffscreenRenderer from './graphics/OffscreenRenderer';
import {removeBoard, resizeBrowser} from './actions/action_creators';
import {getProjectFile, getSelectedBoardOnCanvas} from './selectors';
import {ActionCreators} from 'redux-undo';

export interface AppViewProps {}

export interface AppViewState {
    modeTabId: TabId;
    innerWidth: number;
    innerHeight: number;
    transitionId: number;
}

@HotkeysTarget
export class AppView extends React.Component<AppViewProps, AppViewState> {
    constructor(props) {
        super(props);
        this.state = {
            modeTabId: 'storyboard',
            transitionId: -1,
            innerHeight: 720,
            innerWidth: 1080,
        };
    }

    private _refs = {
        $container: React.createRef<HTMLDivElement>(),
        $animate: React.createRef<AnimatePanel>(),
        $offscreenCanvas: React.createRef<HTMLCanvasElement>(),
        $offscreenSVG: React.createRef<SVGSVGElement>(),
        $sbPanel: React.createRef<StoryboardPanel>(),
    };

    public offscreen: OffscreenRenderer;

    public componentDidMount() {
        this._handleResize({w: window.innerWidth, h: window.innerHeight});

        Rx.Observable.fromEvent(window, 'resize')
            .map(() => ({w: window.innerWidth, h: window.innerHeight}))
            .debounceTime(50)
            .subscribe(this._handleResize);

        let canvasEl = this._refs.$offscreenCanvas.current,
            svgEl = this._refs.$offscreenSVG.current;
        let canvas;
        if ('OffscreenCanvas' in window) {
            canvas = canvasEl.transferControlToOffscreen();
            canvas['style'] = {width: 1000, height: 800};
        } else {
            canvas = canvasEl;
        }
        this.offscreen = new OffscreenRenderer(canvas, svgEl);
    }

    public render() {
        const panelHeight = this.state.innerHeight - 50;
        return (
            <div style={{height: '100%', width: '100%'}} ref={this._refs.$container}>
                <MenuBar
                    onModeChange={this._handleModeChange}
                    onTransitionChange={this._showAnimation}
                    onImportVis={this._handleImportVis}
                    onSave={this._handleSaveProject}
                    onOpen={this._handleOpenProject}
                    onRemoveBoard={this._handleRemoveBoard}
                    modeTabId={this.state.modeTabId}
                    transitionId={this.state.transitionId}
                    transitions={[]}
                    selectedOnCanvas={undefined}
                />
                <div id="panel-container" style={{height: panelHeight}}>
                    <StoryboardPanel
                        ref={this._refs.$sbPanel}
                        show={this.state.modeTabId !== 'storyboard'}
                        showAnimation={this._showAnimation}
                    />
                    <AnimatePanel
                        show={this.state.modeTabId !== 'animate'}
                        ref={this._refs.$animate}
                    />
                    <PreviewPanel
                        show={this.state.modeTabId !== 'preview'}
                        transitions={[]}
                    />
                </div>
                <div id="offscreen-container" style={{display: 'none'}}>
                    <canvas
                        ref={this._refs.$offscreenCanvas}
                        width="1000"
                        height="800"
                    />
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        ref={this._refs.$offscreenSVG}
                        width="1000"
                        height="800"
                    />
                </div>
            </div>
        );
    }

    public renderHotkeys() {
        return (
            <Hotkeys>
                <Hotkey
                    global={true}
                    group="File"
                    combo="mod + o"
                    label="Open Project"
                    stopPropagation={true}
                    onKeyDown={this._handleOpenProject}
                />
                <Hotkey
                    global={true}
                    group="File"
                    combo="mod + s"
                    label="Save Project"
                    stopPropagation={true}
                    onKeyDown={this._handleSaveProject}
                />
                <Hotkey
                    global={true}
                    group="File"
                    combo="shift + mod + e"
                    label="Export"
                    stopPropagation={true}
                    onKeyDown={this._handleExportProject}
                />
                <Hotkey
                    global={true}
                    group="File"
                    combo="mod + i"
                    label="Import Vis (*.diproj)"
                    stopPropagation={true}
                    onKeyDown={this._handleImportVis}
                />
                {/*<Hotkey*/}
                {/*    global={true}*/}
                {/*    group="Edit"*/}
                {/*    combo="mod + z"*/}
                {/*    label="Undo"*/}
                {/*    onKeyDown={this._handleUndo}*/}
                {/*/>*/}
                {/*<Hotkey*/}
                {/*    global={true}*/}
                {/*    group="Edit"*/}
                {/*    combo="shift + mod + z"*/}
                {/*    label="Redo"*/}
                {/*    onKeyDown={this._handleRedo}*/}
                />
                <Hotkey
                    global={true}
                    group="Edit"
                    combo="backspace"
                    label="Remove Selected Board"
                    onKeyDown={this._handleRemoveBoard}
                />
                <Hotkey
                    global={true}
                    group="View"
                    combo="mod + ="
                    label="Zoom In"
                    stopPropagation={true}
                    onKeyDown={this._handleZoomIn}
                />
                <Hotkey
                    global={true}
                    group="View"
                    combo="mod + -"
                    label="Zoom Out"
                    stopPropagation={true}
                    onKeyDown={this._handleZoomOut}
                />
            </Hotkeys>
        );
    }

    private _handleOpenProject = () => {};

    private _handleRemoveBoard = () => {
        let selectedOnCanvas = getSelectedBoardOnCanvas(store.getState());
        if (selectedOnCanvas && this.state.modeTabId === 'storyboard') {
            store.dispatch(removeBoard(selectedOnCanvas));
        }
    };

    private _handleResize = (dims: {w: number; h: number}) => {
        this.setState({innerWidth: dims.w, innerHeight: dims.h});
        store.dispatch(resizeBrowser(dims.w, dims.h));
    };

    private _handleSaveProject = () => {
        let fileJson = getProjectFile(store.getState()),
            blob = new Blob([JSON.stringify(fileJson)], {type: 'application/json'});
        saveAs(blob, 'test.daproj');
    };

    private _handleExportProject = () => {};

    private _handleImportVis = () => {
        this._refs.$sbPanel.current.showVisUploader();
    };

    private _handleUndo = () => {
        store.dispatch(ActionCreators.undo());
    };

    private _handleRedo = () => {
        store.dispatch(ActionCreators.redo());
    };

    private _handleZoomIn = () => {};

    private _handleZoomOut = () => {};

    private _showAnimation = (transitionId: number) => {
        this._refs.$animate.current.setTransition(transitionId);
        this.setState({modeTabId: 'animate', transitionId});
    };

    private _handleModeChange = (modeTabId: TabId) => {
        if (this.state.modeTabId === 'animate' && this._refs.$animate.current) {
            this._refs.$animate.current.exitView();
        }
        this.setState({modeTabId});
    };
}
