import React, {ReactNode} from 'react';
import ReactDOM from 'react-dom';
import {connect} from 'react-redux';

import * as d3 from 'd3';
import _ from 'underscore';

import {AnimationGenerator} from '../../animation/AnimationGenerator';

import {MARGIN} from './TimelineLayers';
import {
    Button,
    IIntentProps,
    Intent,
    MaybeElement,
    Position,
    Tag,
    Tooltip,
} from '@blueprintjs/core';
import DefsElement from './svg/DefsElement';
import {formatCount} from '../../utils';
import LayerElement from './svg/LayerElement';
import {VisGenerator} from '../../core/VisGenerator';
import TransitionLink from '../../animation/TransitionLink';
import {getBrowserInnerHeight, getBrowserInnerWidth} from '../../selectors';

export class LinkView extends React.Component<
    {
        transition: TransitionLink;
        linkMode: boolean;
        onLinkModeChange: (linkMode: boolean) => void;
        svgWidth?: number;
    },
    {linking: boolean}
> {
    constructor(props) {
        super(props);
        this.state = {
            linking: false,
        };
    }

    public render() {
        const {linkMode} = this.props;
        return (
            <div id="an-link-view">
                <div className="row" style={{padding: '4px'}}>
                    <span className="panel-label">Object Matching</span>
                    <div style={{marginLeft: 'auto', display: 'inline-block'}}>
                        <Tooltip
                            content="Visualize and edit object matching between vis boards."
                            position={Position.TOP}
                        >
                            <Button
                                intent={linkMode ? Intent.SUCCESS : Intent.PRIMARY}
                                text={linkMode ? 'Done Matching' : 'Edit Matching'}
                                icon={linkMode ? 'updated' : 'edit'}
                                onClick={() =>
                                    this.props.onLinkModeChange(!this.props.linkMode)
                                }
                            />
                        </Tooltip>
                    </div>
                </div>
                {this._maybeRenderDetails()}
            </div>
        );
    }

    private _maybeRenderDetails(): MaybeElement {
        return this.props.transition ? (
            <div className="row" style={{marginBottom: '2px'}}>
                <div className="col-md-3" id="an-start-link">
                    {this._renderPreview(
                        this.props.transition.generator.startVis,
                        this.props.transition.startBoard.name,
                        'start'
                    )}
                </div>
                <div className="col-md-6" id="an-object-link">
                    {this._renderObjects(this.props.transition.generator)}
                </div>
                <div className="col-md-3" id="an-end-link">
                    {this._renderPreview(
                        this.props.transition.generator.endVis,
                        this.props.transition.endBoard.name,
                        'end'
                    )}
                </div>
            </div>
        ) : undefined;
    }

    private _renderObjects(animation: AnimationGenerator): JSX.Element {
        const width = this.props.svgWidth - MARGIN.L - MARGIN.R,
            scale = d3.scaleLinear().domain([0, 1]).range([0, width]),
            enterCount = _.reduce(animation.enter, COUNT_REDUCE, [0, 0]),
            linkedCount = _.reduce(animation.linked, COUNT_REDUCE, [0, 0]),
            exitCount = _.reduce(animation.exit, COUNT_REDUCE, [0, 0]);

        return (
            <div>
                <div className="row">
                    {this._renderObjectGroup(
                        scale,
                        'linked',
                        'Matched Objects',
                        formatCount(linkedCount[0]),
                        formatCount(linkedCount[1]),
                        false
                    )}
                </div>
                <div className="row">
                    {this._renderObjectGroup(
                        scale,
                        'enter',
                        'Entering Objects',
                        formatCount(enterCount[0]),
                        formatCount(enterCount[1]),
                        true
                    )}
                </div>
                <div className="row">
                    {this._renderObjectGroup(
                        scale,
                        'exit',
                        'Exiting Objects',
                        formatCount(exitCount[0]),
                        formatCount(exitCount[1]),
                        false
                    )}
                </div>
            </div>
        );
    }

    private _renderObjectGroup(
        scale: any,
        which,
        title: string,
        startCount: string,
        endCount: string,
        includeDefs: boolean
    ): JSX.Element {
        return (
            <div
                className="col-md-12"
                style={{display: 'flex', flexFlow: '', padding: '4px 0'}}
            >
                <div style={{padding: '0 4px', width: '70px', flex: '0 0 70px'}}>
                    <Tag minimal={true} style={{float: 'right'}}>
                        {startCount}
                    </Tag>
                </div>
                <div style={{flex: '1 1 auto', height: '26px'}}>
                    <div
                        style={{
                            position: 'absolute',
                            marginTop: '-14px',
                            left: 0,
                            right: 0,
                            textAlign: 'center',
                        }}
                    >
                        <Tag minimal={true}>{title}</Tag>
                    </div>
                    <svg className="layer-svg">
                        {includeDefs ? <DefsElement /> : undefined}
                        <LayerElement
                            startKey={0}
                            endKey={1}
                            parentScale={d3.scaleLinear()}
                            scale={scale}
                            linkType={which}
                            isExpanded={false}
                            isInteractive={false}
                            isAnimating={true}
                        />
                    </svg>
                </div>
                <div style={{padding: '0 4px', width: '70px', flex: '0 0 70px'}}>
                    <Tag minimal={true} style={{marginLeft: '0'}}>
                        {endCount}
                    </Tag>
                </div>
            </div>
        );
    }

    private _renderPreview(
        vis: VisGenerator,
        boardName: string,
        which: string
    ): JSX.Element {
        let right = which === 'start' ? '0' : 'auto';
        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={{}}>
                    <Tag style={{position: 'absolute', zIndex: 10, right}}>
                        {boardName}
                    </Tag>
                    <img
                        className="preview-image"
                        src={vis.previewData}
                        style={{right}}
                    />
                    <img
                        className="decoration-image"
                        src={vis.decorationData}
                        style={{right}}
                    />
                </div>
            </div>
        );
    }
}

const COUNT_REDUCE = (c, e) => [c[0] + e.counts[0], c[1] + e.counts[1]];

const mapStateToProps = (state, ownProps) => {
    let innerWidth = getBrowserInnerWidth(state),
        svgWidth = innerWidth * 0.45 * 0.5 - 140;

    return {svgWidth};
};

const mapDispatchToProps = (dispatch) => {
    return {};
};

export default connect(mapStateToProps, mapDispatchToProps, null, {
    forwardRef: true,
})(LinkView);
