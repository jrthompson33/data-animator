import React, {ChangeEvent, FormEvent} from 'react';
import ReactDOM from 'react-dom';

import _ from 'underscore';

import store from '../../store';

import {
    Button,
    HTMLSelect,
    Label,
    NumericInput,
    Radio,
    RadioGroup,
    Slider,
} from '@blueprintjs/core';
import TransitionLink from '../../animation/TransitionLink';
import CustomIcon from '../common/CustomIcon';
import {Tag} from '@blueprintjs/core/lib/esnext';
import {changeLinkProperties, removeLink} from '../../actions/action_creators';
import {getBoardList} from '../../selectors';
import {createTransitionLink} from '../../core/board_utils';

interface TransitionPropertiesViewProps {
    type: 'in' | 'out';
    transition?: TransitionLink;
    showAnimationById: (transitionId: number) => void;
}

interface TransitionPropertiesViewState {}

export class TransitionPropertiesView extends React.Component<
    TransitionPropertiesViewProps,
    TransitionPropertiesViewState
> {
    constructor(props) {
        super(props);
    }

    public render() {
        if (this.props.transition) {
            const {transition, type} = this.props,
                {generator} = transition,
                {duration, transitionType} = generator,
                displayPresetSelect = transitionType === 'auto' ? 'none' : 'block',
                selectedBoard =
                    type === 'in' ? transition.startBoardId : transition.endBoardId,
                thisBoard =
                    type === 'in' ? transition.endBoardId : transition.startBoardId,
                navigateText =
                    this.props.type === 'in' ? 'Navigate from' : 'Navigate to';
            const boardList = getBoardList(store.getState()).filter(
                    (b) => b.id !== thisBoard
                ),
                boardOptions = boardList.map((b) => {
                    return <option value={b.id}>{b.name}</option>;
                });
            return (
                <div
                    className="sb-container sb-transition-container"
                    onMouseEnter={(e) => this._handleSelectLink(true)}
                    onMouseLeave={(e) => this._handleSelectLink(false)}
                >
                    <div className="row">
                        <span className="panel-label">
                            Transition {this.props.type}
                        </span>
                        <Button
                            outlined={true}
                            minimal={true}
                            small={true}
                            style={{marginLeft: 'auto'}}
                            onClick={this._handleRemoveLink}
                        >
                            Remove
                        </Button>
                    </div>
                    <div className="row">
                        <div className="col-md-6" style={{paddingRight: '14px'}}>
                            <Label>
                                {navigateText}
                                <HTMLSelect
                                    minimal={true}
                                    value={selectedBoard}
                                    onChange={this._handleBoardChange}
                                >
                                    <option value="-1">Choose a board...</option>
                                    {boardOptions}
                                </HTMLSelect>
                            </Label>
                        </div>
                        <div className="col-md-6">
                            <Label>
                                Duration
                                <div>
                                    <NumericInput
                                        style={{width: '60px', padding: '0 0 0 6px'}}
                                        max={120}
                                        min={0}
                                        majorStepSize={1}
                                        stepSize={0.1}
                                        minorStepSize={0.01}
                                        selectAllOnFocus={true}
                                        buttonPosition="none"
                                        onValueChange={this._handleDurationChange}
                                        rightElement={<Tag minimal={true}>s</Tag>}
                                        value={duration / 1e3}
                                    />
                                    <div style={{display: 'inline-block'}}>
                                        <Slider
                                            stepSize={0.1}
                                            value={duration / 1e3}
                                            max={5}
                                            min={0}
                                            onChange={this._handleDurationChange}
                                            labelRenderer={false}
                                        />
                                    </div>
                                </div>
                            </Label>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-6" style={{paddingRight: '14px'}}>
                            <Label>
                                Type
                                <RadioGroup
                                    onChange={this._handleTypeChange}
                                    inline={true}
                                    disabled={true}
                                    selectedValue={transitionType}
                                >
                                    <Radio label="Auto-Animate" value="auto" />
                                    <Radio label="Preset" value="preset" />
                                </RadioGroup>
                                <div style={{display: displayPresetSelect}}>
                                    <HTMLSelect minimal={true}>
                                        <option value="1">Fade In/Out</option>
                                        <option value="2">Wipe In/Out</option>
                                        <option value="3">Scale In/Out</option>
                                    </HTMLSelect>
                                </div>
                            </Label>
                        </div>
                        <div className="col-md-6" style={{marginTop: 'auto'}}>
                            <Button
                                minimal={true}
                                className="bp3-filled"
                                icon={CustomIcon.ANIMATE}
                                small={true}
                                style={{
                                    marginBottom: '6px',
                                    float: 'right',
                                    width: '100%',
                                }}
                                onClick={() =>
                                    this.props.showAnimationById(
                                        this.props.transition.id
                                    )
                                }
                            >
                                Edit Timeline
                            </Button>
                        </div>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="sb-container sb-transition-container">
                    <span className="panel-label">Transition {this.props.type}</span>
                </div>
            );
        }
    }

    private _handleTypeChange = (event: FormEvent<HTMLInputElement>): void => {
        this.props.transition.generator.transitionType = event.currentTarget.value;
    };

    private _handleBoardChange = (event: ChangeEvent<HTMLSelectElement>): void => {
        const start =
                this.props.type === 'in'
                    ? parseInt(event.currentTarget.value)
                    : this.props.transition.startBoardId,
            end =
                this.props.type === 'in'
                    ? this.props.transition.endBoardId
                    : parseInt(event.currentTarget.value);
        let action = removeLink(this.props.transition);
        store.dispatch(action);
        event.preventDefault();
        createTransitionLink(start, end);
        console.log(event.currentTarget.value);
    };

    private _handleDurationChange = (value): void => {
        this.props.transition.generator.duration = Math.round(value * 1e3);
        this.setState({});
    };

    private _handleSelectLink = (isSelected: boolean): void => {
        let action = changeLinkProperties(this.props.transition.id, {isSelected});
        store.dispatch(action);
    };

    private _handleRemoveLink = (): void => {
        let action = removeLink(this.props.transition);
        store.dispatch(action);
    };
}
