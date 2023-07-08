import React, {RefObject} from 'react';
import ReactDOM from 'react-dom';

import {loadVisFile} from '../../core/file_utils';

import {Button} from '@blueprintjs/core';
import FileUploader from '../common/FileUploader';

export class BoardActions extends React.Component<{}, {}> {
    private _visUploader: RefObject<FileUploader> = React.createRef();

    constructor(props) {
        super(props);
    }

    public setDropContainer(element) {
        this._visUploader.current.bindDrop(element);
    }

    public setClickElement(element) {
        this._visUploader.current.bindClick(element);
    }

    public showVisUploader() {
        this._visUploader.current.show();
    }

    public render() {
        return (
            <div>
                <div className="sb-container">
                    <div className="sb-action-btns row">
                        <div className="col-md-12">
                            <FileUploader
                                onFile={(file) => loadVisFile(file)}
                                extensions={['diproj']}
                                ref={this._visUploader}
                            />
                            <Button
                                text="Import Vis (*.diproj)"
                                icon="import"
                                elementRef={(e) => {
                                    this._visUploader.current.bindClick(e);
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
