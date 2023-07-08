import React from 'react';
import ReactDOM from 'react-dom';

import {connect} from 'react-redux';

import _ from 'underscore';

import store from '../../store';

import {
    Navbar,
    Menu,
    MenuItem,
    Popover,
    Position,
    Button,
    Alignment,
    TabId,
    Callout,
    Label,
    Tag,
    HTMLSelect,
} from '@blueprintjs/core';
import CustomIcon from '../common/CustomIcon';
import {ItemRenderer, Select} from '@blueprintjs/select';
import TransitionLink from '../../animation/TransitionLink';
import IBoard from '../../core/IBoard';
import {
    getOrderedTransitionList,
    getSelectedBoardOnCanvas,
    getTransitionById,
} from '../../selectors';
import {changeBoardProperties} from '../../actions/action_creators';
import {ActionCreators} from 'redux-undo';

export interface MenuBarProps {
    modeTabId: TabId;
    onModeChange: (modeTabId: TabId) => void;
    onTransitionChange: (transitionId: number) => void;
    onImportVis: () => void;
    onSave: () => void;
    onOpen: () => void;
    onRemoveBoard: () => void;
    transitionId: number;
    selectedOnCanvas: IBoard;
    transitions: TransitionLink[];
    undoDisabled: boolean;
    redoDisabled: boolean;
    onRedo?: () => void;
    onUndo?: () => void;
}

const TransitionSelect = Select.ofType<TransitionLink>();

