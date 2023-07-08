import {Reducer} from 'redux';

import _ from 'underscore';

import {
    ADD_BINDING,
    ADD_DECORATION,
    ADD_SCALE,
    ADD_VIS_TEMPLATE,
    REMOVE_BINDING,
    REMOVE_DECORATION,
    REMOVE_SCALE,
    REMOVE_VIS_TEMPLATE,
} from '../../actions/action_types';

export interface VisState {
    templates: {};
    bindings: {};
    decorations: {};
    scales: {};
}

export const initialState: VisState = {
    templates: {},
    bindings: {},
    decorations: {},
    scales: {},
};

export const visReducer: Reducer<VisState> = (
    state: VisState = initialState,
    action
) => {
    let s = _.clone(state);
    switch (action.type) {
        case ADD_VIS_TEMPLATE:
            s.templates[action.id] = action.payload;
            return s;
        case REMOVE_VIS_TEMPLATE:
            return _.omit(s.templates, action.id);
        case ADD_BINDING:
            s.bindings[action.id] = action.payload;
            return s;
        case REMOVE_BINDING:
            return _.omit(s.bindings, action.id);
        case ADD_DECORATION:
            s.decorations[action.id] = action.payload;
            return s;
        case REMOVE_DECORATION:
            return _.omit(s.decorations, action.id);
        case ADD_SCALE:
            s.scales[action.id] = action.payload;
            return s;
        case REMOVE_SCALE:
            return _.omit(s.scales, action.id);
        default:
            return state;
    }
};
