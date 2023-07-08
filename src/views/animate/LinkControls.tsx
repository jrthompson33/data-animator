import React from 'react';
import ReactDOM from 'react-dom';

import * as d3 from 'd3';
import {Button, Intent, Tag} from '@blueprintjs/core';
import CustomIcon from '../common/CustomIcon';

interface LinkControlsProps {
    selectedCount: number;
    disableBreak: boolean;
    disableCreate: boolean;
    onCreate: () => void;
    onBreak: () => void;
    onClear: () => void;
    onExit: () => void;
    show: boolean;
}

interface LinkControlsState {
}

export class LinkControls extends React.Component<LinkControlsProps,
    LinkControlsState> {
    constructor(props) {
        super(props);
    }

    public render() {
        let {selectedCount, disableBreak, disableCreate, show} = this.props;
        return (
            <div
                id="an-link-controls"
                className="row"
                style={{
                    display: show ? 'flex' : 'none',
                    marginTop: '4px',
                }}
            >
                <div className="col-md-4">
                    <div style={{marginLeft: '25px'}}>
                        <Tag
                            icon="tick"
                            minimal={true}
                            large={true}
                            intent={selectedCount > 0 ? Intent.PRIMARY : undefined}
                        >
                            {`${selectedCount} Selected`}
                        </Tag>
                        <Button
                            disabled={selectedCount === 0}
                            onClick={this.props.onClear}
                            style={{marginLeft: '12px', marginTop: '-8px'}}
                        >
                            Clear
                        </Button>
                    </div>
                </div>
                <div className="col-md-5">
                    <div style={{marginLeft: '12%'}}>
                        <Button
                            icon={CustomIcon.UNMATCH}
                            disabled={disableBreak}
                            onClick={this.props.onBreak}
                        >
                            Unmatch
                        </Button>
                        <Button
                            icon={CustomIcon.MATCH}
                            disabled={disableCreate}
                            style={{marginLeft: '12px'}}
                            onClick={this.props.onCreate}
                        >
                            Match
                        </Button>
                    </div>
                </div>
                <div className="col-md-3">
                    <div style={{float: 'right'}}>
                        <Button
                            intent={Intent.SUCCESS}
                            text="Done Matching"
                            icon="updated"
                            onClick={this.props.onExit}
                        />
                    </div>
                </div>
            </div>
        );
    }
}
