import React from 'react';
import ReactDOM from 'react-dom';

import _ from 'underscore';

import * as d3 from 'd3';

import {getElementCounter} from '../../utils/counter';
import IBindingDecoration from './IBindingDecoration';
import {EasingOption, EasingOptionList} from '../../animation/EasingOption';
import {formatNumericalTick} from '../../data/data_utils';

export default class NumericalAxis implements IBindingDecoration {
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
            .attr('class', 'axis numerical');
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
            position,
            scale,
            range,
            range0,
            range1,
            k,
            o,
            spacing,
            textAnchor,
            dy,
            tickTransform,
            labelTransform,
        } = this._getVariablesFromProperties(properties);

        let g = d3.select(svg).select(`#decoration-${this.id}`),
            domainG = g.select('.domain'),
            labelG = g.select('.decoration-label');

        g.attr('transform', `translate(${position})`);

        domainG.attr(
            'transform',
            `translate(${OFFSETS.DOMAIN[properties.alignment]})`
        );

        let path = domainG.selectAll('.domain-path').data([null]),
            tick = domainG
                .selectAll('.tick')
                .data(
                    scale.ticks(Math.max(2, Math.min(8, Math.floor(range1 / 40)))),
                    scale
                )
                .order(),
            tickExit = tick.exit(),
            tickEnter = tick.enter().append('g').attr('class', 'tick'),
            line = tick.select('line'),
            text = tick.select('text');

        path = path.merge(
            path
                .enter()
                .insert('path', 'tick')
                .attr('class', 'domain-path')
                .style('stroke', DEFAULT_COLOR)
                .style('fill', 'none')
        );

        tick = tick.merge(tickEnter);

        line = line.merge(
            tickEnter
                .append('line')
                .attr(`${o}2`, k * TICK_SIZE.INNER)
                .style('stroke', DEFAULT_COLOR)
        );

        text = text.merge(
            tickEnter
                .append('text')
                .style('fill', DEFAULT_COLOR)
                .attr('text-anchor', textAnchor)
                .style('font-size', '10px')
                .attr(o, k * spacing)
                .attr('dy', dy)
        );

        tickExit.remove();

        path.attr(
            'd',
            o === 'x'
                ? `M${k * TICK_SIZE.OUTER},${range0 + 0.5}H0.5V${range1 + 0.5}H${
                      k * TICK_SIZE.OUTER
                  }`
                : `M${range0 + 0.5},${k * TICK_SIZE.OUTER}V0.5H${range1 + 0.5}V${
                      k * TICK_SIZE.OUTER
                  }`
        );

        tick.attr('transform', (d) => tickTransform(scale(d)));

        line.attr(`${o}2`, k * TICK_SIZE.INNER);

        text.attr(o, k * spacing).text((d) =>
            _.isNumber(d) ? formatNumericalTick(d as number) : scale.tickFormat()(d)
        );

        labelG.attr('transform', labelTransform);

        labelG
            .selectAll('text')
            .data([null])
            .enter()
            .append('text')
            .attr('dy', '0.31em')
            .style('font-size', '10px')
            .style('fill', DEFAULT_COLOR)
            .attr('text-anchor', 'start')
            .text(properties.title);
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
            alignment,
            range0,
            range1,
            o,
            k,
            title,
            dy,
            textAnchor,
            tickScale,
            fadeIn,
            fadeOut,
            tickValues,
            pathValues,
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

        let path = domainG.selectAll('.domain-path').data(pathValues),
            pathExit = path.exit(),
            pathEnter = path
                .enter()
                .insert('path', 'tick')
                .attr('class', 'domain-path')
                .style('stroke', DEFAULT_COLOR)
                .style('fill', 'none')
                .attr('opacity', 0)
                .attr(
                    'd',
                    start.o === 'x'
                        ? `M${start.k * TICK_SIZE.OUTER},${start.range0 + 0.5}H0.5V${
                              start.range1 + 0.5
                          }H${start.k * TICK_SIZE.OUTER}`
                        : `M${start.range0 + 0.5},${start.k * TICK_SIZE.OUTER}V0.5H${
                              start.range1 + 0.5
                          }V${start.k * TICK_SIZE.OUTER}`
                ),
            tick = domainG
                .selectAll('.tick')
                .data(tickValues, (d) => `${d}`)
                .order(),
            tickExit = tick.exit(),
            tickEnter = tick
                .enter()
                .append('g')
                .attr('class', 'tick')
                .attr('opacity', 0)
                .attr('transform', (d) => end.tickTransform(start.scale(d))),
            line = tick.select('line'),
            text = tick.select('text'),
            label = labelG.selectAll('text').data(pathValues),
            labelExit = label.exit(),
            labelEnter = label
                .enter()
                .append('text')
                .attr('dy', '0.3em')
                .style('font-size', '10px')
                .style('fill', DEFAULT_COLOR)
                .attr('text-anchor', 'start')
                .attr('opacity', 0);

        path = path.merge(pathEnter);
        tick = tick.merge(tickEnter);
        label = label.merge(labelEnter);

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
                .style('font-size', '10px')
                .attr(end.o, end.k * end.spacing)
                .attr('dy', end.dy)
        );

        text.text((d) =>
            _.isNumber(d)
                ? formatNumericalTick(d as number)
                : end.scale.tickFormat()(d)
        );

        labelG.attr('transform', end.labelTransform);

        // Find enter ticks, find exit ticks, find select ticks
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
            pathExit.attr('opacity', fo);
            labelExit.attr('opacity', fo);

            tickEnter.attr('opacity', fi);
            pathEnter.attr('opacity', fi);
            labelEnter.attr('opacity', fi);

            if (
                start.k !== end.k ||
                start.range0 !== end.range0 ||
                start.range1 !== end.range1
            ) {
                path.attr(
                    'd',
                    o(t) === 'x'
                        ? `M${k(t) * TICK_SIZE.OUTER},${range0(t) + 0.5}H0.5V${
                              range1(t) + 0.5
                          }H${k(t) * TICK_SIZE.OUTER}`
                        : `M${range0(t) + 0.5},${k(t) * TICK_SIZE.OUTER}V0.5H${
                              range1(t) + 0.5
                          }V${k(t) * TICK_SIZE.OUTER}`
                );
            }

            tick.attr('transform', (d) => end.tickTransform(tickScale(d)(t)));
            tickExit.attr('transform', (d) => end.tickTransform(tickScale(d)(t)));

            if (
                start.k !== end.k ||
                start.o !== end.o ||
                start.textAnchor !== end.textAnchor ||
                start.dy !== end.dy
            ) {
                line.attr(`${o(t)}2`, k(t) * TICK_SIZE.INNER);
                text.attr('text-anchor', textAnchor(t))
                    .attr(o(t), k(t) * end.spacing)
                    .attr('dy', dy(t));
            }

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

    private _getVariablesFromProperties(properties: any) {
        let position = this._computePosition(properties),
            scale = properties.scale,
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
                properties.alignment === 'right'
                    ? 'start'
                    : properties.alignment === 'left'
                    ? 'end'
                    : 'middle',
            dy =
                properties.alignment === 'top'
                    ? '0em'
                    : properties.alignment === 'bottom'
                    ? '0.71em'
                    : '0.32em',
            tickTransform =
                properties.orientation === 'x'
                    ? (n) => `translate(${n + 0.5}, 0)`
                    : (n) => `translate(0, ${n + 0.5})`,
            labelTransform = `${
                properties.orientation === 'x' ? '' : 'rotate(90)'
            }translate(${[2, 5]})`;
        return {
            position,
            scale,
            range,
            range0,
            range1,
            k,
            o,
            spacing,
            textAnchor,
            dy,
            tickTransform,
            labelTransform,
        };
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
            range0: d3.interpolate(startVariables.range0, endVariables.range0),
            range1: d3.interpolate(startVariables.range1, endVariables.range1),
            title: swapInterpolate(startProperties.title, endProperties.title),
            o: swapInterpolate(startVariables.o, endVariables.o),
            k: swapInterpolate(startVariables.k, endVariables.k),
            dy: d3.interpolate(startVariables.dy, endVariables.dy),
            fadeIn: d3.interpolate(1e-6, 1),
            fadeOut: d3.interpolate(1, 1e-6),
            textAnchor: swapInterpolate(
                startVariables.textAnchor,
                endVariables.textAnchor
            ),
            alignment: swapInterpolate(
                startProperties.alignment,
                endProperties.alignment
            ),
            start: startVariables,
            end: endVariables,
            pathValues: endExists ? [null] : [],
            tickValues: endExists
                ? endVariables.scale.ticks(
                      Math.max(2, Math.min(8, Math.floor(endVariables.range1 / 40)))
                  )
                : [],
            tickScale: (d) =>
                d3.interpolate(startVariables.scale(d), endVariables.scale(d)),
        };
    }

    private _computePosition(properties: any): number[] {
        let offset = OFFSETS.ALL[properties.alignment];
        return [
            offset[0] + properties.userTranslate[0] + properties.translate[0],
            offset[1] + properties.userTranslate[1] + properties.translate[1],
        ];
    }
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
