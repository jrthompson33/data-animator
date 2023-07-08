import React from 'react';
import ReactDOM from 'react-dom';

import store from '../../store';

import * as d3 from 'd3';

import {getElementCounter} from '../../utils/counter';
import IBindingDecoration from './IBindingDecoration';
import IBinding from '../../data/bindings/IBinding';
import {EasingOption, EasingOptionList} from '../../animation/EasingOption';
import {getVisScaleById} from '../../selectors';

export default class ShapeAreaLegend implements IBindingDecoration {
    constructor(binding: IBinding, translate: number[]) {
        this.id = getElementCounter('Decoration');

        this.scaleId = binding.scaleId;
        this.title = binding.dataColumn;

        this.translate = translate;
    }
    public easing: EasingOption = EasingOptionList[0];
    public id: number;
    public properties: {start: any; end: any; default: any};

    public title: string;
    public scaleId;

    public translate: number[] = [0, 0];

    protected _visible: boolean = true;

    public initToSVG(svg: SVGGElement) {
        let g = d3
            .select(svg)
            .append('g')
            .attr('id', `decoration-${this.id}`)
            .attr('class', 'shape-area numerical');
        g.append('g')
            .attr('class', 'domain')
            .style('pointer-events', 'none')
            .attr('transform', 'translate(24,0)');
        g.append('g')
            .attr('class', 'decoration-label')
            .style('pointer-events', 'none')
            .append('text')
            .attr('y', -14)
            .attr('dy', '0.32em')
            .style('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('fill', DEFAULT_COLOR);
    }

    public setVisibleToSVG(svg: SVGSVGElement, visible: boolean) {
        d3.select(svg)
            .select(`#decoration-${this.id}`)
            .attr('display', visible ? 'inherit' : 'none');
        this._visible = visible;
    }

    public get visible() {
        return this._visible;
    }

    public renderStaticToSVG(svg: SVGGElement) {}

    public renderAnimationToSVG(svg: SVGGElement, startProperties: any, endProperties: any) {

    }

    public removeFromSVG(svg: SVGSVGElement) {
        d3.select(svg).select(`#decoration-${this.id}`).remove();
    }

    public setProgress(t: number) {
        // this.$animateCallback(this.easing.timeFunction(t));
    }

    public setEasingOption(easing: EasingOption) {
        this.easing = easing;
    }

    private _computeTicks(): any[] {
        let ret = [],
            scale = getVisScaleById(store.getState(), this.scaleId),
            range = scale.range(),
            domain = scale.domain(),
            ticks = scale.ticks(15),
            yScale = d3.scaleLinear().domain(domain).range([0, SIZE.H]);

        ret.push(domain[0]);
        return ret;
    }
}

const SIZE = {
    H: 80,
    HP: 6,
    HO: 12,
    WO: 60,
};

const DEFAULT_COLOR = '#878787';