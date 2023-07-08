import React from 'react';
import ReactDOM from 'react-dom';

import _ from 'underscore';

import {connect} from 'react-redux';

import TransitionLink from '../../animation/TransitionLink';
import PreviewCanvas from './PreviewCanvas';
import {Button, ButtonGroup} from '@blueprintjs/core';
import {AnimationGenerator} from '../../animation/AnimationGenerator';
import {getOrderedTransitionList} from '../../selectors';

export class PreviewPanel extends React.Component<
    {show: boolean; transitions: TransitionLink[]},
    {
        playback: string;
        time: number;
        boardIndex: number;
    }
> {
    constructor(props) {
        super(props);
        this.state = {
            playback: 'pause',
            boardIndex: 0,
            time: 0,
        };
    }

    protected _refs = {
        $canvas: React.createRef<PreviewCanvas>(),
    };

    public componentDidMount() {}

    public render() {
        // this.checkBoard();
        return (
            <div
                className="bp3-tab-panel panel-content"
                role="tabpanel"
                aria-hidden={this.props.show}
            >
                <div id="pv-top-panel">
                    <ButtonGroup>{this._maybeRenderBoardButtons()}</ButtonGroup>
                </div>
                <div id="pv-middle-panel">
                    <PreviewCanvas
                        ref={this._refs.$canvas}
                        onPlayback={(playback) => this.setState({playback})}
                        onTime={(time) => this.setState({time})}
                    />
                </div>
            </div>
        );
    }

    private checkBoard = () => {
        if (
            this._refs.$canvas.current &&
            this.props.transitions.length > 0 &&
            this.state.playback === 'pause' &&
            this.props.transitions[this.state.boardIndex].generator !==
                this._refs.$canvas.current.player.generator
        ) {
            this._refs.$canvas.current.pauseOnTransition(
                this.props.transitions[this.state.boardIndex]
            );
        }
    };

    private _maybeRenderBoardButtons = () => {
        let boardButtons = [];
        if (this.props.transitions && this.props.transitions.length > 0) {
            boardButtons.push(
                <Button
                    text="1"
                    onClick={() => this._handleBoardClick(0)}
                    active={this.state.boardIndex === 0}
                />
            );
            // TODO make sure to sort in the correct order
            this.props.transitions.forEach((t, i) => {
                boardButtons.push(
                    <Button
                        text={i + 2}
                        active={this.state.boardIndex === i + 1}
                        onClick={() => this._handleBoardClick(i + 1)}
                    />
                );
            });
        }
        return boardButtons;
    };

    private _handleBoardClick = (boardIndex: number) => {
        let active;
        if (this.state.boardIndex !== boardIndex) {
            if (this.state.boardIndex > boardIndex) {
                active = this.props.transitions[boardIndex];
                this._refs.$canvas.current.playTransition(active, true);
            } else {
                active = this.props.transitions[boardIndex - 1];
                this._refs.$canvas.current.playTransition(active, false);
            }
            this.setState({boardIndex});
        }
    };
}

const mapStateToProps = (state, ownProps) => {
    let transitions = getOrderedTransitionList(state);
    transitions.forEach((t) => {
        if (ownProps.transitions.indexOf(t) === -1) {
            ownProps.transitions.push(t);
        }
    });
    return ownProps;
};

export default connect(mapStateToProps)(PreviewPanel);
