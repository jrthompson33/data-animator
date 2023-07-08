import React from 'react';
import ReactDOM from 'react-dom';

import _ from 'underscore';

import {connect} from 'react-redux';
import IBoard from '../../core/IBoard';
import {TransitionPropertiesView} from './TransitionPropertiesView';
import TransitionLink from '../../animation/TransitionLink';
import {getBoardList, getSelectedBoardOnCanvas} from '../../selectors';

interface PropertiesViewProps {
    selected: IBoard;
    transitionIn: TransitionLink;
    transitionOut: TransitionLink;
    showAnimation: (transitionId: number) => void;
}

export class PropertiesView extends React.Component<PropertiesViewProps, {}> {
    constructor(props) {
        super(props);
    }

    public render() {
        let {transitionIn, transitionOut} = this.props;
        return (
            <div id="sb-props-container">
                <TransitionPropertiesView
                    type="in"
                    transition={transitionIn}
                    showAnimationById={this.props.showAnimation}
                />
                <TransitionPropertiesView
                    type="out"
                    transition={transitionOut}
                    showAnimationById={this.props.showAnimation}
                />
            </div>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    let selected = getSelectedBoardOnCanvas(state),
        transitionIn = selected ? selected.links.in : undefined,
        transitionOut = selected ? selected.links.out : undefined;
    return {selected, transitionIn, transitionOut};
};

const mapDispatchToProps = (dispatch) => {
    return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(PropertiesView);
