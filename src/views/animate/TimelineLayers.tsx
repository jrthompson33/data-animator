import React from 'react';
import ReactDOM from 'react-dom';
import {connect} from 'react-redux';

import * as d3 from 'd3';
import _ from 'underscore';

import {
    formatDurationWithDecimalNoPad,
    formatDurationWithFixedNoPad,
} from '../../utils';
import {LayerTree} from './LayerTree';
import {ILayerTreeNode} from './LayerTreeNode';
import TransitionLink from 'animation/TransitionLink';
import LinkElement from './svg/LinkElement';
import {AnimationEffect} from '../../animation/AnimationEffect';
import {EasingOption} from '../../animation/EasingOption';
import {
    Button,
    Label,
    NumericInput,
    Position,
    Slider,
    Tooltip,
} from '@blueprintjs/core';
import {Tag} from '@blueprintjs/core/lib/esnext';
import {getBrowserInnerHeight, getBrowserInnerWidth} from '../../selectors';
import StageElement from './svg/StageElement';
import {Intent} from '@blueprintjs/core/lib/esm/common/intent';

export const MARGIN = {L: 14, R: 14, T: 4, B: 4};

export class TimelineLayers extends React.Component<
    {
        transition: TransitionLink;
        nodes: ILayerTreeNode[];
        selected: ILayerTreeNode[];
        onScrub: (time: number) => void;
        onSelectionChange: (node: ILayerTreeNode) => void;
        linkMode: boolean;
        svgWidth?: number;
        listHeight?: number;
    },
    {}
