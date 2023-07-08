import {Reducer} from 'redux';

import {ADD_DATASET, REMOVE_DATASET} from '../../actions/action_types';
import _ from 'underscore';

export interface DataState {
    datasets: any;
}

export const initialState: DataState = {
    datasets: {},
};

export const datasetReducer: Reducer<DataState> = (
    state: DataState = initialState,
    action
) => {
    let s = _.clone(state);
    switch (action.type) {
        case ADD_DATASET:
            s.datasets[action.id] = action.payload;
            return s;
        case REMOVE_DATASET:
            return _.omit(s.datasets, action.id);
        default:
            return state;
    }
};
