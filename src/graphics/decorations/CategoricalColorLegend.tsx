import React from 'react';
import ReactDOM from 'react-dom';

import * as d3 from 'd3';

import {getElementCounter} from '../../utils/counter';
import IBindingDecoration from './IBindingDecoration';
import {EasingOption, EasingOptionList} from '../../animation/EasingOption';

export default class CategoricalColorLegend implements IBindingDecoration {
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
            .attr('class', 'color-legend categorical');
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
        let {position, scale, palettes, title} = this._getVariablesFromProperties(
            properties
        );

        let g = d3.select(svg).select(`#decoration-${this.id}`),
            domainG = g.select('.domain'),
            labelG = g.select('.decoration-label');

        let palette = domainG
                .selectAll('.color-legend-palette')
                .data(palettes, (d) => `${d['domainValue']}`),
            paletteExit = palette.exit(),
            paletteEnter = palette
                .enter()
                .append('g')
                .attr('class', 'color-legend-palette'),
            rect = palette.select('rect'),
            text = palette.select('text');

        g.attr('transform', `translate(${position})`);

        palette = palette.merge(paletteEnter);

        rect = rect.merge(
            paletteEnter
                .append('rect')
                .attr('height', SIZE.H)
                .attr('width', SIZE.W)
                .attr('stroke', DEFAULT_COLOR)
        );

        text = text.merge(
            paletteEnter
                .append('text')
                .attr('dy', '0.3em')
                .style('font-size', '10px')
                .style('fill', DEFAULT_COLOR)
                .attr('x', SIZE.W + 4)
                .attr('y', SIZE.H / 2)
        );

        paletteExit.remove();

        palette.attr('transform', (d) => `translate(${[d.x, d.y]})`);

        rect.attr('fill', (d) => d.rangeValue);

        text.text((d, i) => {
            return d.domainValue.length > 10 && palettes.length > i + 6
                ? `${d.domainValue.substring(0, 10)}...`
                : d.domainValue;
        });

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
            .attr('text-anchor', 'start')
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
            start,
            end,
            paletteValues,
            labelValues,
        } = this._getInterpolateProperties(startProperties, endProperties);

        if (!endProperties) {
            endProperties = startProperties;
        }

        let g = d3.select(svg).select(`#decoration-${this.id}`),
            domainG = g.select('.domain'),
            labelG = g.select('.decoration-label');

        g.attr('transform', `translate(${start.position})`);

        let palette = domainG
                .selectAll('.color-legend-palette')
                .data(paletteValues, (d) => `${d['domainValue']}`),
            paletteExit = palette.exit(),
            paletteEnter = palette
                .enter()
                .append('g')
                .attr('class', 'color-legend-palette')
                .attr('opacity', 0),
            rect = palette.select('rect'),
            text = palette.select('text'),
            label = labelG.selectAll('text').data(labelValues),
            labelExit = label.exit(),
            labelEnter = label
                .enter()
                .append('text')
                .attr('y', -14)
                .attr('dy', '0.31em')
                .style('font-size', '10px')
                .style('fill', DEFAULT_COLOR)
                .attr('text-anchor', 'start')
                .attr('opacity', 0);

        palette = palette.merge(paletteEnter);

        rect = rect.merge(
            paletteEnter
                .append('rect')
                .attr('height', SIZE.H)
                .attr('width', SIZE.W)
                .attr('stroke', DEFAULT_COLOR)
        );

        text = text.merge(
            paletteEnter
                .append('text')
                .attr('dy', '0.3em')
                .style('font-size', '10px')
                .style('fill', DEFAULT_COLOR)
                .attr('x', SIZE.W + 4)
                .attr('y', SIZE.H / 2)
        );

        this.$animateCallback = (t: number) => {
            if (
                start.position[0] !== end.position[0] ||
                start.position[1] !== end.position[1]
            ) {
                g.attr('transform', `translate(${position(t)})`);
            }

            let fo = fadeOut(t),
                fi = fadeIn(t);

            paletteExit.attr('transform', (d, i) => {
                return `translate(${
                    end.palettes[i] &&
                    end.palettes[i]['domainValue'] !== d['domainValue']
                        ? d3.interpolate(
                              [d['x'], d['y']],
                              [d['x'] - SIZE.O, d['y']]
                          )(t)
                        : [d['x'], d['y']]
                })`;
            });
            paletteExit.attr('opacity', fo);
            labelExit.attr('opacity', fo);

            paletteEnter.attr('opacity', fi);
            labelEnter.attr('opacity', fi);

            label.text(title(t));

            palette.attr(
                'transform',
                (d) => `translate(${d.interpolateTranslate(t)})`
            );

            rect.attr('fill', (d) => d.interpolateRange(t));

            text.text((d, i) => {
                let name: string = d.interpolateDomain(t);
                return name.length > 10 && paletteValues.length > i + 6
                    ? `${name.substring(0, 10)}...`
                    : name;
            });
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
            paletteValues: endExists
                ? this._getInterpolationPalettes(
                      startVariables.palettes,
                      endVariables.palettes,
                      swapInterpolate
                  )
                : [],
            labelValues: endExists ? [null] : [],
        };
    }

    private _getVariablesFromProperties(properties: any) {
        let scale = properties.scale,
            position = properties.translate,
            palettes = this._computePalettes(properties),
            title = properties.title;
        return {
            position,
            scale,
            palettes,
            title,
        };
    }

    private _getInterpolationPalettes(
        start: any[],
        end: any[],
        swapInterpolate
    ): any[] {
        let ret = [];
        let startDomain = start ? start.map((p) => p['domainValue']) : [],
            startSelected = [];
        end.forEach((p, i) => {
            // Is the palette range value in start?
            let index = startDomain.indexOf(p['domainValue']);
            if (index > -1 && startSelected.indexOf(index) < 0) {
                // Add this palette to the merged list, this is select group
                ret.push({
                    interpolateRange: d3.interpolate(
                        start[index].rangeValue,
                        p.rangeValue
                    ),
                    interpolateDomain: swapInterpolate(
                        start[index].domainValue,
                        p.domainValue
                    ),
                    interpolateTranslate: d3.interpolate(
                        [start[index].x, start[index].y],
                        [p.x, p.y]
                    ),
                    domainValue: p.domainValue,
                });
                startSelected.push(index);
            } else {
                // This is enter group
                // Offset the position if a palette exists in that spot already
                let offsetX = start[i] ? SIZE.O : 0;
                ret.push({
                    interpolateRange: (t: number) => p.rangeValue,
                    interpolateDomain: (t: number) => p.domainValue,
                    interpolateTranslate: d3.interpolate(
                        [p.x + offsetX, p.y],
                        [p.x, p.y]
                    ),
                    domainValue: p.domainValue,
                });
            }
        });
        return ret;
    }

    private _computePalettes(properties): IPaletteData[] {
        let ret = [],
            scale = properties.scale,
            range = scale.range(),
            domain = scale.domain();
        let size = properties.showAll || domain.length <= 10 ? domain.length : 10;
        for (let i = 0; i < size; i++) {
            ret.push({
                x: Math.floor(i / 5) * (SIZE.W + SIZE.WP),
                y: (i % 5) * (SIZE.H + SIZE.HP),
                rangeValue: range[i],
                domainValue: domain[i],
            });
        }
        return ret;
    }
}

const SIZE = {
    W: 14,
    H: 14,
    HP: 12,
    WP: 66,
    O: 42,
};

const DEFAULT_COLOR = '#878787';

interface IPaletteData {
    rangeValue: string;
    domainValue: string;
    x: number;
    y: number;
}
