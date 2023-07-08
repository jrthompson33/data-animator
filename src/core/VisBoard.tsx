import React from 'react';
import ReactDOM from 'react-dom';

import {connect} from 'react-redux';

import {VisGenerator} from './VisGenerator';
import IRenderable from '../graphics/IRenderable';
import IBoard from './IBoard';
import IObject from 'graphics/objects/IObject';
import {getElementCounter} from '../utils/counter';
import {Spinner} from '@blueprintjs/core';
import {computeConnectorAlignments} from './board_utils';

export default class VisBoard implements IBoard, IRenderable {
    constructor(generator: VisGenerator) {
        this.id = getElementCounter(this.type);
        this.classId = `${this.type}-${this.id}`;
        this.name = `${this.type} ${this.id}`;

        this.generator = generator;
    }

    public type: string = 'Board';
    public id: number;
    public classId: string;
    public name: string;
    public generator: VisGenerator;
    public objects: IObject[];
    public links = {in: undefined, out: undefined};
    public connectorAlignment: {
        in: 'top' | 'right' | 'bottom' | 'left';
        out: 'top' | 'right' | 'bottom' | 'left';
    } = {in: 'left', out: 'right'};
    public dimension = {w: 240, h: 192};
    public position = {x: 20, y: 20};
    public previewData: any;
    public decorationData: any;
    public selected: boolean = false;
    public previewLoading: boolean = true;
    public renderToListItem: () => any;

    // Need alignments for links out and in - what happens if on the same side?

    public updateObjects() {}

    public intersects(other: IBoard) {
        if (
            this.position.x >= other.position.x + other.dimension.w ||
            other.position.x >= this.position.x + this.dimension.w
        ) {
            return false;
        }

        return !(
            this.position.y >= other.position.y + other.dimension.h ||
            other.position.y >= this.position.y + this.dimension.h
        );
    }

    public getConnectorTransform(inOut: string): string {
        let other = inOut === 'in' ? 'out' : 'in',
            sameSide =
                this.connectorAlignment[inOut] === this.connectorAlignment[other],
            sameOffset = sameSide ? (inOut === 'out' ? 20 : -20) : 0;
        switch (this.connectorAlignment[inOut]) {
            case 'top':
                return `translate(${[this.dimension.w / 2 + sameOffset, 0]})rotate(${
                    inOut === 'in' ? 90 : 270
                })`;
            case 'left':
                return `translate(${[0, this.dimension.h / 2 + sameOffset]})rotate(${
                    inOut === 'in' ? 0 : 180
                })`;
            case 'bottom':
                return `translate(${[
                    this.dimension.w / 2 + sameOffset,
                    this.dimension.h,
                ]})rotate(${inOut === 'in' ? 270 : 90})`;
            case 'right':
                return `translate(${[
                    this.dimension.w,
                    this.dimension.h / 2 + sameOffset,
                ]})rotate(${inOut === 'in' ? 180 : 0})`;
        }
    }

    public getConnectorLinkPosition(inOut: string) {
        let other = inOut === 'in' ? 'out' : 'in',
            sameSide =
                this.connectorAlignment[inOut] === this.connectorAlignment[other],
            sameOffset = sameSide ? (inOut === 'out' ? 20 : -20) : 0;
        switch (this.connectorAlignment[inOut]) {
            case 'top':
                return {x: this.dimension.w / 2 + sameOffset, y: -9};
            case 'left':
                return {x: -9, y: this.dimension.h / 2 + sameOffset};
            case 'bottom':
                return {
                    x: this.dimension.w / 2 + sameOffset,
                    y: this.dimension.h + 9,
                };
            case 'right':
                return {
                    x: this.dimension.w + 9,
                    y: this.dimension.h / 2 + sameOffset,
                };
        }
    }

