import {Reducer} from 'redux';

import {BROWSER_RESIZE} from '../../actions/action_types';
import _ from 'underscore';

export interface BrowserState {
    innerWidth: number;
    innerHeight: number;
}

export const initialState: BrowserState = {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
};

export const browserReducer: Reducer<BrowserState> = (
    state: BrowserState = initialState,
    action
) => {
    let s = _.clone(state);
    switch (action.type) {
        case BROWSER_RESIZE:
            s.innerWidth = action.payload.innerWidth;
            s.innerHeight = action.payload.innerHeight;
            return s;
        default:
            return state;
    }
};
