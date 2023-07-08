import * as d3 from 'd3';

import store from '../store';
import IBoard from './IBoard';

import _ from 'underscore';
import {VisGenerator} from './VisGenerator';
import VisBoard from './VisBoard';
import {renderDecorations, renderPreview} from '../graphics/graphic_utils';
import {addBoard, addLink, changeBoardProperties} from '../actions/action_creators';
import ILink from './ILink';
import TransitionLink from '../animation/TransitionLink';
import {
    getBoardById,
    getBoardList,
    getBrowserInnerHeight,
    getBrowserInnerWidth,
} from '../selectors';

export const initBoardPositionFromDimension = (
    dimension: {w; h},
    view: {w; h}
): {x; y} => {
    let pad = 60,
        initPos = 20,
        rect = {
            position: {x: initPos, y: initPos},
            dimension: {w: dimension.w, h: dimension.h},
        },
        boards = getBoardList(store.getState());
    if (boards.length > 0) {
        let sortedIndices = _.range(0, boards.length);
        sortedIndices.sort((a, b) => {
            let diff = boards[a].position.y - boards[b].position.y;
            if (diff === 0) {
                return boards[a].position.x - boards[b].position.x;
            } else {
                return diff;
            }
        });
        sortedIndices.forEach((i) => {
            if (boards[i].intersects(rect)) {
                rect.position.x = boards[i].position.x + boards[i].dimension.w + pad;
                rect.position.y = boards[i].position.y;
                // Check if out of view
                if (rect.position.x < 0) {
                    rect.position.x = initPos;
                }
                if (rect.position.y < 0) {
                    rect.position.y = initPos;
                }
                if (rect.position.x + rect.dimension.w > view.w) {
                    rect.position.x = initPos;
                    rect.position.y = rect.position.y + rect.dimension.h + pad;
                }
                if (rect.position.y + rect.dimension.h > view.h) {
                    rect.position.y = rect.position.y - rect.dimension.h - pad;
                }
            }
        });
    }
    return {x: rect.position.x, y: rect.position.y};
};

export const createVisBoard = (generator: VisGenerator): IBoard => {
    let board = new VisBoard(generator),
        view = {
            w: Math.floor(getBrowserInnerWidth(store.getState()) * 0.75),
            h: Math.floor((getBrowserInnerHeight(store.getState()) - 50) * 0.7),
        };
    board.position = initBoardPositionFromDimension(board.dimension, view);
    board.previewLoading = true;
    const id = board.id;
    renderPreview(generator).then((blob) => {
        const previewLoading = false;
        const previewData = URL.createObjectURL(blob);
        generator.previewData = previewData;
        store.dispatch(changeBoardProperties(id, {previewLoading, previewData}));
    });
    let decorationUrl = URL.createObjectURL(renderDecorations(generator));
    generator.decorationData = decorationUrl;
    board.decorationData = decorationUrl;
    store.dispatch(addBoard(board));
    return board;
};

export const computeConnectorAlignments = (board: VisBoard): any => {
    let alignments = {in: 'left', out: 'right'};
    if (board.links.in) {
        let other = board.links.in.startBoard,
            angle = Math.atan2(
                other.position.y +
                    other.dimension.h / 2 -
                    board.position.y -
                    board.dimension.h / 2,
                other.position.x +
                    other.dimension.w / 2 -
                    board.position.x -
                    board.dimension.w / 2
            );
        alignments.in = ALIGNMENT_BY_ANGLE(angle + Math.PI * 0.25);
    }
    if (board.links.out) {
        let other = board.links.out.endBoard,
            angle = Math.atan2(
                other.position.y +
                    other.dimension.h / 2 -
                    board.position.y -
                    board.dimension.h / 2,
                other.position.x +
                    other.dimension.w / 2 -
                    board.position.x -
                    board.dimension.w / 2
            );
        alignments.out = ALIGNMENT_BY_ANGLE(angle + Math.PI * 0.25);
    }
    return alignments;
};

export const createTransitionLink = (
    startBoardId: number,
    endBoardId: number
): ILink => {
    let state = store.getState(),
        link = new TransitionLink(startBoardId, endBoardId),
        startBoard = getBoardById(state, startBoardId),
        endBoard = getBoardById(state, endBoardId);
    store.dispatch(addLink(link));
    store.dispatch(
        changeBoardProperties(startBoardId, _.extend(startBoard.links, {out: link}))
    );
    store.dispatch(
        changeBoardProperties(endBoardId, _.extend(endBoard.links, {in: link}))
    );
    return link;
};

const ALIGNMENT_BY_ANGLE = d3
    .scaleThreshold()
    .domain([-Math.PI, -Math.PI / 2, 0, Math.PI / 2, Math.PI])
    // @ts-ignore
    .range(['', 'left', 'top', 'right', 'bottom', 'left']);