    public renderToCanvasItem() {
        this.connectorAlignment = computeConnectorAlignments(this);
        const inTransform = this.getConnectorTransform('in'),
            outTransform = this.getConnectorTransform('out'),
            inSelected = this.links.in && this.links.in.isSelected ? 'selected' : '',
            outSelected =
                this.links.out && this.links.out.isSelected ? 'selected' : '';
        const connectorIn = (
            <g
                className={`connector-in connector ${inSelected}`}
                data-type="connector"
                data-id={this.id}
                data-subtype="in"
                transform={inTransform}
            >
                <path
                    data-type="connector"
                    data-id={this.id}
                    data-subtype="in"
                    className="arrow-bg"
                    transform="rotate(180)"
                    d={CONNECTOR_BG}
                />
                <path
                    data-type="connector"
                    data-id={this.id}
                    data-subtype="in"
                    className="arrow-chevron"
                    transform="translate(-16.5, 0)"
                    d={CONNECTOR_ARROW}
                />
            </g>
        );
        const connectorBookmark = (
            <g
                className="connector-bookmark connector"
                data-type="connector"
                data-id={this.id}
                data-subtype="bookmark"
                transform="translate(0,0)"
            >
                <path className="arrow-bg" d={VIEW_BG} />
                <path
                    style={{fill: '#fff'}}
                    d={VIEW_ICON}
                    transform="translate(-16.25, 6)"
                />
                <text
                    className="bookmark-id"
                    dy="0.3em"
                    transform="translate(-9.25, 32)"
                >
                    1
                </text>
            </g>
        );
        const imageOrSpinner = this.previewLoading ? (
            <g
                transform={`translate(${this.dimension.w / 2},
                            ${this.dimension.h / 2})`}
            >
                <Spinner size={Spinner.SIZE_STANDARD} tagName="g" />
            </g>
        ) : (
            <g>
                <image
                    className="preview-image"
                    data-type="board"
                    data-id={this.id}
                    width={this.dimension.w}
                    height={this.dimension.h}
                    xlinkHref={this.previewData}
                />
                <image
                    className="preview-image"
                    data-type="board"
                    data-id={this.id}
                    width={this.dimension.w}
                    height={this.dimension.h}
                    xlinkHref={this.decorationData}
                />
            </g>
        );
        return (
            <g
                className={`board-canvas vis-board-canvas${
                    this.selected ? ' selected' : ''
                }`}
                key={this.classId}
                data-type="board"
                data-id={this.id}
                transform={`translate(${[this.position.x, this.position.y]})`}
            >
                <rect
                    className="bg"
                    data-type="board"
                    data-id={this.id}
                    width={this.dimension.w + 1}
                    height={this.dimension.h + 1}
                    x={-0.5}
                    y={-0.5}
                />
                <text className="name" x={10} dy="-0.7em">
                    {this.name}
                </text>
                {imageOrSpinner}
                {this.links.in === undefined ? '' : connectorIn}
                <g
                    className={`connector-out connector ${outSelected}`}
                    data-type="connector"
                    data-id={this.id}
                    data-subtype="out"
                    transform={outTransform}
                >
                    <path
                        className="arrow-bg"
                        data-type="connector"
                        data-id={this.id}
                        data-subtype="out"
                        d={CONNECTOR_BG}
                    />
                    <path
                        className="arrow-chevron"
                        data-type="connector"
                        data-id={this.id}
                        data-subtype="out"
                        d={CONNECTOR_ARROW}
                    />
                </g>
                {/*{this.links.in !== undefined ? '' : connectorBookmark}*/}
                <rect
                    className="hover-frame"
                    data-type="board"
                    data-id={this.id}
                    width={this.dimension.w + 1}
                    height={this.dimension.h + 1}
                    x={-0.5}
                    y={-0.5}
                />
            </g>
        );
    }
}

const VIEW_BG = 'M -18.5,-0.5 v 34 q 0,8 8,8 h 10 v -42 z';
const VIEW_ICON =
    'M11.2.01h-.15C11.03.01 11.02 0 11 0H5c-.02 0-.03.01-.05.01H4.8c-.44 0-.8.37-.8.82v14.75c0 .45.25.56.57.24l2.87-2.94c.31-.32.82-.32 1.13 0l2.87 2.94c.31.32.57.21.57-.24V.83C12 .38 11.64.01 11.2.01z';
const CONNECTOR_BG = 'M 0.5,-12 h 12 q 6,0 6,6 v12 q 0,6 -6, 6 h -12 z';
const CONNECTOR_ARROW = 'M 7,-4.3 l 3.5,4.3 l -3.5,4.3';
