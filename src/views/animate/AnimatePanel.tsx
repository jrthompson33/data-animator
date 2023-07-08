import React from 'react';
import ReactDOM from 'react-dom';

import _ from 'underscore';

import LinkView from './LinkView';
import {TimelineControls} from './TimelineControls';
import AnimateCanvas from './AnimateCanvas';
import TimelineLayers from './TimelineLayers';
import TransitionLink from '../../animation/TransitionLink';
import {AnimationGenerator} from '../../animation/AnimationGenerator';
import {ILayerTreeNode} from './LayerTreeNode';
import store from '../../store';
import LinkCanvas, {IColumnOption, IValueOption} from './LinkCanvas';
import {LinkControls} from './LinkControls';
import {getDatasetById, getTransitionById} from '../../selectors';
import ILink from '../../core/ILink';

export class AnimatePanel extends React.Component<
    {
        show: boolean;
    },
    {
        playback;
        isRepeat;
        speed;
        transition: ILink;
        generator: AnimationGenerator;
        nodes: ILayerTreeNode[];
        selected: ILayerTreeNode[];
        linkMode: boolean;
        columnOptions: IColumnOption[];
        selectedColumn: IColumnOption;
        selectedValue: IValueOption;
        disableBreak: boolean;
        disableCreate: boolean;
    }
