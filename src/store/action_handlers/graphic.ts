import {Reducer} from 'redux';

import _ from 'underscore';

import {ADD_GRAPHIC_OBJECT, REMOVE_GRAPHIC_OBJECT} from '../../actions/action_types';
import IObject from 'graphics/objects/IObject';

export interface GraphicState {
    objects: any;
}

export const initialState: GraphicState = {
    objects: {},
};

export const graphicReducer: Reducer<GraphicState> = (
    state: GraphicState = initialState,
    action
) => {
    let s = _.clone(state);
    switch (action.type) {
        case ADD_GRAPHIC_OBJECT:
            s.objects[action.id] = action.payload;
            return s;
        case REMOVE_GRAPHIC_OBJECT:
            return _.omit(s.objects, action.id);
        default:
            return s;
    }
};