> {
    constructor(props) {
        super(props);
    }

    public componentDidMount() {
        // Set up drag handlers for scrubber
        d3.select(this._refs.axis.current)
            .select('.time-scrubber')
            .call(this._scrubberDrag);
        d3.select(this._refs.scrubberLine.current).call(this._scrubberDrag);
    }

    protected _refs = {
        axis: React.createRef<SVGSVGElement>(),
        header: React.createRef<SVGSVGElement>(),
        scrubberLine: React.createRef<HTMLDivElement>(),
        timeLabel: React.createRef<HTMLSpanElement>(),
    };

    protected _timeScale = d3.scaleLinear().domain([0, 5e3]).clamp(true);
    protected _percentScale = d3.scaleLinear().range([0, 5e3]).clamp(true);
    protected _timeNormal = d3.scaleLinear().domain([0, 1]).clamp(true);

    protected _time: number = 0;
    protected _guides = {show: false, start: 0, end: 1};

    public updateTime = (time: number) => {
        this._time = time;
        let x = this._timeScale(time);
        d3.select(this._refs.axis.current)
            .select('.time-scrubber')
            .attr('transform', `translate(${9.5 + x},0) rotate(180)`);
        d3.select(this._refs.scrubberLine.current)
            .style('left', `${7 + Math.floor(x)}px`)
            .select('#an-scrubber-g')
            .attr('transform', `translate(${(x % 1).toFixed(5)},0)`);
        this._refs.timeLabel.current.textContent =
            formatDurationWithFixedNoPad(time, 3) + 's';
    };

    private _handleGuideUpdate = (
        show: boolean,
        startOrEnd?: string,
        scaled?: number
    ) => {
        this._guides.show = show;
        let guides = d3
            .select(this._refs.axis.current)
            .select('.time-guides')
            .classed('show', show);
        if (startOrEnd) {
            this._guides[startOrEnd] = scaled;
            let g = guides
                .select(`.time-guide-${startOrEnd}`)
                .attr('transform', `translate(${this._timeNormal(scaled)},0)`);
            g.select('text').text(
                formatDurationWithFixedNoPad(this._percentScale(scaled), 2) + 's'
            );
        }
    };

    public render() {
        this._timeScale.range([0, this.props.svgWidth - MARGIN.L - MARGIN.R]);
        this._timeNormal.range([0, this.props.svgWidth - MARGIN.L - MARGIN.R]);
        const axis = this._renderAxis(),
            linkElements = this._renderLinkElements(),
            stageTicks = this._renderStageTicks(),
            startBoardName = this.props.transition
                ? this.props.transition.startBoard.name
                : '',
            endBoardName = this.props.transition
                ? this.props.transition.endBoard.name
                : '';
        return (
            <div id="an-timeline-layers">
                <div className="row" id="an-main-row">
                    <div
                        style={{padding: '6px 4px', width: '70px', flex: '0 0 70px'}}
                    >
                        <span
                            id="an-current-time"
                            className="time-label"
                            style={{
                                display: this.props.linkMode ? 'none' : 'inline',
                            }}
                            ref={this._refs.timeLabel}
                        >
                            0.00s
                        </span>
                    </div>
                    <div style={{flex: '1 1 auto', height: '32px'}}>
                        <svg
                            id="an-axis-svg"
                            ref={this._refs.axis}
                            style={{display: this.props.linkMode ? 'none' : 'block'}}
                        >
                            {axis}
                        </svg>
                        <div
                            style={{
                                display: this.props.linkMode ? 'block' : 'none',
                                padding: '6px 14px',
                            }}
                        >
                            <Tag>{startBoardName}</Tag>
                            <Tag style={{float: 'right'}}>{endBoardName}</Tag>
                        </div>
                    </div>
                    <div
                        style={{width: '70px', flex: '0 0 70px'}}
                        id="an-duration-container"
                    >
                        <div
                            style={{display: this.props.linkMode ? 'none' : 'block'}}
                        >
                            <NumericInput
                                max={120}
                                min={0}
                                majorStepSize={1}
                                stepSize={0.1}
                                minorStepSize={0.01}
                                selectAllOnFocus={true}
                                buttonPosition={Position.RIGHT}
                                onValueChange={this._handleDurationChange}
                                rightElement={<Tag minimal={true}>s</Tag>}
                                value={this._timeScale.domain()[1] / 1e3}
                            />
                        </div>
                    </div>
                </div>
                <div
                    id="an-stage-ticks-container"
                    style={{
                        display: this.props.linkMode ? 'none' : 'block',
                    }}
                >
                    {stageTicks}
                </div>
                <div id="an-layers-container" className="row">
                    <LayerTree
                        scale={this._timeNormal}
                        contents={this.props.nodes}
                        linkMode={this.props.linkMode}
                        onNodeClick={this._handleNodeClick}
                        onNodeChildCollapse={this._handleNodeChildCollapse}
                        onNodeChildExpand={this._handleNodeChildExpand}
                        onNodePropCollapse={this._handleNodePropCollapse}
                        onNodePropExpand={this._handleNodePropExpand}
                        onNodeSoloedChange={this._handleNodeSoloedChange}
                        onNodeTimingSelect={this._handleNodeTimingSelect}
                        onNodeEffectChange={this._handleNodeEffectChange}
                        onNodeEasingChange={this._handleNodeEasingChange}
                        onNodeKeyUpdate={this._handleNodeKeyUpdate}
                        onNodePeerDurationUpdate={this._handleNodePeerDurationUpdate}
                        onNodeAggregationChange={this._handleNodeAggregationChange}
                        onNodeReverseSequencing={this._handleNodeReverseSequencing}
                        onGuideUpdate={this._handleGuideUpdate}
                    />
                </div>
                <div
                    id="an-scrubber-container"
                    style={{
                        left: '7px',
                        top: '30px',
                        display: this.props.linkMode ? 'none' : 'block',
                    }}
                    ref={this._refs.scrubberLine}
                >
                    <svg id="an-scrubber-svg">
                        <g id="an-scrubber-g">
                            <path d={`M7,0 v${this.props.listHeight}`} />
                            <rect height={this.props.listHeight} width={14} y={30} />
                        </g>
                    </svg>
                </div>
                <div
                    id="an-link-mode-container"
                    style={{
                        display: !this.props.linkMode ? 'none' : 'block',
                    }}
                >
                    {linkElements}
                </div>
            </div>
        );
    }

    private _renderAxis() {
        if (this.props.transition) {
            this._timeScale.domain([0, this.props.transition.generator.duration]);
            this._percentScale.range([0, this.props.transition.generator.duration]);
        }
        let computeTicks = this._timeScale.ticks(5);
        // Make sure start and end of time scale are included as ticks
        if (computeTicks[0] !== this._timeScale.domain()[0]) {
            computeTicks.push(this._timeScale.domain()[0]);
        }
        if (computeTicks[computeTicks.length - 1] !== this._timeScale.domain()[1]) {
            computeTicks.push(this._timeScale.domain()[1]);
        }
        const majorTicks = computeTicks.map((t, i, a) => (
            <g
                className="major-tick"
                transform={`translate(${[this._timeScale(t), 0]})`}
            >
                <path d={`M0,0v-${TICK_LENGTH(i, a)}`} />
                <text
                    y="-16"
                    x={X_POSITION(i, a)}
                    dy="-0.31em"
                    style={{textAnchor: CHOOSE_ANCHOR(i, a)}}
                >
                    {formatDurationWithDecimalNoPad(t) + ADD_SECONDS(i, a)}
                </text>
            </g>
        ));
        const minorTicks = this._computeMinorTicks(this._timeScale.ticks(5)).map(
            (t) => (
                <g
                    className="minor-tick"
                    transform={`translate(${[this._timeScale(t), 0]})`}
                >
                    <path d="M0,0v-5" />
                </g>
            )
        );
        const timeGuides = ['start', 'end'].map((t) => (
            <g className={`time-guide time-guide-${t}`}>
                <path d="M0,0l-6,-7.5h12z" />
                <text y={-10}>0.00s</text>
            </g>
        ));
        const range = this._timeScale.range(),
            w = range[1] - range[0];
        return (
            <g className="time-axis" transform={`translate(${[MARGIN.L, 32]})`}>
                <g className="minor-axis">{majorTicks}</g>
                <g className="major-axis">{minorTicks}</g>
                <g className="time-guides">{timeGuides}</g>
                <g
                    className="time-scrubber"
                    transform={`translate(9.5, 0) rotate(180)`}
                    style={{display: this.props.linkMode ? 'none' : 'inline'}}
                >
                    <path className="handle" d={SCRUBBER_BG} />
                    <rect className="hover-rect" height={30} width={20} x={-0.5} />
                </g>
            </g>
        );
    }

    private _renderLinkElements() {
        const {linkMode, selected} = this.props;
        let exits = _.filter(selected, (n) => n.linkType === 'exit'),
            enters = _.filter(selected, (n) => n.linkType === 'enter');
        // Only create links between pairs of exit and enter selections, match parents as well
        if (linkMode && exits.length > 0 && enters.length > 0) {
            // TODO how do parents get linked? Need to support one exit becoming multiple enters and vice-versa
            const links = exits.map((e) => {
                return (
                    <LinkElement
                        startKey={0}
                        endKey={1}
                        scaleKey={this._timeNormal}
                        startRow={this.props.nodes.indexOf(enters[0])}
                        endRow={this.props.nodes.indexOf(e)}
                    />
                );
            });
            return (
                <svg
                    id="an-link-mode-svg"
                    style={{width: `${this.props.svgWidth}px`}}
                >
                    {links}
                </svg>
            );
        } else {
            return undefined;
        }
    }

    private _renderStageTicks() {
        const {linkMode, svgWidth, listHeight} = this.props;
        // Only create links between pairs of exit and enter selections, match parents as well
        if (!linkMode) {
            // TODO how do parents get linked? Need to support one exit becoming multiple enters and vice-versa
            // const links = exits.map((e) => {
            //     return (
            //         <LinkElement
            //             startKey={0}
            //             endKey={1}
            //             scaleKey={this._timeNormal}
            //             startRow={this.props.nodes.indexOf(enters[0])}
            //             endRow={this.props.nodes.indexOf(e)}
            //         />
            //     );
            // });
            return (
                <svg id="an-stage-ticks-svg" style={{width: `${svgWidth}px`}}>
                    <path
                        className="stage-tick"
                        d={`M${MARGIN.L},0 v${listHeight - 5}`}
                    />
                    <path
                        className="stage-tick"
                        d={`M${svgWidth - MARGIN.L},0 v${listHeight - 5}`}
                    />
                </svg>
            );
        } else {
            return undefined;
        }
    }

    private _computeMinorTicks(majorTicks) {
        let majorPadding =
            this._timeScale(majorTicks[1]) - this._timeScale(majorTicks[0]);
        let majorDelta = majorTicks[1] - majorTicks[0];
        let numMinor = 0;
        if (majorPadding < 20) {
            numMinor = 0;
        } else if (majorPadding < 40) {
            numMinor = 1;
        } else if (majorPadding < 80) {
            numMinor = 3;
        } else if (majorPadding < 140) {
            numMinor = 5;
        } else if (majorPadding < 300) {
            numMinor = 9;
        }
        let minorTicks = [];
        majorTicks.forEach((mt) => {
            for (let i = 1; i < numMinor + 1; i++) {
                minorTicks.push(mt + (i * majorDelta) / (numMinor + 1));
            }
        });
        return minorTicks;
    }

    private _handleNodeClick = (
        nodeData: ILayerTreeNode,
        _nodePath: number[],
        e: React.MouseEvent<HTMLElement>
    ) => {
        // Only allow selecting nodes in link mode
        if (this.props.linkMode) {
            nodeData.isSelected = !nodeData.isSelected;
            this.forceUpdate();
            this.props.onSelectionChange(nodeData);
        }
    };

    private _handleNodeChildCollapse = (nodeData: ILayerTreeNode) => {
        nodeData.childExpanded = false;
        this.forceUpdate();
    };

    private _handleNodeChildExpand = (nodeData: ILayerTreeNode) => {
        nodeData.childExpanded = true;
        this.forceUpdate();
    };

    private _handleNodePropCollapse = (nodeData: ILayerTreeNode) => {
        nodeData.propExpanded = false;
        this.forceUpdate();
    };

    private _handleNodePropExpand = (nodeData: ILayerTreeNode) => {
        nodeData.propExpanded = true;
        this.forceUpdate();
    };

    private _handleNodeTimingSelect = (
        nodeData: ILayerTreeNode,
        type: string,
        field: string
    ) => {
        this.props.transition.generator.createSequencing(
            nodeData.id as string,
            nodeData.linkType,
            nodeData.peers.peerField,
            type,
            field
        );
        nodeData.peers.groups = nodeData.timing.peerGroups;
        this.forceUpdate();
    };

    private _handleNodeEffectChange = (
        nodeData: ILayerTreeNode,
        effect: AnimationEffect
    ) => {
        this.props.transition.generator.updateEffect(
            nodeData.id as string,
            nodeData.linkType,
            effect
        );
        nodeData.effect = effect;
        this.forceUpdate();
    };

    private _handleNodeSoloedChange = (
        nodeData: ILayerTreeNode,
        isSoloed: boolean
    ) => {
        let svg = document.getElementById('an-svg');

        if (svg instanceof SVGSVGElement) {
            let flattenNodes = (
                node: ILayerTreeNode,
                listOfIds: string[]
            ): string[] => {
                if (!node.childNodes || node.childNodes.length === 0) {
                    return [node.id as string];
                } else {
                    let childIds = _.flatten(
                        node.childNodes.map((n) => flattenNodes(n, listOfIds))
                    );
                    return listOfIds.concat(childIds as string[]);
                }
            };
            let ids = flattenNodes(nodeData, []);
            this.props.transition.generator.updateSoloed(
                svg,
                ids,
                nodeData.type,
                nodeData.linkType,
                isSoloed
            );
            nodeData.isSoloed = isSoloed;
            this.forceUpdate();
        }
    };

    private _handleNodeEasingChange = (
        nodeData: ILayerTreeNode,
        easing: EasingOption
    ) => {
        this.props.transition.generator.updateEasing(
            nodeData.id as string,
            nodeData.type,
            nodeData.linkType,
            easing
        );
        this.forceUpdate();
    };

    private _handleNodeKeyUpdate = (
        nodeData: ILayerTreeNode,
        key: string,
        raw: number,
        which: string
    ) => {
        this.props.transition.generator.updateKey(
            nodeData.id as string,
            nodeData.type,
            nodeData.linkType,
            key,
            raw,
            which
        );
        // Update the data that's already bound
        let index = _.findIndex(nodeData.properties, (p) => p.name === which);
        switch (key) {
            case 'prop-start':
                if (index > -1) {
                    nodeData.properties[index].startKey = raw;
                }
                break;
            case 'prop-end':
                if (index > -1) {
                    nodeData.properties[index].endKey = raw;
                }
                break;
        }
        this.forceUpdate();
    };

    private _handleNodePeerDurationUpdate = (
        nodeData: ILayerTreeNode,
        value: number
    ) => {
        // Update the data that's already bound
        nodeData.timing.setDefaultDuration(value);
        nodeData.peers.groups = nodeData.timing.peerGroups;
        this.forceUpdate();

        // Update the animation generator with the new timings
        this.props.transition.generator.updateObjects();
    };

    private _handleNodeAggregationChange = (
        nodeData: ILayerTreeNode,
        value: string
    ) => {
        nodeData.timing.setAggregation(value);

        // Update the data that's already bound
        nodeData.peers.groups = nodeData.timing.peerGroups;
        this.forceUpdate();

        // Update the animation generator with the new timings
        this.props.transition.generator.updateObjects();
    };

    private _handleNodeReverseSequencing = (nodeData: ILayerTreeNode) => {
        nodeData.timing.toggleIsReverse();

        // Update the data that's already bound
        nodeData.peers.groups = nodeData.timing.peerGroups;
        this.forceUpdate();

        // Update the animation generator with the new timings
        this.props.transition.generator.updateObjects();
    };

    private forEachNode(
        nodes: ILayerTreeNode[],
        callback: (node: ILayerTreeNode) => void
    ) {
        if (nodes == null) {
            return;
        }

        for (const node of nodes) {
            callback(node);
            this.forEachNode(node.childNodes, callback);
        }
    }

    private _handleScrubberStart = () => {
        d3.select(this._refs.axis.current)
            .select('.time-scrubber')
            .classed('dragging', true);
        d3.select(this._refs.scrubberLine.current).classed('dragging', true);
    };

    private _handleScrubberDrag = () => {
        let currX = this._timeScale(this._time);
        let newX = currX + d3.event.dx;
        this.props.onScrub(this._timeScale.invert(newX));
    };

    private _handleScrubberEnd = () => {
        d3.select(this._refs.axis.current)
            .select('.time-scrubber')
            .classed('dragging', false);
        d3.select(this._refs.scrubberLine.current).classed('dragging', false);
    };

    private _handleDurationChange = (value: number) => {
        this.props.transition.generator.duration = Math.round(value * 1e3);
        this.forceUpdate();

        // Update the animation generator with the new duration
        this.props.transition.generator.updateObjects();
    };

    private _scrubberDrag = d3
        .drag()
        .on('start', this._handleScrubberStart.bind(this))
        .on('drag', this._handleScrubberDrag.bind(this))
        .on('end', this._handleScrubberEnd.bind(this));
}

