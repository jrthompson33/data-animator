import React from 'react';
import ReactDOM from 'react-dom';

import * as d3 from 'd3';

import _ from 'underscore';

import {connect} from 'react-redux';

import * as Rx from 'rxjs-compat';
import {
    changeBoardProperties,
    clearStoryboardSelection,
    selectBoard,
} from '../../actions/action_creators';
import IBoard from '../../core/IBoard';
import ILink from '../../core/ILink';
import {createTransitionLink} from '../../core/board_utils';
import {Icon} from '@blueprintjs/core';
import {getBoardList, getBrowserInnerHeight, getBrowserInnerWidth, getOrderedTransitionList} from '../../selectors';

interface StoryboardCanvasProps {
    boards: IBoard[];
    links: ILink[];
    moveBoard: (id, position) => void;
    selectBoard: (id) => void;
    clearSelection: () => void;
    svgWidth: number;
    svgHeight: number;
}

export class StoryboardCanvas extends React.Component<
    StoryboardCanvasProps,
    {}
> {
    constructor(props) {
        super(props);
    }

    protected _refs = {
        svg: React.createRef<SVGSVGElement>(),
        boardGroup: React.createRef<SVGGElement>(),
        linkGroup: React.createRef<SVGGElement>(),
        toolGroup: React.createRef<SVGGElement>(),
    };

    protected _observables = {
        wheel: undefined,
        mouseup: undefined,
        mousedown: undefined,
        mouseenter: undefined,
        mouseleave: undefined,
        mousemove: undefined,
        mousezip: undefined,
    };

    protected _streams = {
        item: {
            drag: undefined,
            dragstart: undefined,
            dragend: undefined,
            down: undefined,
        },
        canvas: {
            dragend: undefined,
            down: undefined,
        },
    };

    public componentDidMount() {
        // Prevent document from default zooming on any element in the svg
        this._initObservables();
        this._initStreams();
        this._subscribeToStreams();
    }

    public render() {
        // Get list of rendered, boards, sort them so selected appears on top
        let boards = _.values(this.props.boards)
            .sort((a, b) => (a.selected ? 1 : b.selected ? -1 : 0))
            .map((b) => b.renderToCanvasItem());
        // List of rendered links
        let links = _.values(this.props.links).map((l) => l.renderToCanvasItem());

        // Dropzone elements for vis files if board is empty
        let dropzone;
        if (boards.length === 0 && links.length === 0) {
            let w = this.props.svgWidth,
                h = this.props.svgHeight;
            dropzone = (
                <g
                    transform={`translate(${[w * 0.5, h * 0.5]})`}
                    className="sb-dropzone"
                >
                    <rect
                        height={h * 0.6}
                        width={w * 0.4}
                        x={w * -0.2}
                        y={h * -0.3}
                    />
                    <Icon tagName="g" icon="import" iconSize={50} />
                    <text className="label-large" y={10}>
                        IMPORT VIS
                    </text>
                    <text className="label-small" y={36}>
                        Drag and drop files (*.diproj)
                    </text>
                </g>
            );
        }
        return (
            <svg id="sb-canvas" ref={this._refs.svg}>
                <g id="sb-link-group" ref={this._refs.linkGroup}>
                    {links}
                </g>
                <g id="sb-board-group" ref={this._refs.boardGroup}>
                    {boards}
                </g>
                <g id="sb-tool-group" ref={this._refs.toolGroup}>
                    {dropzone}
                </g>
            </svg>
        );
    }

    private _initObservables() {
        Rx.Observable.fromEvent(document, 'wheel').subscribe((event) => {
            if (this._refs.svg.current.contains(event.target as Node)) {
                event.preventDefault();
            }
        });

        this._observables.wheel = Rx.Observable.fromEvent(
            this._refs.svg.current,
            'wheel'
        );
        this._observables.mouseup = Rx.Observable.fromEvent(
            this._refs.svg.current,
            'mouseup'
        );
        this._observables.mousedown = Rx.Observable.fromEvent(
            this._refs.svg.current,
            'mousedown'
        );
        this._observables.mouseenter = Rx.Observable.fromEvent(
            this._refs.svg.current,
            'mouseenter'
        );
        this._observables.mouseleave = Rx.Observable.fromEvent(
            this._refs.svg.current,
            'mouseleave'
        );
        this._observables.mousemove = Rx.Observable.fromEvent(
            this._refs.svg.current,
            'mousemove'
        );
        this._observables.mousezip = this._observables.mousemove.zip(
            this._observables.mousemove.skip(1)
        );
    }

    private _getItem(t) {
        if (t.dataset) {
            switch (t.dataset['type']) {
                case 'board':
                case 'connector':
                    return this._getBoardFromId(parseInt(t.dataset['id']));
                default:
                    return undefined;
            }
        }
    }

    private _initStreams() {
        // Test what the mousedown event hits
        let testMouseDown = this._observables.mousedown.map((e) => ({
            item: this._getItem(e.target),
            raw: e,
        }));
        let itemMouseDown = testMouseDown.filter((e) => !!e.item);
        let canvasMouseDown = testMouseDown.filter((e) => !e.item);
        let itemFlatMap = (e) => ({
            startPos: {x: e.raw.x, y: e.raw.y},
            itemPos: _.clone(e.item.position),
            item: e.item,
            control: e.raw.target.dataset['type'],
            subControl: e.raw.target.dataset['subtype'],
        });

        // Create streams for clicking and dragging on canvas items such as boards, links, connectors
        this._streams.item.down = itemMouseDown.map((e) => {
            const {itemPos, item, control, subControl} = itemFlatMap(e);
            return {
                origin: itemPos,
                item,
                control,
                subControl,
            };
        });
        this._streams.item.drag = itemMouseDown.flatMap((e) => {
            const {startPos, itemPos, item, control, subControl} = itemFlatMap(e);

            return this._observables.mousezip
                .map((ee) => {
                    return {
                        origin: itemPos,
                        total: {x: ee[1].x - startPos.x, y: ee[1].y - startPos.y},
                        item,
                        control,
                        subControl,
                        shift: ee[0].shiftKey,
                        delta: {x: ee[1].x - ee[0].x, y: ee[1].y - ee[0].y},
                    };
                })
                .takeUntil(this._observables.mouseup);
        });
        this._streams.item.dragstart = itemMouseDown.flatMap((e) => {
            const {startPos, itemPos, item, control, subControl} = itemFlatMap(e);

            return this._observables.mousemove
                .map((ee) => {
                    return {
                        origin: itemPos,
                        item: item,
                        control,
                        subControl,
                        shift: ee.shiftKey,
                        delta: {x: ee.x - startPos.x, y: ee.y - startPos.y},
                    };
                })
                .take(1)
                .takeUntil(this._observables.mouseup);
        });
        this._streams.item.dragend = itemMouseDown.flatMap((e) => {
            const {startPos, itemPos, item, control, subControl} = itemFlatMap(e);

            return this._observables.mouseup.first().map((ee) => {
                return {
                    origin: itemPos,
                    item,
                    control,
                    subControl,
                    shift: ee.shiftKey,
                    target: ee.target,
                    delta: {x: ee.x - startPos.x, y: ee.y - startPos.y},
                };
            });
        });

        // Create streams for interacting with the canvas, e.g. click does not hit an item
        this._streams.canvas.down = canvasMouseDown.map((e) => e);
        this._streams.canvas.dragend = canvasMouseDown.flatMap((e) => {
            return this._observables.mouseup.first().map((ee) => {
                return e;
            });
        });
    }

    private _subscribeToStreams() {
        this._streams.item.down.subscribe((e) => {
            switch (e.control) {
                case 'board':
                case 'connector':
                    this.props.selectBoard(e.item.id);
                    break;
                default:
                    break;
            }
        });
        this._streams.item.dragstart.subscribe((e) => {
            switch (e.control) {
                case 'connector':
                    if (e.subControl === 'out') {
                        this._startLinkTool(e.item);
                    } else if (e.subControl === 'in') {
                    } else if (e.subControl === 'bookmark') {
                    }
                    break;
                default:
                    break;
            }
        });
        this._streams.item.drag.subscribe((e) => {
            switch (e.control) {
                case 'board':
                    this.props.moveBoard(e.item.id, {
                        x: e.origin.x + e.total.x,
                        y: e.origin.y + e.total.y,
                    });
                    break;
                case 'connector':
                    this._updateLinkTool(e.item, e);
                    break;
            }
        });

        this._streams.item.dragend.subscribe((e) => {
            switch (e.control) {
                case 'board':
                    break;
                case 'connector':
                    this._endLinkTool(e);
                    break;
            }
        });

        this._streams.canvas.down.subscribe((e) => {
            this.props.clearSelection();
        });
    }

    private _startLinkTool(board: IBoard) {
        // let board = this._getBoardFromId(boardId);
        let pos = board.getConnectorLinkPosition('out');
        d3.select(this._refs.boardGroup.current).classed('link-mode', true);
        let select = d3
            .select(this._refs.toolGroup.current)
            .selectAll('.link-tool')
            .data([0]);
        let enter = select
            .enter()
            .append('g')
            .attr('class', 'link-tool')
            .attr('transform', `translate(${[board.position.x, board.position.y]})`);
        enter
            .append('path')
            .attr('class', 'link-path')
            .attr('d', `M ${[pos.x, pos.y]} L ${[pos.x, pos.y]}`);
        let handle = enter
            .append('g')
            .attr('class', 'handle')
            .attr('transform', (d) => `translate(${[pos.x, pos.y]})`);
        handle.append('circle').attr('r', 8);
        handle
            .append('path')
            .attr('class', 'arrow-chevron')
            .attr('d', 'M -1,-4.3 l 3.5,4.3 l -3.5,4.3');
        enter
            .append('path')
            .attr('class', 'arrow-bg')
            .attr('transform', `translate(${[pos.x, pos.y]})`)
            .attr('d', 'M -9.5,-12 h 12 q 6,0 6,6 v12 q 0,6 -6, 6 h -12 z');
    }

    private _updateLinkTool(board: IBoard, event) {
        let posOut = board.getConnectorLinkPosition('out');
        let posIn = {x: posOut.x + event.total.x, y: posOut.y + event.total.y};
        let rotate = event.total.x > 0 ? 0 : 180;
        let c0 = [event.total.x / 3, 0],
            c1 = [(event.total.x * 2) / 3, event.total.y],
            c = [event.total.x, event.total.y];
        let select = d3.select(this._refs.toolGroup.current).select('.link-tool');

        select
            .select('.link-path')
            .attr('d', `M ${[posOut.x, posOut.y]} c ${c0} ${c1} ${c}`);
        select
            .select('.handle')
            .attr('transform', `translate(${[posIn.x, posIn.y]}) rotate(${rotate})`);
    }

    private _endLinkTool(event) {
        let endItem = this._getItem(event.target);
        if (endItem && event.item.id !== endItem.id) {
            // Create a link if possible, can't create link to same board
            createTransitionLink(event.item.id, endItem.id);
        }

        // Clean up the link tool
        d3.select(this._refs.boardGroup.current).classed('link-mode', false);
        d3.select(this._refs.toolGroup.current).selectAll('.link-tool').remove();
    }

    private _getBoardFromId(boardId: number) {
        return _.filter(this.props.boards, (b) => b.id === boardId)[0];
    }
}

const mapStateToProps = (state, ownProps) => {
    let boards = getBoardList(state),
        links = getOrderedTransitionList(state),
        svgWidth = Math.floor(getBrowserInnerWidth(state) * 0.75),
        svgHeight = Math.floor((getBrowserInnerHeight(state) - 50) * 0.7);
    return {boards, links, svgWidth, svgHeight};
};

const mapDispatchToProps = (dispatch) => {
    return {
        moveBoard: (id, position) => dispatch(changeBoardProperties(id, {position})),
        selectBoard: (id) => dispatch(selectBoard(id)),
        clearSelection: () => dispatch(clearStoryboardSelection()),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(StoryboardCanvas);
