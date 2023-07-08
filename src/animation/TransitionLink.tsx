import React from 'react';
import ReactDOM from 'react-dom';

import store from '../store';

import ILink from '../core/ILink';
import IBoard from '../core/IBoard';
import {AnimationGenerator} from './AnimationGenerator';
import {getElementCounter} from '../utils/counter';
import {getBoardById} from '../selectors';

export default class TransitionLink implements ILink {
    constructor(startBoardId: number, endBoardId: number) {
        this.startBoardId = startBoardId;
        this.endBoardId = endBoardId;

        this.id = getElementCounter(this.type);
        this.classId = `${this.type}-${this.id}`;
        this.name = `${this.type} ${this.id}`;
        this.boardNames = `${this.startBoard.name} → ${this.endBoard.name}`;
        this.isSelected = false;

        this.generator = new AnimationGenerator(
            this.startBoard.generator,
            this.endBoard.generator
        );
    }

    public type: string = 'Transition';
    public id: number;
    public classId: string;
    public name: string;
    public boardNames: string;
    public isSelected: boolean;

    public startBoardId: number;
    public endBoardId: number;

    public generator: AnimationGenerator;
    renderToListItem: () => any;

    public get startBoard(): IBoard {
        return getBoardById(store.getState(), this.startBoardId);
    }

    public get endBoard(): IBoard {
        return getBoardById(store.getState(), this.endBoardId);
    }

    public renderToCanvasItem() {
        const outP = this.startBoard.getConnectorLinkPosition('out');
        const inP = this.endBoard.getConnectorLinkPosition('in');
        const startP = {
            x: this.startBoard.position.x + outP.x,
            y: this.startBoard.position.y + outP.y,
        };
        const endP = {
            x: this.endBoard.position.x + inP.x,
            y: this.endBoard.position.y + inP.y,
        };
        const diffP = {x: endP.x - startP.x, y: endP.y - startP.y};
        let c0 = [diffP.x / 3, 0],
            c1 = [(diffP.x * 2) / 3, diffP.y],
            c = [diffP.x, diffP.y];

        return (
            <g
                className={`link-canvas transition-link-canvas ${
                    this.isSelected ? 'selected' : ''
                }`}
                key={this.classId}
                data-type="link"
                data-id={this.id}
                transform={`translate(${[startP.x, startP.y]})`}
            >
                <path
                    className="link-path"
                    data-type="link"
                    data-id={this.id}
                    d={`M 0,0 c ${c0} ${c1} ${c}`}
                />
            </g>
        );
    }
}
