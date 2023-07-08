import IBoard from '../core/IBoard';
import {
    ADD_BOARD,
    ADD_LINK,
    CHANGE_BOARD_PROPERTIES,
    COPY_BOARD,
    REMOVE_BOARD,
    REMOVE_LINK,
    SELECT_BOARD,
    SELECT_LINK,
    CHANGE_LINK_PROPERTIES,
    ADD_VIS_TEMPLATE,
    SB_CLEAR_SELECTION,
    SELECT_TRANSITION,
    ADD_BINDING,
    REMOVE_BINDING,
    ADD_SCALE,
    REMOVE_SCALE,
    REMOVE_DECORATION,
    ADD_DECORATION,
    UNDO_ACTION,
    REDO_ACTION,
    BROWSER_RESIZE,
} from './action_types';
import ILink from '../core/ILink';
import {VisTemplate} from '../core/VisTemplate';
import IBindingDecoration from '../graphics/decorations/IBindingDecoration';
import IBinding from '../data/bindings/IBinding';

export const addBoard = (board: IBoard) => ({
    type: ADD_BOARD,
    id: board.id,
    payload: board,
});

export const removeBoard = (board: IBoard) => ({
    type: REMOVE_BOARD,
    id: board.id,
    payload: board,
});

export const selectBoard = (id: number) => ({
    type: SELECT_BOARD,
    id,
});

export const copyBoard = (board: IBoard) => ({
    type: COPY_BOARD,
    id: board.id,
    payload: board,
});

export const changeBoardProperties = (id: number, props: any) => ({
    type: CHANGE_BOARD_PROPERTIES,
    id,
    payload: props,
});

export const addLink = (link: ILink) => ({
    type: ADD_LINK,
    id: link.id,
    payload: link,
});

export const removeLink = (link: ILink) => ({
    type: REMOVE_LINK,
    id: link.id,
    payload: link,
});

export const selectLink = (link: ILink) => ({
    type: SELECT_LINK,
    id: link.id,
    payload: link,
});

export const changeLinkProperties = (id: number, props: any) => ({
    type: CHANGE_LINK_PROPERTIES,
    id,
    payload: props,
});

export const clearStoryboardSelection = () => ({
    type: SB_CLEAR_SELECTION,
});

export const addVisTemplate = (template: VisTemplate) => ({
    type: ADD_VIS_TEMPLATE,
    id: template.id,
    payload: template,
});

export const selectTransition = (id: number) => ({
    type: SELECT_TRANSITION,
    id,
});

export const addBinding = (binding: IBinding) => ({
    type: ADD_BINDING,
    id: binding.id,
    payload: binding,
});

export const removeBinding = (binding: IBinding) => ({
    type: REMOVE_BINDING,
    id: binding.id,
    payload: binding,
});

export const addDecoration = (decoration: IBindingDecoration) => ({
    type: ADD_DECORATION,
    id: decoration.id,
    payload: decoration,
});

export const removeDecoration = (decoration: IBindingDecoration) => ({
    type: REMOVE_DECORATION,
    id: decoration.id,
    payload: decoration,
});

export const addScale = (scale: any) => ({
    type: ADD_SCALE,
    id: scale.id,
    payload: scale,
});

export const removeScale = (scale: any) => ({
    type: REMOVE_SCALE,
    id: scale.id,
    payload: scale,
});

export const undoAction = () => ({
    type: UNDO_ACTION,
});

export const redoAction = () => ({
    type: REDO_ACTION,
});

export const resizeBrowser = (innerWidth: number, innerHeight: number) => ({
    type: BROWSER_RESIZE,
    payload: {innerWidth, innerHeight},
});