> {
    constructor(props) {
        super(props);
        this.state = {
            playback: 'pause',
            isRepeat: true,
            speed: 1.0,
            transition: undefined,
            generator: undefined,
            linkMode: false,
            nodes: [],
            selected: [],
            columnOptions: [],
            selectedValue: undefined,
            selectedColumn: undefined,
            disableBreak: false,
            disableCreate: false,
        };
    }

    protected _refs = {
        $canvas: React.createRef<any>(),
        $layers: React.createRef<any>(),
    };

    public setTransition(id: number) {
        let transition: ILink = getTransitionById(store.getState(), id),
            generator = transition.generator,
            nodes = generator.getLayerData();

        this.setState({
            transition,
            generator,
            nodes,
        });
    }

    public componentDidMount() {}

    public exitView() {
        this.setState({
            linkMode: false,
            playback: 'pause',
        });
        this._refs.$canvas.current.player.state = 'pause';
    }

    public render() {
        const playbackIcon = this.state.playback === 'play' ? 'pause' : 'play';
        return (
            <div
                className="bp3-tab-panel panel-content"
                role="tabpanel"
                aria-hidden={this.props.show}
            >
                <div id="an-left-panel">
                    <div id="an-timeline-view">
                        <div id="an-controls-container">
                            <TimelineControls
                                isRepeat={this.state.isRepeat}
                                onRepeat={this._handleRepeat}
                                onPlayback={this._handlePlayback}
                                onSpeed={this._handleSpeed}
                                onStep={this._handleStep}
                                playbackIcon={playbackIcon}
                                show={!this.state.linkMode}
                            />
                            <LinkControls
                                onBreak={this._handleBreakLink}
                                onClear={this._handleClearSelected}
                                onCreate={this._handleCreateLink}
                                onExit={() => this._handleLinkMode(false)}
                                selectedCount={this.state.selected.length}
                                disableBreak={this.state.disableBreak}
                                disableCreate={this.state.disableCreate}
                                show={this.state.linkMode}
                            />
                        </div>
                        <div id="an-timeline-container">
                            <TimelineLayers
                                transition={this.state.transition}
                                nodes={this.state.nodes}
                                ref={this._refs.$layers}
                                selected={this.state.selected}
                                onScrub={this._handleScrub}
                                onSelectionChange={this._handleSelectionChange}
                                linkMode={this.state.linkMode}
                            />
                        </div>
                        <div id="an-link-container">
                            <LinkView
                                linkMode={this.state.linkMode}
                                generator={this.state.generator}
                                transition={this.state.transition}
                                onLinkModeChange={this._handleLinkMode}
                            />
                        </div>
                    </div>
                </div>
                <div id="an-middle-panel">
                    <AnimateCanvas
                        generator={this.state.generator}
                        ref={this._refs.$canvas}
                        onTime={this._handleTime}
                        onPlayback={(playback) => this.setState({playback})}
                        show={!this.state.linkMode}
                    />
                    <LinkCanvas
                        transition={this.state.transition}
                        show={this.state.linkMode}
                        selected={this.state.selected}
                        columnOptions={this.state.columnOptions}
                        selectedColumn={this.state.selectedColumn}
                        selectedValue={this.state.selectedValue}
                        onSelectedColumnChange={(selectedColumn) =>
                            this.setState({selectedColumn})
                        }
                        onSelectedValueChange={(selectedValue) =>
                            this.setState({selectedValue})
                        }
                    />
                </div>
            </div>
        );
    }

    private _handleStep = (step: string) => {
        this.setState({playback: 'pause'});
        this._refs.$canvas.current.player.stepTo(step);
    };

    private _handleRepeat = (isRepeat: boolean) => {
        this._refs.$canvas.current.player.isRepeat = isRepeat;
        this.setState({isRepeat});
    };

    private _handlePlayback = (playback) => {
        this._refs.$canvas.current.player.state = playback;
        this.setState({playback});
    };

    private _handleSpeed = (speed: number) => {
        this._refs.$canvas.current.player.speed = speed;
        this.setState({speed});
    };

    private _handleTime = (time: number) => {
        this._refs.$layers.current.updateTime(time);
    };

    private _handleScrub = (time: number) => {
        this._refs.$canvas.current.player.scrubTo(time);
    };

    private _handleLinkMode = (linkMode: boolean) => {
        this.state.selected.forEach((n) => {
            n.isSelected = false;
        });
        this.setState({linkMode, selected: []});
    };

    private _handleSelectionChange = (node: ILayerTreeNode) => {
        // Only have one linked node at a time
        if (node.isSelected && node.linkType === 'linked') {
            this.state.selected.forEach((n) => {
                n.isSelected = false;
            });
        }
        this._updateLinkState();
    };

    private _handleCreateLink = () => {
        let en = _.filter(
                this.state.selected,
                (n) => n.linkType === 'enter' && n.type === 'object'
            )[0],
            ex = _.filter(
                this.state.selected,
                (n) => n.linkType === 'exit' && n.type === 'object'
            )[0];
        console.log(en, ex);
        // TODO link by what is selected
        this.state.generator.createLink(ex.map.start, en.map.end, ex.map.object, [
            'Row_ID',
        ]);
        let nodes = this.state.generator.getLayerData(),
            selected = [],
            columnOptions = [],
            selectedColumn = undefined,
            selectedValue = undefined,
            disableBreak = true,
            disableCreate = true;
        this.setState({
            nodes,
            selected,
            columnOptions,
            selectedColumn,
            selectedValue,
            disableBreak,
            disableCreate,
        });
        this._refs.$canvas.current.player.resetObjectsToRenderer();
    };

    private _handleBreakLink = () => {
        let node = _.filter(
            this.state.selected,
            (n) => n.linkType === 'linked' && n.type === 'object'
        )[0];
        this.state.generator.breakLink(node.id);
        let nodes = this.state.generator.getLayerData(),
            selected = [],
            columnOptions = [],
            selectedColumn = undefined,
            selectedValue = undefined,
            disableBreak = true,
            disableCreate = true;
        this.setState({
            nodes,
            selected,
            columnOptions,
            selectedColumn,
            selectedValue,
            disableBreak,
            disableCreate,
        });
        this._refs.$canvas.current.player.resetObjectsToRenderer();
    };

    private _handleClearSelected = () => {
        this.state.selected.forEach((n) => {
            n.isSelected = false;
        });
        this._updateLinkState();
    };

    private _updateLinkState = () => {
        let selected = _.filter(this.state.nodes, (n) => n.isSelected),
            columnOptions = this._getColumnOptions(selected),
            selectedColumn = columnOptions.length > 0 ? columnOptions[0] : undefined,
            selectedValue =
                columnOptions.length > 0 ? selectedColumn.values[0] : undefined,
            disableBreak = _.reduce(
                selected,
                (allLinks, n) => allLinks && n.linkType !== 'linked',
                true
            ),
            exits = _.filter(selected, (n) => n.linkType === 'exit'),
            enters = _.filter(selected, (n) => n.linkType === 'enter'),
            disableCreate = exits.length === 0 || enters.length === 0;

        this.setState({
            selected,
            columnOptions,
            selectedColumn,
            selectedValue,
            disableBreak,
            disableCreate,
        });
    };

    private _getColumnOptions = (selected: ILayerTreeNode[]): IColumnOption[] => {
        // TODO support for decorations
        let node = _.filter(
            selected,
            (n) => n.linkType === 'linked' && n.type === 'object'
        )[0];
        let columnOptions = [];
        if (node) {
            let startBoard = this.state.transition.startBoard,
                startTemplate = startBoard.generator.template,
                startScopeMap = startTemplate.dataScopeMap[node.map.start],
                datasetId = _.values(startScopeMap)[0].datasetId,
                dataset = getDatasetById(store.getState(), datasetId);
            columnOptions = dataset.summary
                .filter((s) => s.field === node.linkedBy[0])
                .map((s) => ({
                    name: s.field,
                    icon: s.type.toUpperCase(),
                    values: node.idList.map((ids) => {
                        return {
                            value: startScopeMap[ids.start[0]].tuples[0][s.field],
                            startIds: ids.start,
                            endIds: ids.end,
                        };
                    }),
                }));
        }
        return columnOptions;
    };
}