const mapStateToProps = (state, ownProps) => {
    let innerWidth = getBrowserInnerWidth(state),
        innerHeight = getBrowserInnerHeight(state),
        svgWidth = innerWidth * 0.45 - 16 - 140,
        listHeight = innerHeight - 50 - 60 - 140 - 32;

    return {svgWidth, listHeight};
};

const mapDispatchToProps = (dispatch) => {
    return {};
};

export default connect(mapStateToProps, mapDispatchToProps, null, {
    forwardRef: true,
})(TimelineLayers);

const CHOOSE_ANCHOR = (i, a) =>
    i === 0 ? 'start' : i === a.length - 1 ? 'end' : 'middle';
const TICK_LENGTH = (i, a) => (i === 0 || i === a.length - 1 ? 32 : 12);
const ADD_SECONDS = (i, a) => (i === 0 || i === a.length - 1 ? 's' : '');
const X_POSITION = (i, a) => (i === 0 ? 4 : i === a.length - 1 ? -4 : 0);

const SCRUBBER_BG =
    'M 9.500400543212891 28.20819854736328 C 4.53756046295166 28.20819854736328' +
    ' 0.5000004172325134 24.29336929321289 0.5000004172325134 19.48139953613281 C 0.5000004172325134' +
    ' 18.25682830810547 1.139960408210754 15.60610866546631 4.188750267028809 9.932258605957031 C 6.178530216217041 6.229198932647705 8.440380096435547 2.64064884185791 9.406229972839355 1.108268737792969 C 9.454963684082031 1.030951738357544 9.499378204345703 0.960486114025116 9.539901733398438 0.896148681640625 C 10.31093883514404 2.037322044372559 12.08035278320312 4.828863620758057 13.88678073883057 8.086698532104492 C 16.86160087585449 13.45157909393311 18.49990081787109 17.49829864501953 18.49990081787109 19.48139953613281 C 18.49990081787109 24.29336929321289 14.46273994445801 28.20819854736328 9.500400543212891 28.20819854736328 Z M 9.250200271606445 15.50019836425781 C 7.18250036239624 15.50019836425781 5.500300407409668 17.18239784240723 5.500300407409668 19.25009918212891 C 5.500300407409668 21.31779861450195 7.18250036239624 22.99999809265137 9.250200271606445 22.99999809265137 C 11.31790065765381 22.99999809265137 13.00010013580322 21.31779861450195 13.00010013580322 19.25009918212891 C 13.00010013580322 17.18239784240723 11.31790065765381 15.50019836425781 9.250200271606445 15.50019836425781 Z';
