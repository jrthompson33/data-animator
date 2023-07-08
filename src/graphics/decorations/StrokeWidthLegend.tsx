import React from 'react';
import ReactDOM from 'react-dom';

import * as d3 from 'd3';

import {getElementCounter} from '../../utils/counter';
import IBindingDecoration from './IBindingDecoration';
import {EasingOption, EasingOptionList} from '../../animation/EasingOption';
import {formatNumericalTick} from '../../data/data_utils';

export default class StrokeWidthLegend implements IBindingDecoration {
    constructor(properties: any) {
        this.id = getElementCounter('Decoration');
        this.properties.default = properties;
    }

    public id: number;
    public properties: {start: any; end: any; default: any} = {
        start: undefined,
        end: undefined,
        default: undefined,
    };
    public easing: EasingOption = EasingOptionList[0];
    protected $animateCallback: (t: number) => void = (t: number) => {};
    protected _visible: boolean = true;

    public initToSVG(svg: SVGGElement) {
        let g = d3
            .select(svg)
            .append('g')
            .attr('id', `decoration-${this.id}`)
            .attr('class', 'stroke-width-legend numerical');
        g.append('g').attr('class', 'domain').style('pointer-events', 'none');
        g.append('g')
            .attr('class', 'decoration-label')
            .style('pointer-events', 'none');
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

    public renderStaticToSVG(svg: SVGGElement, properties: any) {
        let {
            scale,
            position,
            title,
            yScale,
            ticks,
        } = this._getVariablesFromProperties(properties);

        let g = d3.select(svg).select(`#decoration-${this.id}`),
            domainG = g.select('.domain'),
            labelG = g.select('.decoration-label');

        let tick = domainG.selectAll('.tick').data(ticks, (d) => `${d}`),
            tickExit = tick.exit(),
            tickEnter = tick.enter().append('g').attr('class', 'tick'),
            path = tick.select('path'),
            text = tick.select('text');

        g.attr('transform', `translate(${position})`);

        tick = tick.merge(tickEnter);

        path = path.merge(
            tickEnter
                .append('path')
                .attr('d', `M${SIZE.W / -2},0h${SIZE.W}`)
                .style('stroke', DEFAULT_COLOR)
        );

        text = text.merge(
            tickEnter
                .append('text')
                .attr('x', SIZE.W / -2 - 4)
                .attr('dy', '0.31em')
                .style('text-anchor', 'end')
                .style('fill', DEFAULT_COLOR)
                .style('font-size', '10px')
        );

        tickExit.remove();

        tick.attr('transform', (d) => `translate(0,${yScale(d)})`);
        path.attr('stroke-width', (d) => scale(d));
        text.text(formatNumericalTick);

        labelG.select('text').text(title);

        labelG
            .selectAll('text')
            .data([null])
            .enter()
            .append('text')
            .attr('y', -8)
            .attr('dy', '0.31em')
            .style('font-size', '10px')
            .style('text-anchor', 'middle')
            .style('fill', DEFAULT_COLOR)
            .text(title);
    }

    public renderAnimationToSVG(
        svg: SVGGElement,
        startProperties: any,
        endProperties: any
    ) {
        // Render static first, if startProperties is not null
        if (startProperties) {
            this.renderStaticToSVG(svg, startProperties);
        }

        let {
            position,
            title,
            fadeIn,
            fadeOut,
            tickValues,
            labelValues,
            tickScale,
            yScale,
            start,
            end,
        } = this._getInterpolateProperties(startProperties, endProperties);

        if (!endProperties) {
            endProperties = startProperties;
        }

        let g = d3.select(svg).select(`#decoration-${this.id}`),
            domainG = g.select('.domain'),
            labelG = g.select('.decoration-label');

        g.attr('transform', `translate(${start.position})`);

        let tick = domainG.selectAll('.tick').data(tickValues, (d) => `${d}`),
            tickExit = tick.exit(),
            tickEnter = tick
                .enter()
                .append('g')
                .attr('class', 'tick')
                .attr('opacity', 0)
                .attr('transform', (d) => `translate(0,${start.yScale(d)})`),
            path = tick.select('path'),
            text = tick.select('text'),
            label = labelG.selectAll('text').data(labelValues),
            labelExit = label.exit(),
            labelEnter = label
                .enter()
                .append('text')
                .attr('y', -14)
                .attr('dy', '0.31em')
                .style('font-size', '10px')
                .style('text-anchor', 'middle')
                .style('fill', DEFAULT_COLOR)
                .text(title);

        tick = tick.merge(tickEnter);
        label = label.merge(labelEnter);

        path = path.merge(
            tickEnter
                .append('path')
                .attr('d', `M${SIZE.W / -2},0h${SIZE.W}`)
                .style('stroke', DEFAULT_COLOR)
        );

        text = text.merge(
            tickEnter
                .append('text')
                .attr('x', SIZE.W / -2 - 4)
                .attr('dy', '0.31em')
                .style('text-anchor', 'end')
                .style('fill', DEFAULT_COLOR)
                .style('font-size', '10px')
        );

        text.text(formatNumericalTick);

        let tickMerge = tick.merge(tickExit),
            pathMerge = tickMerge.select('path');

        this.$animateCallback = (t: number) => {
            if (
                start.position[0] !== end.position[0] ||
                start.position[1] !== end.position[1]
            ) {
                g.attr('transform', `translate(${position(t)})`);
            }

            let fo = fadeOut(t),
                fi = fadeIn(t);

            tickExit.attr('opacity', fo);
            labelExit.attr('opacity', fo);

            tickEnter.attr('opacity', fi);
            labelEnter.attr('opacity', fi);

            tickMerge.attr('transform', (d) => `translate(0,${yScale(d)(t)})`);
            path.attr('stroke-width', (d) => tickScale(d)(t));

            label.text(title(t));
        };
    }

    public removeFromSVG(svg: SVGSVGElement) {
        d3.select(svg).select(`#decoration-${this.id}`).remove();
    }

    public setProgress(t: number) {
        this.$animateCallback(this.easing.timeFunction(t));
    }

    public setEasingOption(easing: EasingOption) {
        this.easing = easing;
    }

    private _getInterpolateProperties(startProperties: any, endProperties: any) {
        let endExists = !!endProperties;
        if (!startProperties) {
            startProperties = endProperties;
        }
        if (!endProperties) {
            endProperties = startProperties;
        }

        let startVariables = this._getVariablesFromProperties(startProperties),
            endVariables = this._getVariablesFromProperties(endProperties);
        let swapInterpolate = (start, end) => (t) => (t < 0.5 ? start : end);
        return {
            position: d3.interpolate(startVariables.position, endVariables.position),
            title: swapInterpolate(startProperties.title, endProperties.title),
            fadeIn: d3.interpolate(1e-6, 1),
            fadeOut: d3.interpolate(1, 1e-6),
            start: startVariables,
            end: endVariables,
            tickValues: endExists ? endVariables.ticks : [],
            labelValues: endExists ? [null] : [],
            tickScale: (d) =>
                d3.interpolate(startVariables.scale(d), endVariables.scale(d)),
            yScale: (d) =>
                d3.interpolate(startVariables.yScale(d), endVariables.yScale(d)),
        };
    }

    private _getVariablesFromProperties(properties: any) {
        let scale = properties.scale,
            position = properties.translate,
            domain = scale.domain(),
            range = scale.range(),
            title = properties.title,
            yScale = d3.scaleLinear().domain(domain).range([0, SIZE.H]),
            ticks = this._computeTicks(scale, domain, range, yScale);
        return {
            scale,
            position,
            domain,
            range,
            title,
            yScale,
            ticks,
        };
    }

    private _computeTicks(
        scale: any,
        domain: any[],
        range: number[],
        yScale: any
    ): any[] {
        let ret = [],
            ticks = scale.ticks(15);
        ret.push(domain[0]);

        let currY = SIZE.HP + range[0] / 2;
        let maxY = SIZE.H - SIZE.HP - range[1] / 2;

        ticks.forEach((t) => {
            let y = yScale(t),
                h = scale(t) / 2;
            if (y - h > currY && y + h < maxY) {
                ret.push(t);
                currY = y + h + SIZE.HP;
            }
        });
        ret.push(domain[1]);

        return ret;
    }
}

const SIZE = {
    H: 80,
    W: 32,
    HP: 14,
    HO: 12,
    WO: 60,
    O: 42,
};

const DEFAULT_COLOR = '#878787';
