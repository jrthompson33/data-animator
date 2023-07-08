import {Reducer} from 'redux';

import _ from 'underscore';

import {
    ADD_BOARD,
    COPY_BOARD,
    SELECT_BOARD,
    REMOVE_BOARD,
    CHANGE_BOARD_PROPERTIES,
    SB_CLEAR_SELECTION,
    ADD_LINK,
    REMOVE_LINK,
    SELECT_LINK,
    CHANGE_LINK_PROPERTIES,
} from '../../actions/action_types';

export interface StoryBoardState {
    boards: {};
    links: {};
}

export const initialState: StoryBoardState = {
    boards: {},
    links: {},
};

export const storyboardReducer: Reducer<StoryBoardState> = (
    state: StoryBoardState = initialState,
    action
) => {
    // let s = _.clone(state);
    switch (action.type) {
        case ADD_BOARD:
        case COPY_BOARD:
            state.boards[action.id] = action.payload;
            return state;
        case REMOVE_BOARD:
            // Remove links to/from this board
            let linkOut = state.boards[action.id].links.out,
                linkIn = state.boards[action.id].links.in;
            // Remove links if they exist
            if (linkOut) {
                state.boards[linkOut.endBoardId].links.in = undefined;
                state.links = _.omit(state.links, linkOut.id);
            }
            if (linkIn) {
                state.boards[linkIn.startBoardId].links.out = undefined;
                state.links = _.omit(state.links, linkIn.id);
            }
            // Remove the board
            state.boards = _.omit(state.boards, action.id);
            console.log(state.boards);
            console.log(action.id);
            return state;
        case SELECT_BOARD:
            _.values(state.boards).forEach((b) => (b.selected = b.id === action.id));
            return state;
        case CHANGE_BOARD_PROPERTIES:
            _.extend(state.boards[action.id], action.payload);
            return state;
        case SB_CLEAR_SELECTION:
            _.values(state.boards).forEach((b) => (b.selected = false));
            _.values(state.links).forEach((l) => (l.selected = false));
            return state;
        case ADD_LINK:
            state.links[action.id] = action.payload;
            return state;
        case REMOVE_LINK:
            // Remove reference from linked boards
            let startBoard = state.boards[state.links[action.id].startBoardId],
                endBoard = state.boards[state.links[action.id].endBoardId];
            startBoard.links.out = undefined;
            endBoard.links.in = undefined;
            // Remove from link
            state.links = _.omit(state.links, action.id);
            return state;
        case SELECT_LINK:
            _.values(state.links).forEach((l) => (l.selected = l.id === action.id));
            return state;
        case CHANGE_LINK_PROPERTIES:
            _.extend(state.links[action.id], action.payload);
            return state;
        default:
            return state;
    }
};
