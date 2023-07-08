import PeerEllipse from './objects/PeerEllipse';
import PeerRectangle from './objects/PeerRectangle';
import PeerPath from './objects/PeerPath';

import IPeerObject from './objects/IPeerObject';

import _ from 'underscore';

import store from '../store';
import {ADD_GRAPHIC_OBJECT} from '../actions/action_types';
import {VisGenerator} from '../core/VisGenerator';
import {getCanvasObjects, getVisDecorations} from '../selectors';
import PeerComposite from './objects/Composite';
import PeerFlubber from './objects/PeerFlubber';

export const createPeerShape = (type, count, properties): IPeerObject => {
    let element;
    switch (type) {
        case 'Ellipse':
            element = new PeerEllipse(count);
            break;
        case 'Rectangle':
            element = new PeerRectangle(count);
            break;
        case 'Path':
            element = new PeerPath(count, properties);
            break;
        case 'Composite':
        case 'Group':
            element = new PeerComposite(count);
            break;
        case 'Flubber':
            element = new PeerFlubber(count, properties);
            break;
        default:
            console.warn('Tried to load unsupported graphic object');
            break;
    }
    if (element) {
        store.dispatch({
            type: ADD_GRAPHIC_OBJECT,
            id: element.classId,
            payload: element,
        });
    }
    return element;
};

const PATH_VISUAL_FIELDS = ['stroke-color', 'stroke-width', 'opacity'];
const TEXT_VISUAL_FIELDS = [
    'x-position',
    'y-position',
    'content',
    'size',
    'fill-color',
    'stroke-color',
    'stroke-width',
    'opacity',
];

const SHAPE_VISUAL_FIELDS = [
    'x-position',
    'y-position',
    'width',
    'height',
    'fill-color',
    'stroke-color',
    'stroke-width',
    'opacity',
];

const VISUAL_FIELDS_TO_GLSL_TIME_PROPS = {
    'y-position': 'y_position',
    'x-position': 'x_position',
    width: 'width',
    height: 'height',
    'fill-color': 'fill_color',
    'stroke-color': 'stroke_color',
    'stroke-width': 'stroke_width',
    opacity: 'opacity',
    size: 'size',
    content: 'content',
    shape: 'shape',
};

const SHAPE_VISUAL_FXNS = {
    'x-position': (p) => (p.left + p.width / 2).toFixed(1),
    'y-position': (p) => (p.top + p.height / 2).toFixed(1),
    width: (p) => p.width.toFixed(1),
    height: (p) => p.height.toFixed(1),
    // 'area': (p) => (p.width * p.height),
    'fill-color': (p) => p.fillColor,
    'stroke-color': (p) => p.strokeColor,
    'stroke-width': (p) => p.strokeWidth,
    opacity: (p) => p.opacity,
};

const PATH_VISUAL_FXNS = {
    'stroke-color': (p) => p.path[1].strokeColor,
    'stroke-width': (p) => p.path[1].strokeWidth,
    opacity: (p) => p.opacity,
};

export const getGLSLTimeProp = (field: string) => {
    return VISUAL_FIELDS_TO_GLSL_TIME_PROPS[field];
};

export const generateVisualFields = (type: string) => {
    switch (type) {
        case 'Ellipse':
        case 'Rectangle':
            return SHAPE_VISUAL_FIELDS;
        case 'Path':
            return PATH_VISUAL_FIELDS;
        case 'PointText':
            return TEXT_VISUAL_FIELDS;
        default:
            return [];
    }
};

export const generateVisualFxns = (type: string) => {
    switch (type) {
        case 'Ellipse':
        case 'Rectangle':
        case 'PointText':
            return SHAPE_VISUAL_FXNS;
        case 'Path':
            return PATH_VISUAL_FXNS;
        default:
            return {};
    }
};

const approx = (startValue: any, endValue: any): boolean => {
    if (_.isNumber(startValue)) {
        return Math.abs(startValue - endValue) < 1;
    } else {
        return startValue === endValue;
    }
};

export const generatePropertyListFromDiffs = (
    startProps: any,
    endProps: any,
    type: string
) => {
    // TODO need a way to compute if combine/partition properties are different?
    let propList = [];
    let visualFields = generateVisualFields(type),
        visualFxns = generateVisualFxns(type);
    for (let f = 0; f < visualFields.length; f++) {
        for (let i = 0; i < startProps.length; i++) {
            if (
                !approx(
                    visualFxns[visualFields[f]](startProps[i]),
                    visualFxns[visualFields[f]](endProps[i])
                )
            ) {
                propList.push(visualFields[f]);
                break;
            }
        }
    }
    return propList;
};

