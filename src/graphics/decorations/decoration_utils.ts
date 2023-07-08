import IBinding from '../../data/bindings/IBinding';
import IDecorationSpec from '../../core/IDecorationSpec';
import store from '../../store';
import CategoricalColorLegend from './CategoricalColorLegend';
import {getVisBindingById, getVisScaleById} from '../../selectors';

import _ from 'underscore';

const getOrientation = (binding: IBinding) => {
    return binding.visualField === 'x' ||
        binding.visualField === 'width' ||
        binding.visualField === 'seg-x' ||
        binding.visualField === 'anchor-x' ||
        binding.visualField === 'composite-x'
        ? 'x'
        : 'y';
};

const getAlignment = (orientation: any) => {
    return orientation === 'x' ? 'bottom' : 'left';
};

const getTranslate = (spec: IDecorationSpec, binding: IBinding) => {
    switch (binding.visualField) {
        case 'x':
        case 'composite-x':
        case 'seg-x':
            return [
                spec.centerBounds.left - (binding.scaledMin ? binding.scaledMin : 0),
                spec.bounds.bottom,
            ];
        case 'anchor-x':
            return [spec.bounds.left, spec.bounds.bottom];
        case 'y':
        case 'composite-y':
        case 'seg-y':
            return [
                spec.bounds.left,
                spec.centerBounds.top - (binding.scaledMin ? binding.scaledMin : 0),
            ];
        case 'anchor-y':
            return [spec.bounds.left, spec.bounds.top];
        case 'width':
            return [spec.bounds.left, spec.bounds.bottom];
        case 'height':
            return [spec.bounds.left, spec.bounds.top];
        case 'strokeColor':
        case 'fillColor':
        case 'apFillColor':
        case 'apStrokeColor':
        case 'area':
        case 'fontSize':
        case 'strokeWidth':
            return [spec.bounds.left, spec.bounds.top];
    }
};

export const getAxisOrLegendFromType = (type: string): string => {
    switch (type) {
        case 'CategoricalAxis':
        case 'NumericalAxis':
            return 'Axis';
        case 'CategoricalColorLegend':
        case 'NumericalColorLegend':
        case 'FontSizeLegend':
        case 'ShapeAreaLegend':
        case 'StrokeWidthLegend':
        default:
            return 'Legend';
    }
};

export const createBindingDecorationProperties = (spec: IDecorationSpec): any => {
    let binding = getVisBindingById(store.getState(), spec.bindingId),
        scaleId = binding.scaleId,
        title = binding.dataColumn,
        scale = getVisScaleById(store.getState(), scaleId),
        orientation,
        alignment;

    let {flipped, userFlipped, userTranslate, translate, showAll, ids} = spec;

    switch (spec.type) {
        case 'CategoricalAxis':
            orientation = getOrientation(binding);
            alignment = getAlignment(orientation);
            break;
        case 'NumericalAxis':
            orientation = getOrientation(binding);
            alignment = getAlignment(orientation);
            break;
        default:
            break;
    }

    if (!translate) {
        translate = getTranslate(spec, binding);
    }

    return {
        scale,
        scaleId,
        title,
        orientation,
        alignment,
        flipped,
        userFlipped,
        userTranslate,
        translate,
        showAll,
        ids,
    };
};

export const areDecorationsAnimating = (
    start: IDecorationSpec,
    end: IDecorationSpec
): boolean => {
    let startProps = createBindingDecorationProperties(start),
        endProps = createBindingDecorationProperties(end);

    return (
        startProps.title !== endProps.title ||
        startProps.orientation !== endProps.orientation ||
        startProps.alignment !== endProps.alignment ||
        startProps.flipped !== endProps.flipped ||
        startProps.showAll !== endProps.showAll ||
        Math.abs(startProps.translate[0] - endProps.translate[0]) > 3 ||
        Math.abs(startProps.translate[1] - endProps.translate[1]) > 3 ||
        !_.isEqual(startProps.scale.domain(), endProps.scale.domain()) ||
        !_.isEqual(startProps.scale.range(), endProps.scale.range())
    );
};
