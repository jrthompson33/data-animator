import React from 'react';
import ReactDOM from 'react-dom';
import TransitionLink from '../../animation/TransitionLink';
import * as d3 from 'd3';

import store from '../../store';

import _ from 'underscore';
import VisBoard from '../../core/VisBoard';
import {
    Button,
    HTMLSelect,
    Label,
    MaybeElement,
    MenuItem,
    Slider,
} from '@blueprintjs/core';
import {ItemPredicate, Select} from '@blueprintjs/select';
import CustomIcon from '../common/CustomIcon';
import {ILayerTreeNode} from './LayerTreeNode';
import {computeBoundsFromProp, computeBoundsFromProps} from '../../graphics/graphic_utils';
import ILink from '../../core/ILink';
import {getDatasetById} from '../../selectors';

export interface LinkCanvasProps {
    transition: ILink;
    show: boolean;
    columnOptions: IColumnOption[];
    selected: ILayerTreeNode[];
    selectedColumn: IColumnOption;
    selectedValue: IValueOption;
    onSelectedColumnChange: (value: IColumnOption) => void;
    onSelectedValueChange: (value: IValueOption) => void;
}

export interface LinkCanvasState {
    svgWidth: number;
    svgHeight: number;
}

export interface IValueOption {
    value: string;
    startIds: string[];
    endIds: string[];
}

export interface IColumnOption {
    name: string;
    icon: string;
    values: IValueOption[];
}

const ColumnOptionSelect = Select.ofType<IColumnOption>();

const ValueOptionSelect = Select.ofType<IValueOption>();

export default class LinkCanvas extends React.Component<
    LinkCanvasProps,
    LinkCanvasState
