import React, {RefObject} from 'react';
import _ from 'underscore';

import {getExtensionFromFileName} from '../../utils';

export interface FileUploaderProps {
    onFile: (file: File) => void;
    extensions: string[];
}

export interface FileUploaderState {
    fileName: string;
}

export default class FileUploader extends React.Component<
    FileUploaderProps,
    FileUploaderState
> {
    constructor(props) {
        super(props);
        this.state = {
            fileName: null,
        };
    }

    private _inputElement: HTMLInputElement;

    public bindClick(clickElement: HTMLElement) {
        clickElement.addEventListener('click', (e) => this.show());
    }

    public bindDrop(dragElement: HTMLElement) {
        console.log(dragElement);
        dragElement.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        dragElement.addEventListener('dragleave', (e) => {
            e.preventDefault();
        });
        dragElement.addEventListener('dragexit', (e) => {
            e.preventDefault();
        });
        dragElement.addEventListener('drop', (e) => {
            e.preventDefault();

            let files = this._getFilesFromDataTransfer(e.dataTransfer);
            if (files.length > 0 && this.props.onFile) {
                files.forEach((f) => this.props.onFile(f));
            }
        });
    }

    public render() {
        console.log(this.props);
        return (
            <input
                type="file"
                style={{display: 'none'}}
                accept={this.props.extensions.map((x) => '.' + x).join(',')}
                ref={(r) => (this._inputElement = r)}
                onChange={() => this.onInputChange()}
            />
        );
    }

    public show() {
        this._reset();
        this._inputElement.click();
    }

    public onInputChange() {
        let files = this._inputElement.files;
        if (this._inputElement.files.length === 1) {
            if (files.length > 0 && this.props.onFile) {
                for (let i = 0; i < files.length; i++) {
                    this.props.onFile(files.item(i));
                }
            }
        }
    }

    private _reset() {
        this._inputElement.value = null;
        this.setState({
            fileName: null,
        });
    }

    private _getFilesFromDataTransfer(transfer: DataTransfer): File[] {
        if (transfer && transfer.items.length > 0) {
            let files = _.filter(transfer.items, (i) => i.kind === 'file').map((i) =>
                i.getAsFile()
            );
            return _.filter(files, (f) => {
                let x = getExtensionFromFileName(f.name);
                return this.props.extensions.indexOf(x) > -1;
            });
        }
    }
}
