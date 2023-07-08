import React from 'react';
import ReactDOM from 'react-dom';

import * as d3 from 'd3';

import {getElementCounter} from '../../utils/counter';
import IBindingDecoration from './IBindingDecoration';
import {EasingOption, EasingOptionList} from '../../animation/EasingOption';
import {formatNumericalTick} from '../../data/data_utils';

export default class NumericalColorLegend implements IBindingDecoration {
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
            .attr('class', 'color-legend numerical');
        g.append('g').attr('class', 'domain').style('pointer-events', 'none');
        g.append('defs')
            .append('linearGradient')
            .attr('id', `gradient-${this.id}`)
            .attr('x2', 0)
            .attr('y2', 1);
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
            title,
            domain,
            scale,
            offsetScale,
        } = this._getVariablesFromProperties(properties);

        let g = d3.select(svg).select(`#decoration-${this.id}`),
            gradient = g.select(`#gradient-${this.id}`),
            domainG = g.select('.domain'),
            labelG = g.select('.decoration-label');

        let palette = domainG
                .selectAll('.color-legend-palette')
                .data(domain, (d) => `${d}`),
            paletteExit = palette.exit(),
            paletteEnter = palette
                .enter()
                .append('g')
                .attr('class', 'color-legend-palette'),
            path = palette.select('path'),
            text = palette.select('text'),
            stop = gradient.selectAll('stop').data(domain, (d) => `${d}`),
            stopExit = stop.exit(),
            stopEnter = stop.enter().append('stop');

        palette = palette.merge(paletteEnter);
        stop = stop.merge(stopEnter);

        g.attr('transform', `translate(${position})`);

        path = path.merge(
            paletteEnter
                .append('path')
                .attr(
                    'd',
                    'M-14,0l0,0.5v0a0,0,0,0,0,0,0h6a0,0,0,0,0,0,0v-1a0,0,0,0,0,0,0h-6a0,0,0,0,0,0,0v0l0,0.5z'
                )
                .style('fill', DEFAULT_COLOR)
        );

        text = text.merge(
            paletteEnter
                .append('text')
                .attr('dy', '0.31em')
                .style('font-size', '8px')
                .style('fill', DEFAULT_COLOR)
                .attr('x', -6)
        );

        paletteExit.remove();

        palette.attr('transform', (d) => `translate(26,${offsetScale(+d)})`);
        text.text(formatNumericalTick);
        stop.attr('offset', (d) => `${offsetScale(+d)}%`).attr('stop-color', (d) =>
            scale(d)
        );

        labelG.select('text').text(title);

        labelG
            .selectAll('text')
            .data([null])
            .enter()
            .append('text')
            .attr('y', -14)
            .attr('dy', '0.31em')
            .style('font-size', '10px')
            .style('fill', DEFAULT_COLOR)
            .text(title);

        domainG
            .selectAll('rect')
            .data([null])
            .enter()
            .append('rect')
            .style('fill', `url(#gradient-${this.id}`)
            .attr('height', 100)
            .attr('width', 8)
            .style('stroke-width', '1px')
            .style('stroke', DEFAULT_COLOR);
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
            start,
            end,
            paletteValues,
            labelValues,
            offsetScale,
            scale,
        } = this._getInterpolateProperties(startProperties, endProperties);

        if (!endProperties) {
            endProperties = startProperties;
        }

        let g = d3.select(svg).select(`#decoration-${this.id}`),
            gradient = g.select(`#gradient-${this.id}`),
            domainG = g.select('.domain'),
            labelG = g.select('.decoration-label');

        g.attr('transform', `translate(${start.position})`);

        let palette = domainG
                .selectAll('.color-legend-palette')
                .data(paletteValues, (d) => `${d}`),
            paletteExit = palette.exit(),
            paletteEnter = palette
                .enter()
                .append('g')
                .attr('class', 'color-legend-palette')
                .attr('opacity', 0),
            path = palette.select('path'),
            text = palette.select('text'),
            stop = gradient.selectAll('stop').data(paletteValues, (d) => `${d}`),
            stopExit = stop.exit(),
            stopEnter = stop
                .enter()
                .append('stop')
                .attr('stop-color', (d) => start.scale(d)),
            label = labelG.selectAll('text').data(labelValues),
            labelExit = label.exit(),
            labelEnter = label
                .enter()
                .append('text')
                .attr('y', -14)
                .attr('dy', '0.31em')
                .style('font-size', '10px')
                .style('fill', DEFAULT_COLOR)
                .attr('opacity', 0),
            rect = domainG.selectAll('rect').data(labelValues),
            rectExit = rect.exit(),
            rectEnter = rect
                .enter()
                .append('rect')
                .style('fill', `url(#gradient-${this.id}`)
                .attr('height', 100)
                .attr('width', 8)
                .style('stroke-width', '1px')
                .style('stroke', DEFAULT_COLOR)
                .attr('opacity', 0);

        palette = palette.merge(paletteEnter);
        label = label.merge(labelEnter);
        rect = rect.merge(rectEnter);
        stop = stop.merge(stopEnter);

        path = path.merge(
            paletteEnter
                .append('path')
                .attr(
                    'd',
                    'M-14,0l0,0.5v0a0,0,0,0,0,0,0h6a0,0,0,0,0,0,0v-1a0,0,0,0,0,0,0h-6a0,0,0,0,0,0,0v0l0,0.5z'
                )
                .style('fill', DEFAULT_COLOR)
        );

        text = text.merge(
            paletteEnter
                .append('text')
                .attr('dy', '0.31em')
                .style('font-size', '8px')
                .style('fill', DEFAULT_COLOR)
                .attr('x', -6)
        );

        text.text(formatNumericalTick);

        // @ts-ignore
        let paletteMerge = palette.merge(paletteExit),
            stopMerge = stop.merge(stopExit);

        this.$animateCallback = (t: number) => {
            if (
                start.position[0] !== end.position[0] ||
                start.position[1] !== end.position[1]
            ) {
                g.attr('transform', `translate(${position(t)})`);
            }

            let fo = fadeOut(t),
                fi = fadeIn(t);

            paletteExit.attr('opacity', fo);
            labelExit.attr('opacity', fo);
            rectExit.attr('opacity', fo);

            paletteEnter.attr('opacity', fi);
            labelEnter.attr('opacity', fi);
            rectEnter.attr('opacity', fi);

            paletteMerge.attr(
                'transform',
                (d) => `translate(26,${offsetScale(d)(t)})`
            );
            stopMerge
                .attr('offset', (d) => `${offsetScale(d)(t)}%`)
                .attr('stop-color', (d) => scale(d)(t));

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
            paletteValues: endExists ? endVariables.domain : [],
            labelValues: endExists ? [null] : [],
            offsetScale: (d) =>
                d3.interpolate(
                    startVariables.offsetScale(d),
                    endVariables.offsetScale(d)
                ),
            scale: (d) =>
                d3.interpolate(startVariables.scale(d), endVariables.scale(d)),
        };
    }

    private _getVariablesFromProperties(properties: any) {
        let scale = properties.scale,
            position = properties.translate,
            domain = scale.domain(),
            range = scale.range(),
            title = properties.title,
            ids = properties.ids,
            offsetScale = d3
                .scaleLinear()
                .domain([domain[domain.length - 1], domain[0]])
                .range([98, 2]);
        return {
            scale,
            position,
            domain,
            range,
            title,
            ids,
            offsetScale,
        };
    }
}

const DEFAULT_COLOR = '#878787';

interface IPaletteData {
    rangeValue: string;
    domainFormatted: string;
    domainValue: number;
}

const SIZE = {
    HP: 20,
    WP: 10,
    HO: 12,
    WO: 60,
};