> {
    constructor(props) {
        super(props);
        this.state = {
            svgWidth: 780,
            svgHeight: 660,
        };
    }

    public componentDidMount() {
        let svgWidth = window.innerWidth * 0.55,
            svgHeight = window.innerHeight - 50;
        this.setState({
            svgWidth,
            svgHeight,
        });
    }

    private _refs = {
        $container: React.createRef<HTMLDivElement>(),
        $svg: React.createRef<SVGSVGElement>(),
    };

    public render() {
        let startBoard =
                this.props.show && this.props.transition
                    ? this._renderBoard('start')
                    : undefined,
            endBoard =
                this.props.show && this.props.transition
                    ? this._renderBoard('end')
                    : undefined,
        linkGroup =
            this.props.show && this.props.transition
                ? this._renderLinkGroup()
                : undefined;

        let columnIcon = this.props.selectedColumn
            ? CustomIcon[this.props.selectedColumn.icon]
            : undefined;
        let columnText = this.props.selectedColumn
            ? this.props.selectedColumn.name
            : 'Select column...';
        let valueOptions = this.props.selectedColumn
            ? this.props.selectedColumn.values
            : [];
        let valueText = this.props.selectedValue
            ? this.props.selectedValue.value
            : 'Select value...';

        return (
            <div
                id="an-link-canvas"
                style={{
                    display: this.props.show ? 'block' : 'none',
                    position: 'relative',
                }}
            >
                <div
                    id="an-link-container"
                    ref={this._refs.$container}
                    style={{position: 'absolute', pointerEvents: 'none'}}
                >
                    <svg id="an-svg" ref={this._refs.$svg}>
                        {startBoard}
                        {endBoard}
                        {linkGroup}
                    </svg>
                </div>
                <div
                    id="an-link-controls"
                    style={{zIndex: 10, padding: '18px 30px'}}
                >
                    <div className="row">
                        <div className="col-md-3" id="an-link-column-select">
                            <Label>
                                Link objects by:
                                <ColumnOptionSelect
                                    items={this.props.columnOptions}
                                    itemRenderer={this._renderColumnOption}
                                    itemPredicate={this._filterColumnOption}
                                    onItemSelect={this._handleColumnChange}
                                    popoverProps={{minimal: true}}
                                    noResults={
                                        <MenuItem
                                            disabled={true}
                                            text="No results."
                                        />
                                    }
                                >
                                    <Button
                                        icon={columnIcon}
                                        text={columnText}
                                        rightIcon="caret-down"
                                    />
                                </ColumnOptionSelect>
                            </Label>
                        </div>
                        <div className="col-md-3" id="an-link-value-select">
                            <Label>
                                Show link for:
                                <ValueOptionSelect
                                    items={valueOptions}
                                    itemRenderer={this._renderValueOption}
                                    itemPredicate={this._filterValueOption}
                                    onItemSelect={this._handleValueChange}
                                    popoverProps={{minimal: true}}
                                    noResults={
                                        <MenuItem
                                            disabled={true}
                                            text="No results."
                                        />
                                    }
                                >
                                    <Button
                                        text={valueText}
                                        rightIcon="caret-down"
                                    />
                                </ValueOptionSelect>
                            </Label>
                        </div>
                        <div className="col-md-6" id="an-link-value-slider">
                            {this.props.selectedColumn ? (
                                <Slider
                                    min={0}
                                    max={this.props.selectedColumn.values.length - 1}
                                    stepSize={1}
                                    labelRenderer={false}
                                    value={this.props.selectedColumn.values.indexOf(
                                        this.props.selectedValue
                                    )}
                                    onChange={this._handleSliderChange}
                                    showTrackFill={false}
                                />
                            ) : undefined}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // private _getValueOptions(dataset: Dataset, selected: string) {
    //     let info = dataset.getInfo(selected);
    //     return _.keys(info.unique).map((k) => <option value={k}>{k}</option>);
    // }

    private _renderLinkGroup() {
        if (!this.props.selectedValue || this.props.selected.length === 0) {
            return <g className="link-group" />;
        }
        let content = undefined;
        let node = this.props.selected[0];
        if (node.linkType === 'linked' && node.type === 'object') {
            // Get props from start
            let startTemplate = this.props.transition.startBoard.generator.template,
                endTemplate = this.props.transition.endBoard.generator.template,
                startProps = this.props.selectedValue.startIds.map(
                    (id) => startTemplate.propertyMap[node.map.start][id]
                ),
                endProps = this.props.selectedValue.endIds.map(
                    (id) => endTemplate.propertyMap[node.map.end][id]
                ),
                startBounds = computeBoundsFromProps(startProps),
                endBounds = computeBoundsFromProps(endProps),
                startPath = this._transformPositionForBoard('start', [
                    startBounds.right,
                    (startBounds.top + startBounds.bottom) / 2,
                ]),
                endPath = this._transformPositionForBoard('end', [
                    endBounds.left,
                    (endBounds.top + endBounds.bottom) / 2,
                ]),
                diff = [endPath[0] - startPath[0], endPath[1] - startPath[1]],
                c0 = [diff[0] / 3, 0],
                c1 = [(diff[0] * 2) / 3, diff[1]];
            console.log(startProps);
            console.log(endProps);
            // Get props from end
            content = (
                <g>
                    <path
                        className="link-shape-path"
                        d={`M ${startPath} c ${c0} ${c1} ${diff}`}
                    />
                    <g
                        transform={this._computeBoardTransform('start')}
                        className="link-shape-group"
                    >
                        <rect
                            width={startBounds.right - startBounds.left}
                            x={startBounds.left}
                            y={startBounds.top}
                            height={startBounds.bottom - startBounds.top}
                        />
                        <circle r={6} cx={startBounds.left} cy={startBounds.top} />
                        <circle
                            r={6}
                            cx={startBounds.right}
                            cy={startBounds.bottom}
                        />
                    </g>
                    <g
                        transform={this._computeBoardTransform('end')}
                        className="link-shape-group"
                    >
                        <rect
                            width={endBounds.right - endBounds.left}
                            x={endBounds.left}
                            y={endBounds.top}
                            height={endBounds.bottom - endBounds.top}
                        />
                        <circle r={6} cx={endBounds.left} cy={endBounds.top} />
                        <circle r={6} cx={endBounds.right} cy={endBounds.bottom} />
                    </g>
                </g>
            );
        }
        return <g className="link-group">{content}</g>;
    }

    private _computeBoardTransform(which: string) {
        const board: VisBoard = this.props.transition[`${which}Board`],
            aspectRatio = board.dimension.w / board.dimension.h,
            width = (this.state.svgWidth - MARGIN.L - MARGIN.R - MARGIN.P) / 2,
            height = width / aspectRatio,
            scale = width / 1000,
            position = [
                which === 'start' ? MARGIN.L : MARGIN.L + MARGIN.P + width,
                this.state.svgHeight / 2 - height / 2,
            ],
            offset = [
                500 - board.generator.template.center[0],
                400 - board.generator.template.center[1],
            ];
        return `translate(${position}) scale(${scale}) translate(${offset})`;
    }

    private _transformPositionForBoard(which: string, original: number[]) {
        const board: VisBoard = this.props.transition[`${which}Board`],
            aspectRatio = board.dimension.w / board.dimension.h,
            width = (this.state.svgWidth - MARGIN.L - MARGIN.R - MARGIN.P) / 2,
            height = width / aspectRatio,
            scale = width / 1000,
            position = [
                which === 'start' ? MARGIN.L : MARGIN.L + MARGIN.P + width,
                this.state.svgHeight / 2 - height / 2,
            ],
            offset = [
                500 - board.generator.template.center[0],
                400 - board.generator.template.center[1],
            ];
        return [
            position[0] + (offset[0] + original[0]) * scale,
            position[1] + (offset[1] + original[1]) * scale,
        ];
    }

    private _renderBoard(which: string) {
        const board: VisBoard = this.props.transition[`${which}Board`],
            aspectRatio = board.dimension.w / board.dimension.h,
            width = (this.state.svgWidth - MARGIN.L - MARGIN.R - MARGIN.P) / 2,
            height = width / aspectRatio,
            position = [
                which === 'start' ? MARGIN.L : MARGIN.L + MARGIN.P + width,
                this.state.svgHeight / 2 - height / 2,
            ];

        return (
            <g
                className="board-link"
                key={which}
                transform={`translate(${position})`}
            >
                <rect
                    className="bg"
                    width={width + 1}
                    height={height + 1}
                    x={-0.5}
                    y={-0.5}
                />
                <text className="name" x={10} dy="-0.7em">
                    {board.name}
                </text>
                <g>
                    <image
                        className="preview-image"
                        width={width}
                        height={height}
                        xlinkHref={board.previewData}
                    />
                    <image
                        className="preview-image"
                        width={width}
                        height={height}
                        xlinkHref={board.decorationData}
                    />
                </g>
            </g>
        );
    }

    private _renderColumnOption(o: IColumnOption, {handleClick, modifiers, query}) {
        return (
            <MenuItem
                active={modifiers.active}
                disabled={modifiers.disabled}
                icon={CustomIcon[o.icon]}
                text={o.name}
                onClick={handleClick}
            />
        );
    }

    private _filterColumnOption = (
        query: string,
        o: IColumnOption,
        index?: number,
        exactMatch?: boolean
    ): boolean => {
        const normalizedName = o.name.toLowerCase(),
            normalizedQuery = query.toLowerCase();
        if (exactMatch) {
            return normalizedName === normalizedQuery;
        } else {
            return (
                `${normalizedName} ${o.icon.toLowerCase()}`.indexOf(
                    normalizedQuery
                ) >= 0
            );
        }
    };

    private _renderValueOption = (
        o: IValueOption,
        {handleClick, modifiers, query}
    ) => {
        return (
            <MenuItem
                active={modifiers.active}
                disabled={modifiers.disabled}
                text={o.value}
                onClick={handleClick}
            />
        );
    };

    private _filterValueOption = (
        query: string,
        o: IValueOption,
        index?: number,
        exactMatch?: boolean
    ): boolean => {
        const normalizedName = o.value.toLowerCase(),
            normalizedQuery = query.toLowerCase();
        if (exactMatch) {
            return normalizedName === normalizedQuery;
        } else {
            return normalizedName.indexOf(normalizedQuery) >= 0;
        }
    };

    private _handleColumnChange = (selectedColumn: IColumnOption): void => {
        this.props.onSelectedColumnChange(selectedColumn);
    };

    private _handleValueChange = (selectedValue: IValueOption): void => {
        this.props.onSelectedValueChange(selectedValue);
    };

    private _handleSliderChange = (value): void => {
        this.props.onSelectedValueChange(this.props.selectedColumn.values[value]);
    };
}

const MARGIN = {L: 30, R: 30, T: 40, B: 40, P: 70};
