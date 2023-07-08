import {combineReducers} from 'redux';
import {datasetReducer, DataState} from './datasets';
import {visReducer, VisState} from './visualization';
import {graphicReducer, GraphicState} from './graphic';
import {storyboardReducer, StoryBoardState} from './story_board';

import undoable from 'redux-undo';
import {browserReducer, BrowserState} from './browser';

export interface ApplicationState {
    data: DataState;
    vis: VisState;
    canvas: GraphicState;
    storyboard: StoryBoardState;
    browser: BrowserState;
}

export default undoable(
    combineReducers<ApplicationState>({
        data: datasetReducer,
        vis: visReducer,
        canvas: graphicReducer,
        storyboard: storyboardReducer,
        browser: browserReducer,
    }),
    {
        filter: (action, currentState, previousHistory): boolean => {
            return true;
        },
        limit: 20,
    }
);