// TODO compute bounds for Paths when they get loaded
export const computeBoundsForPath = (prop: any): any => {
    let x = _.map(prop.path[1].segments, (s) => s[0]),
        y = _.map(prop.path[1].segments, (s) => s[1]);
    return {
        top: Math.min(...y),
        left: Math.min(...x),
        right: Math.max(...x),
        bottom: Math.max(...y),
    };
};

export const computeBoundsForGroup = (prop: any): any => {
    return {
        top: prop.gridBounds.point[1],
        left: prop.gridBounds.point[0],
        right: prop.gridBounds.point[0] + prop.gridBounds.size[0],
        bottom: prop.gridBounds.point[1] + prop.gridBounds.size[1],
    };
};

export const computeBoundsFromProp = (prop: any) => {
    switch (prop.type) {
        case 'Path':
            return computeBoundsForPath(prop);
        case 'Composite':
        case 'Group':
            return computeBoundsForGroup(prop);
        default:
            return {
                top: prop.top,
                left: prop.left,
                right: prop.left + prop.width,
                bottom: prop.top + prop.height,
            };
    }
};

export const computeCenterBoundsFromProp = (prop: any) => {
    let bounds = computeBoundsFromProp(prop);
    let centerX = bounds.left + (bounds.right - bounds.left) / 2,
        centerY = bounds.top + (bounds.bottom - bounds.top) / 2;
    return {
        top: centerY,
        left: centerX,
        right: centerX,
        bottom: centerY
    };
};

export const computeBoundsFromProps = (props: any[], bounds?: any) => {
    if (props && props.length > 0)
        if (!bounds) {
            bounds = computeBoundsFromProp(props[0]);
        }
    props.forEach((p) => {
        let b = computeBoundsFromProp(p);
        if (b.top < bounds.top) bounds.top = b.top;
        if (b.left < bounds.left) bounds.left = b.left;
        if (b.bottom > bounds.bottom) bounds.bottom = b.bottom;
        if (b.right > bounds.right) bounds.right = b.right;
    });
    return bounds;
};

export const computeCenterBoundsFromProps = (props: any[], bounds?: any) => {
    if (props && props.length > 0)
        if (!bounds) {
            bounds = computeCenterBoundsFromProp(props[0]);
        }
    props.forEach((p) => {
        let b = computeCenterBoundsFromProp(p);
        if (b.top < bounds.top) bounds.top = b.top;
        if (b.left < bounds.left) bounds.left = b.left;
        if (b.bottom > bounds.bottom) bounds.bottom = b.bottom;
        if (b.right > bounds.right) bounds.right = b.right;
    });
    return bounds;
};

export const renderPreview = (generator: VisGenerator): Promise<any> => {
    // @ts-ignore
    let offscreen = window.application.appView.offscreen;
    let template = generator.template;
    let objects = getCanvasObjects(store.getState());
    _.values(template.objectMap).forEach((classId) => {
        offscreen.addObject(objects[classId]);
    });
    offscreen.setBackground(template.background);
    let bounds = undefined;
    _.keys(template.idMap).forEach((id) => {
        let object = objects[template.objectMap[id]];
        object.staticProperties(_.values(template.propertyMap[id]));
        bounds = computeBoundsFromProps(_.values(template.propertyMap[id]), bounds);
    });
    offscreen.setCenter(
        (bounds.left + bounds.right) / 2,
        (bounds.top + bounds.bottom) / 2
    );
    offscreen.renderOnce();
    _.values(template.objectMap).forEach((classId) => {
        offscreen.removeObject(objects[classId]);
    });
    return offscreen.getImageData();
};

export const renderDecorations = (generator: VisGenerator): Blob => {
    // @ts-ignore
    let offscreen = window.application.appView.offscreen,
        decorations = getVisDecorations(store.getState()),
        template = generator.template,
        decorationSpecs = _.flatten(
            _.values(template.decorationMap).map((k) => _.values(k))
        );
    decorationSpecs.forEach((spec) => {
        offscreen.addDecoration(decorations[spec.decorationId]);
    });
    offscreen.renderStaticSVG();
    let blob = new Blob([offscreen.$svg.outerHTML], {
        type: 'image/svg+xml;charset=utf-8',
    });
    decorationSpecs.forEach((spec) => {
        offscreen.removeDecoration(decorations[spec.decorationId]);
    });
    return blob;
};
