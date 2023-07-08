import {createStore} from 'redux';
import actionHandlers, {ApplicationState} from './action_handlers';
import {initialState} from './action_handlers/datasets';

// @ts-ignore
export default createStore<ApplicationState>(actionHandlers, {data: initialState});