export class MenuBar extends React.Component<MenuBarProps, {}> {
    public render() {
        let swapGroup;
        switch (this.props.modeTabId) {
            case 'storyboard':
                swapGroup = (
                    <Navbar.Group align={Alignment.RIGHT}>
                        <Button
                            icon="desktop"
                            onClick={() => this.props.onModeChange('preview')}
                        >
                            Go to Preview
                        </Button>
                    </Navbar.Group>
                );
                break;
            case 'animate':
                let transition = getTransitionById(
                    store.getState(),
                    this.props.transitionId
                );
                let {boardNames} = transition;
                swapGroup = (
                    <Navbar.Group align={Alignment.CENTER}>
                        <Callout
                            style={{
                                height: '36px',
                                marginLeft: '30px',
                                padding: '0',
                            }}
                        >
                            <Navbar.Group style={{height: '100%'}}>
                                <Button
                                    icon="chevron-left"
                                    minimal={true}
                                    onClick={() =>
                                        this.props.onModeChange('storyboard')
                                    }
                                >
                                    Back to Storyboard
                                </Button>
                            </Navbar.Group>
                            <Navbar.Group
                                align={Alignment.RIGHT}
                                style={{height: '100%'}}
                            >
                                <Label
                                    className="bp3-inline"
                                    style={{margin: '0', lineHeight: '1em'}}
                                >
                                    Editing Transition:
                                </Label>
                                <TransitionSelect
                                    items={this.props.transitions}
                                    itemRenderer={renderTransitionItem}
                                    onItemSelect={this._handleTransitionSelect}
                                    activeItem={transition}
                                    filterable={false}
                                    popoverProps={{minimal: true}}
                                >
                                    <Button
                                        minimal={true}
                                        text={boardNames}
                                        rightIcon="double-caret-vertical"
                                        icon={CustomIcon.ANIMATE}
                                    />
                                </TransitionSelect>
                            </Navbar.Group>
                        </Callout>
                    </Navbar.Group>
                );
                break;
            case 'preview':
                swapGroup = (
                    <Navbar.Group align={Alignment.CENTER}>
                        <Callout
                            style={{
                                height: '36px',
                                marginLeft: '30px',
                                padding: '0',
                            }}
                        >
                            <Navbar.Group style={{height: '100%'}}>
                                <Button
                                    icon="chevron-left"
                                    minimal={true}
                                    onClick={() =>
                                        this.props.onModeChange('storyboard')
                                    }
                                >
                                    Back to Storyboard
                                </Button>
                            </Navbar.Group>
                        </Callout>
                    </Navbar.Group>
                );
                break;
        }
        return (
            <Navbar id="nav-bar">
                <Navbar.Group id="nav-heading">
                    <Navbar.Heading>Data Animator</Navbar.Heading>
                </Navbar.Group>
                <Navbar.Group>
                    <Popover
                        position={Position.BOTTOM_LEFT}
                        minimal={true}
                        content={
                            <Menu>
                                {/*<MenuItem*/}
                                {/*    icon="folder-open"*/}
                                {/*    text="Open Project"*/}
                                {/*    label="⌘O"*/}
                                {/*    disabled={true}*/}
                                {/*    onClick={this.props.onOpen}*/}
                                {/*/>*/}
                                {/*<MenuItem*/}
                                {/*    icon="floppy-disk"*/}
                                {/*    text="Save Project"*/}
                                {/*    label="⌘S"*/}
                                {/*    disabled={true}*/}
                                {/*    onClick={this.props.onSave}*/}
                                {/*/>*/}
                                {/*<MenuItem icon="export" text="Export" label="⇧⌘E" disabled={true}/>*/}
                                {/*<Menu.Divider />*/}
                                <MenuItem
                                    icon="import"
                                    text="Import Vis (*.diproj)"
                                    label="⌘I"
                                    onClick={this.props.onImportVis}
                                />
                            </Menu>
                        }
                    >
                        <Button className="bp3-minimal" text="File" />
                    </Popover>
                    <Navbar.Divider />
                    <Popover
                        position={Position.BOTTOM_LEFT}
                        minimal={true}
                        content={
                            <Menu>
                                {/*<MenuItem*/}
                                {/*    icon="undo"*/}
                                {/*    text="Undo"*/}
                                {/*    label="⌘Z"*/}
                                {/*    disabled={this.props.undoDisabled}*/}
                                {/*    onClick={this.props.onUndo}*/}
                                {/*/>*/}
                                {/*<MenuItem*/}
                                {/*    icon="redo"*/}
                                {/*    text="Redo"*/}
                                {/*    label="⇧⌘Z"*/}
                                {/*    disabled={this.props.redoDisabled}*/}
                                {/*    onClick={this.props.onRedo}*/}
                                {/*/>*/}
                                <Menu.Divider />
                                <MenuItem
                                    disabled={
                                        this.props.selectedOnCanvas === undefined ||
                                        this.props.modeTabId !== 'storyboard'
                                    }
                                    onClick={this.props.onRemoveBoard}
                                    icon="trash"
                                    text="Remove Board"
                                    label="⌫"
                                />
                            </Menu>
                        }
                    >
                        <Button className="bp3-minimal" text="Edit" />
                    </Popover>
                    <Navbar.Divider />
                    <Popover
                        position={Position.BOTTOM_LEFT}
                        minimal={true}
                        content={
                            <Menu>
                                <MenuItem icon="zoom-in" text="Zoom In" label="⌘=" />
                                <MenuItem
                                    icon="zoom-out"
                                    text="Zoom Out"
                                    label="⌘-"
                                />
                                {/*<Menu.Divider />*/}
                                {/*<MenuItem*/}
                                {/*    icon="flows"*/}
                                {/*    text="Go to Storyboard"*/}
                                {/*    active={this.props.modeTabId === 'storyboard'}*/}
                                {/*    onClick={() =>*/}
                                {/*        this.props.onModeChange('storyboard')*/}
                                {/*    }*/}
                                {/*/>*/}
                                {/*<MenuItem*/}
                                {/*    icon={CustomIcon.ANIMATE}*/}
                                {/*    text="Go to Timeline"*/}
                                {/*    active={this.props.modeTabId === 'animate'}*/}
                                {/*    onClick={() =>*/}
                                {/*        this.props.onModeChange('animate')*/}
                                {/*    }*/}
                                {/*/>*/}
                                {/*<MenuItem*/}
                                {/*    icon="desktop"*/}
                                {/*    text="Go to Preview"*/}
                                {/*    active={this.props.modeTabId === 'preview'}*/}
                                {/*    onClick={() =>*/}
                                {/*        this.props.onModeChange('preview')*/}
                                {/*    }*/}
                                {/*/>*/}
                            </Menu>
                        }
                    >
                        <Button className="bp3-minimal" text="View" />
                    </Popover>
                    <Navbar.Divider />
                    <Popover
                        position={Position.BOTTOM_LEFT}
                        minimal={true}
                        content={
                            <Menu>
                                <MenuItem text="Show Hotkeys" label="?" />
                                <MenuItem text="Tutorials" />
                                <MenuItem text="Message Board" />
                            </Menu>
                        }
                    >
                        <Button className="bp3-minimal" text="Help" />
                    </Popover>
                </Navbar.Group>
                {swapGroup}
            </Navbar>
        );
    }

    private _handleTransitionSelect = (transition) => {
        console.log(transition);
        this.props.onTransitionChange(transition.id);
    };
}

const renderTransitionItem: ItemRenderer<TransitionLink> = (
    transition: TransitionLink,
    {handleClick, modifiers, query}
) => {
    const text = transition.boardNames;
    return (
        <MenuItem
            text={text}
            disabled={modifiers.disabled}
            active={modifiers.active}
            key={transition.id}
            onClick={handleClick}
            icon={CustomIcon.ANIMATE}
        />
    );
};

const mapStateToProps = (state, ownProps) => {
    let selectedOnCanvas = getSelectedBoardOnCanvas(state),
        transitions = getOrderedTransitionList(state),
        undoDisabled = state.past.length === 0,
        redoDisabled = state.future.length === 0;
    return {transitions, selectedOnCanvas, undoDisabled, redoDisabled};
};

const mapDispatchToProps = (dispatch) => {
    return {
        onUndo: () => dispatch(ActionCreators.undo()),
        onRedo: () => dispatch(ActionCreators.redo()),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(MenuBar);
