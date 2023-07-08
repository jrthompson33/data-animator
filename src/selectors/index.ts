import {ApplicationState} from '../store/action_handlers';

import _ from 'underscore';
import {StateWithHistory} from 'redux-undo';
import ILink from '../core/ILink';
import IBoard from '../core/IBoard';
import Dataset from '../data/Dataset';
import store from '../store';
import IBinding from '../data/bindings/IBinding';
import IObject from '../graphics/objects/IObject';
import IDecoration from '../graphics/decorations/IDecoration';
import IPeerObject from '../graphics/objects/IPeerObject';
import {datasetReducer} from '../store/action_handlers/datasets';
import {visReducer} from '../store/action_handlers/visualization';
import {graphicReducer} from '../store/action_handlers/graphic';
import {storyboardReducer} from '../store/action_handlers/story_board';
import {browserReducer} from '../store/action_handlers/browser';

export const getProjectFile = (state: StateWithHistory<ApplicationState>): any => {
    return {
        storyboard: state.present.storyboard,
        data: state.present.data,
    };
};

export const getOrderedTransitionList = (
    state: StateWithHistory<ApplicationState>
): ILink[] => {
    // TODO fix this to be in proper order
    return _.values(state.present.storyboard.links);
};

// TODO FIx ILink everywhere
export const getTransitionById = (
    state: StateWithHistory<ApplicationState>,
    id: number
): any => {
    return state.present.storyboard.links[id];
};

export const getBoardList = (
    state: StateWithHistory<ApplicationState>
): IBoard[] => {
    return _.values(state.present.storyboard.boards);
};

export const getBoardById = (
    state: StateWithHistory<ApplicationState>,
    id: number
): IBoard => {
    return state.present.storyboard.boards[id];
};

export const getSelectedBoardOnCanvas = (
    state: StateWithHistory<ApplicationState>
): IBoard => {
    let possibleSelected = _.filter(getBoardList(state), (b) => b.selected);
    return possibleSelected.length > 0 ? possibleSelected[0] : undefined;
};

export const getDatasets = (
    state: StateWithHistory<ApplicationState>
): Dataset[] => {
    return state.present.data.datasets;
};

export const getDatasetById = (
    state: StateWithHistory<ApplicationState>,
    id: string
): Dataset => {
    return state.present.data.datasets[id];
};

export const getActiveDataset = (
    state: StateWithHistory<ApplicationState>
): Dataset => {
    let datasets = _.values(getDatasets(state));
    // TODO return current dataset
    return datasets[datasets.length - 1];
};

export const getCanvasObjects = (state: StateWithHistory<ApplicationState>): any => {
    return state.present.canvas.objects;
};

// TODO fix IObject class
export const getCanvasObjectById = (
    state: StateWithHistory<ApplicationState>,
    id: string
): any => {
    return state.present.canvas.objects[id];
};

export const getVisDecorations = (
    state: StateWithHistory<ApplicationState>
): any => {
    return state.present.vis.decorations;
};

export const getVisDecorationById = (
    state: StateWithHistory<ApplicationState>,
    id: number
): IDecoration => {
    return state.present.vis.decorations[id];
};

export const getVisBindings = (state: StateWithHistory<ApplicationState>): any => {
    return state.present.vis.bindings;
};

export const getVisBindingById = (
    state: StateWithHistory<ApplicationState>,
    id: number
): IBinding => {
    return state.present.vis.bindings[id];
};

export const getVisScales = (state: StateWithHistory<ApplicationState>): any => {
    return state.present.vis.scales;
};

export const getVisScaleById = (
    state: StateWithHistory<ApplicationState>,
    id: number
): any => {
    return state.present.vis.scales[id];
};

export const getBrowserInnerWidth = (
    state: StateWithHistory<ApplicationState>
): any => {
    return state.present.browser.innerWidth;
};

export const getBrowserInnerHeight = (
    state: StateWithHistory<ApplicationState>
): any => {
    return state.present.browser.innerHeight;
};
