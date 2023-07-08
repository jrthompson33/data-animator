import React from 'react';
import ReactDOM from 'react-dom';

import * as d3 from 'd3';

import {getElementCounter} from '../../utils/counter';
import IBindingDecoration from './IBindingDecoration';
import {EasingOption, EasingOptionList} from '../../animation/EasingOption';

export default class CategoricalAxis implements IBindingDecoration {
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
            .attr('class', 'axis categorical');
        g.append('g').attr('class', 'domain').style('pointer-events', 'none');
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
            position,
            scale,
            domain,
            range,
            range0,
            range1,
            k,
            o,
            spacing,
            textAnchor,
            textTransform,
            tickTransform,
        } = this._getVariablesFromProperties(properties);

        let g = d3.select(svg).select(`#decoration-${this.id}`),
            domainG = g.select('.domain');

        g.attr('transform', `translate(${position})`);

        domainG.attr(
            'transform',
            `translate(${OFFSETS.DOMAIN[properties.alignment]})`
        );

        let tick = domainG.selectAll('.tick').data(domain, (d) => `${d}`),
            tickExit = tick.exit(),
            tickEnter = tick.enter().append('g').attr('class', 'tick'),
            line = tick.select('line'),
            text = tick.select('text');

        tick = tick.merge(tickEnter);

        line = line.merge(
            tickEnter
                .append('line')
                .style('stroke', DEFAULT_COLOR)
                .style('fill', 'none')
        );

        text = text.merge(
            tickEnter
                .append('text')
                .style('fill', DEFAULT_COLOR)
                .attr('text-anchor', textAnchor)
                .attr('transform', textTransform)
                .style('font-size', '10px')
                .attr('x', k * spacing)
                .attr('dy', '0.31em')
        );

        tickExit.remove();

        tick.attr('transform', (d) => tickTransform(scale(d)));

        line.attr(`${o}2`, k * TICK_SIZE.INNER);

        text.attr('x', k * spacing).text((d) => `${d}`);
    }

    public renderAnimationToSVG(
        svg: SVGGElement,
        startProperties: any,
        endProperties: any
    ) {
        if (startProperties) {
            this.renderStaticToSVG(svg, startProperties);
        }

        let {
            position,
            range0,
            range1,
            title,
            o,
            k,
            fadeIn,
            fadeOut,
            textAnchor,
            textTransform,
            tickScale,
            tickValues,
            alignment,
            start,
            end,
        } = this._getInterpolateProperties(startProperties, endProperties);

        if (!endProperties) {
            endProperties = startProperties;
        }

        let g = d3.select(svg).select(`#decoration-${this.id}`),
            domainG = g.select('.domain');

        g.attr('transform', `translate(${start.position})`);

        let tick = domainG.selectAll('.tick').data(tickValues, (d) => `${d}`),
            tickExit = tick.exit(),
            tickEnter = tick
                .enter()
                .append('g')
                .attr('class', 'tick')
                .attr('opacity', 0)
                .attr('transform', (d) => end.tickTransform(start.scale(d))),
            line = tick.select('line'),
            text = tick.select('text');

        tick = tick.merge(tickEnter);

        line = line.merge(
            tickEnter
                .append('line')
                .attr(`${end.o}2`, end.k * TICK_SIZE.INNER)
                .style('stroke', DEFAULT_COLOR)
                .style('fill', 'none')
        );

        text = text.merge(
            tickEnter
                .append('text')
                .style('fill', DEFAULT_COLOR)
                .attr('text-anchor', end.textAnchor)
                .attr('transform', end.textTransform)
                .style('font-size', '10px')
                .attr('x', end.k * end.spacing)
                .attr('dy', '0.31em')
        );

        text.text((d) => `${d}`);

        let tickMerge = tick.merge(tickExit);

        this.$animateCallback = (t: number) => {
            if (
                start.position[0] !== end.position[0] ||
                start.position[1] !== end.position[1]
            ) {
                g.attr('transform', `translate(${position(t)})`);
            }

            domainG.attr('transform', `translate(${OFFSETS.DOMAIN[alignment(t)]})`);

            let fo = fadeOut(t),
                fi = fadeIn(t);

            tickExit.attr('opacity', fo);
            tickEnter.attr('opacity', fi);

            tickMerge.attr('transform', (d) => end.tickTransform(tickScale(d)(t)));

            if (
                start.k !== end.k ||
                start.o !== end.o ||
                start.textAnchor !== end.textAnchor
            ) {
                line.attr(`${o(t)}2`, k(t) * TICK_SIZE.INNER);
                text.attr('x', k(t) * end.spacing).attr(
                    'text-anchor',
                    textAnchor(t)
                );
            }
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

    private _computePosition = (properties: any): number[] => {
        let offset = OFFSETS.ALL[properties.alignment];
        return [
            offset[0] + properties.userTranslate[0] + properties.translate[0],
            offset[1] + properties.userTranslate[1] + properties.translate[1],
        ];
    };

    private _getVariablesFromProperties = (properties: any): any => {
        let position = this._computePosition(properties),
            scale = properties.scale,
            domain = scale.domain(),
            range = scale.range(),
            range0 = +range[0],
            range1 = +range[range.length - 1],
            k =
                properties.alignment === 'top' || properties.alignment === 'left'
                    ? -1
                    : 1,
            o = properties.orientation === 'x' ? 'y' : 'x',
            spacing = TICK_SIZE.INNER + TICK_SIZE.PADDING,
            textAnchor =
                properties.alignment === 'right' || properties.alignment === 'bottom'
                    ? 'start'
                    : 'end',
            textTransform =
                properties.orientation === 'x' ? 'rotate(90)' : 'rotate(0)',
            tickTransform =
                properties.orientation === 'x'
                    ? (n) => `translate(${n + 0.5}, 0)`
                    : (n) => `translate(0, ${n + 0.5})`;

        return {
            position,
            scale,
            domain,
            range,
            range0,
            range1,
            k,
            o,
            spacing,
            textAnchor,
            textTransform,
            tickTransform,
        };
    };

    private _getInterpolateProperties = (
        startProperties: any,
        endProperties: any
    ): any => {
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
            range0: d3.interpolate(startVariables.range0, endVariables.range0),
            range1: d3.interpolate(startVariables.range1, endVariables.range1),
            title: swapInterpolate(startProperties.title, endProperties.title),
            o: swapInterpolate(startVariables.o, endVariables.o),
            k: swapInterpolate(startVariables.k, endVariables.k),
            fadeIn: d3.interpolate(1e-6, 1),
            fadeOut: d3.interpolate(1, 1e-6),
            textAnchor: swapInterpolate(
                startVariables.textAnchor,
                endVariables.textAnchor
            ),
            textTransform: swapInterpolate(
                startVariables.textTransform,
                endVariables.textTransform
            ),
            alignment: swapInterpolate(
                startProperties.alignment,
                endProperties.alignment
            ),
            start: startVariables,
            end: endVariables,
            tickValues: endExists ? endVariables.domain : [],
            tickScale: (d) =>
                d3.interpolate(startVariables.scale(d), endVariables.scale(d)),
        };
    };
}

const OFFSETS = {
    DOMAIN: {
        left: [-12, 0],
        bottom: [0, 12],
        top: [0, -12],
        right: [12, 0],
    },
    ALL: {
        left: [-10, 0],
        bottom: [0, 10],
        top: [0, -10],
        right: [10, 0],
    },
};

const TICK_SIZE = {
    OUTER: 6,
    INNER: 6,
    PADDING: 3,
};

const DEFAULT_COLOR = '#878787';
