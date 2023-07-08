import React from 'react';
import ReactDOM from 'react-dom';
import {BoardActions} from './BoardActions';
import {TemplateList} from './TemplateList';
import StoryboardCanvas from './StoryboardCanvas';
import PropertiesView from './PropertiesView';
import DataView from './DataView';

export class StoryboardPanel extends React.Component<
    {
        show: boolean;
        showAnimation: (transitionId: number) => void;
    },
    {}
> {
    protected _refs = {
        boardActions: React.createRef<BoardActions>(),
    };

    public componentDidMount() {
        this._refs.boardActions.current.setDropContainer(
            document.getElementById('sb-middle-panel')
        );
    }

    public showVisUploader() {
        this._refs.boardActions.current.showVisUploader();
    }

    public render() {
        return (
            <div
                className="bp3-tab-panel panel-content"
                role="tabpanel"
                aria-hidden={this.props.show}
            >
                <div id="sb-left-panel">
                    <BoardActions ref={this._refs.boardActions} />
                    <PropertiesView
                        selected={null}
                        showAnimation={this.props.showAnimation}
                    />
                    <TemplateList templates={[]} />
                </div>
                <div id="sb-middle-panel">
                    <StoryboardCanvas boards={[]} links={[]} />
                </div>
                <div id="sb-bottom-panel">
                    <DataView data={{}} />
                </div>
            </div>
        );
    }
}
