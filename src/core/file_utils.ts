import * as THREE from 'three';
import * as d3 from 'd3';

import _ from 'underscore';

import store from '../store';

import {getClassFromFilters, loadDatasetFromJSON} from '../data/data_utils';

import DataScope from '../data/DataScope';
import {VisTemplate} from './VisTemplate';
import {computeBoundsFromProps, computeCenterBoundsFromProps, createPeerShape} from '../graphics/graphic_utils';
import {createVisBoard} from './board_utils';
import {VisGenerator} from './VisGenerator';
import {
    addBinding,
    addDecoration,
    addScale,
    addVisTemplate,
} from '../actions/action_creators';
import Binding from '../data/bindings/Binding';
import {getElementCounter} from '../utils/counter';
import IBinding from '../data/bindings/IBinding';
import CategoricalAxis from '../graphics/decorations/CategoricalAxis';
import NumericalAxis from '../graphics/decorations/NumericalAxis';
import ShapeAreaLegend from '../graphics/decorations/ShapeAreaLegend';
import FontSizeLegend from '../graphics/decorations/FontSizeLegend';
import StrokeWidthLegend from '../graphics/decorations/StrokeWidthLegend';
import CategoricalColorLegend from '../graphics/decorations/CategoricalColorLegend';
import NumericalColorLegend from '../graphics/decorations/NumericalColorLegend';
import IDecorationSpec from './IDecorationSpec';
import {createBindingDecorationProperties} from '../graphics/decorations/decoration_utils';

export const loadVisFileFromJSON = (visJSON) => {
    console.log(visJSON);
    let datasetId = '';
    if (visJSON.data) {
        datasetId = loadDatasetFromJSON(visJSON.data);
    } else {
        console.error('Scene does not have valid data.');
    }

    // Load the template from scene objects
    if (datasetId.length > 0 && visJSON.scene) {
        let template = loadTemplateFromJSON(visJSON, datasetId);
        let generator = new VisGenerator(
            template.dataScopeMap,
            template.idMap,
            template
        );
        createVisBoard(generator);
    }
};

export const readFileAsJSON = (file: File): Promise<any> => {
    return new Promise<any>((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = () => {
            resolve(JSON.parse(reader.result as string));
        };
        reader.onerror = () => {
            reject(new Error(`Unable to read file ${file.name}`));
        };
        reader.readAsText(file, 'utf-8');
    });
};

export const loadVisFile = (file: File) => {
    readFileAsJSON(file).then((visJSON) => {
        loadVisFileFromJSON(visJSON);
    });
};

export const loadScaleFromJSON = (scaleJSON) => {
    let type = scaleJSON.type,
        domain =
            type === 'time'
                ? scaleJSON.domain.map((d) => new Date(d))
                : scaleJSON.domain,
        scaleType = type ? type[0].toUpperCase() + type.slice(1) : 'Linear',
        scale = d3[`scale${scaleType}`]().domain(domain).range(scaleJSON.range);
    if (scaleJSON.clamp) {
        scale.clamp(scaleJSON.clamp);
    }
    scale.id = getElementCounter('Scale');
    return scale;
};

export const loadDecorationSpecFromJSON = (
    controlJSON: any,
    binding: IBinding,
    bounds: any,
    centerBounds
): IDecorationSpec => {
    let {translate, userTranslate, flipped, userFlipped, showAll, ids} = controlJSON;
    let type = '';
    switch (binding.visualField) {
        case 'x':
        case 'y':
        case 'width':
        case 'height':
        case 'anchor-y':
        case 'anchor-x':
        case 'composite-x':
        case 'composite-y':
        case 'seg-x':
        case 'seg-y':
            if (binding.isCategorical) {
                type = 'CategoricalAxis';
            } else {
                type = 'NumericalAxis';
            }
            break;
        case 'strokeColor':
        case 'fillColor':
        case 'apFillColor':
        case 'apStrokeColor':
            if (binding.isCategorical) {
                type = 'CategoricalColorLegend';
            } else {
                type = 'NumericalColorLegend';
            }
            break;
        case 'area':
            type = 'ShapeAreaLegend';
            break;
        case 'fontSize':
            type = 'FontSizeLegend';
            break;
        case 'strokeWidth':
            type = 'StrokeWidthLegend';
            break;
        case 'content':
            type = '';
            break;
        default:
            console.error(`Unknown binding type of ${binding.visualField}`, binding);
            type = '';
            break;
    }
    return {
        bindingId: binding.id,
        decorationId: -1,
        type,
        flipped,
        userFlipped,
        translate,
        userTranslate,
        showAll,
        ids,
        bounds,
        centerBounds
    };
};

export const loadBindingDecorationFromJSON = (spec: IDecorationSpec) => {
    let properties = createBindingDecorationProperties(spec);

    switch (spec.type) {
        case 'CategoricalAxis':
            return new CategoricalAxis(properties);
        case 'NumericalAxis':
            return new NumericalAxis(properties);
        case 'CategoricalColorLegend':
            return new CategoricalColorLegend(properties);
        case 'NumericalColorLegend':
            return new NumericalColorLegend(properties);
        case 'FontSizeLegend':
            return new FontSizeLegend(properties);
        case 'StrokeWidthLegend':
            return new StrokeWidthLegend(properties);
        default:
            console.error(`Unknown decoration type of ${spec.type}`, spec);
            return null;
    }
};

export const loadBindingFromJSON = (bindingJSON) => {};

export function loadInstanceFromJSON(visJSON, datasetId) {}

export function loadTemplateFromJSON(visJSON, datasetId) {
    let background = new (THREE.Color as any)(
        d3.rgb(visJSON.scene['fillColor']).hex()
    );

    let scaleIdMap = {},
        bindingMap = {},
        decorationMap = {};

    let elementMap = {},
        propertyMap = {},
        dataScopeMap = {},
        idMap = {},
        parentMap = {};
    loadSceneFromJSON(
        visJSON.scene,
        propertyMap,
        dataScopeMap,
        idMap,
        parentMap,
        datasetId
    );
    _.keys(idMap).forEach((id) => {
        let idList = idMap[id];
        let type = propertyMap[id][idList[0]].type;
        let element = createPeerShape(
            type,
            idList.length,
            idList.map((typeId) => propertyMap[id][typeId])
        );
        // TODO handle Groups, Composites, Text elements
        if (element) {
            elementMap[id] = element.classId;
        }
    });

    if (visJSON.bindings) {
        if (visJSON.bindings.scales) {
            _.keys(visJSON.bindings.scales).forEach((id) => {
                let scale = loadScaleFromJSON(visJSON.bindings.scales[id]);
                scaleIdMap[id] = scale.id;
                store.dispatch(addScale(scale));
            });
        }

        if (visJSON.bindings.bindingActions) {
            _.keys(visJSON.bindings.bindingActions).forEach((classId) => {
                _.keys(visJSON.bindings.bindingActions[classId]).forEach((attr) => {
                    let bindingAction =
                        visJSON.bindings.bindingActions[classId][attr];
                    let {colNm, aggr, classID, scaleID, isCategory, scaledMin} = bindingAction;

                    // Create binding
                    let binding = new Binding(
                        colNm,
                        attr,
                        classID,
                        aggr,
                        isCategory,
                        scaleIdMap[scaleID],
                        scaledMin
                    );
                    store.dispatch(addBinding(binding));
                    if (bindingMap.hasOwnProperty(classID)) {
                        bindingMap[classID].push(binding.id);
                    } else {
                        bindingMap[classID] = [binding.id];
                    }
                    if (
                        bindingAction.controls &&
                        bindingAction.controls.length > 0
                    ) {
                        let bounds = getShapeBoundsForDecoration(
                            propertyMap,
                            binding
                        );
                        let centerBounds = getShapeCenterBoundsForDecoration(
                            propertyMap,
                            binding
                        );
                        if (bounds) {
                            bindingAction.controls.forEach((controlJSON) => {
                                let decorationSpec = loadDecorationSpecFromJSON(
                                    controlJSON,
                                    binding,
                                    bounds,
                                    centerBounds
                                );

                                // Create decoration for binding
                                let bindingDecoration = loadBindingDecorationFromJSON(
                                    decorationSpec
                                );

                                if (bindingDecoration) {
                                    decorationSpec.decorationId =
                                        bindingDecoration.id;
                                    store.dispatch(addDecoration(bindingDecoration));
                                    if (decorationMap.hasOwnProperty(classID)) {
                                        if (
                                            decorationMap[classID].hasOwnProperty(
                                                binding.visualField
                                            )
                                        ) {
                                            decorationMap[classID][
                                                binding.visualField
                                            ].push(decorationSpec);
                                        } else {
                                            decorationMap[classID][
                                                binding.visualField
                                            ] = [decorationSpec];
                                        }
                                    } else {
                                        decorationMap[classID] = {};
                                        decorationMap[classID][
                                            binding.visualField
                                        ] = [decorationSpec];
                                    }
                                }
                            });
                        }
                    }
                });
            });
        }
    }

    let template = new VisTemplate(
        elementMap,
        propertyMap,
        dataScopeMap,
        idMap,
        parentMap,
        bindingMap,
        decorationMap,
        visJSON.alignments,
        background
    );

    store.dispatch(addVisTemplate(template));

    return template;
}

export const getShapeBoundsForDecoration = (propertyMap: any, binding: IBinding) => {
    if (propertyMap[binding.classId]) {
        return computeBoundsFromProps(_.values(propertyMap[binding.classId]));
    } else {
        console.log('Could not find bound peer shapes in propertyMap');
    }
};

export const getShapeCenterBoundsForDecoration = (propertyMap: any, binding: IBinding) => {
    if (propertyMap[binding.classId]) {
        return computeCenterBoundsFromProps(_.values(propertyMap[binding.classId]));
    } else {
        console.log('Could not find bound peer shapes in propertyMap');
    }
};

export const loadSceneFromJSON = (
    json,
    propertyMap,
    dataScopeMap,
    idMap,
    parentMap,
    datasetId
) => {
    if (_.isArray(json.children)) {
        json.children.forEach((childJSON) => {
            // Check if json has dataScope tag
            let ds = childJSON['dataScope'],
                type = childJSON['type'],
                classId = childJSON['classID'],
                typeId = `${type}${childJSON['compID']}`;
            // TODO need a way to preserve grouping and collections
            // Right now this does not include high-level Composites w/o a data scope, or any shape w/o a data scope
            if (
                ds &&
                classId &&
                (type === 'Rectangle' ||
                    type === 'Ellipse' ||
                    type === 'Path' ||
                    type === 'Composite' ||
                    type === 'Group')
            ) {
                let allFilters = _.extend(ds['filters'], ds['inheritedFilters']);
                if (!dataScopeMap.hasOwnProperty(classId)) {
                    dataScopeMap[classId] = {};
                }
                if (!propertyMap.hasOwnProperty(classId)) {
                    propertyMap[classId] = {};
                }
                if (!idMap.hasOwnProperty(classId)) {
                    idMap[classId] = [];
                }
                if (json['type'] !== 'Artboard') {
                    if (!parentMap.hasOwnProperty(classId)) {
                        parentMap[classId] = json['classID'];
                    }
                }
                dataScopeMap[classId][typeId] = new DataScope(
                    ds['filters'],
                    ds['inheritedFilters'],
                    datasetId
                );
                propertyMap[classId][typeId] = _.omit(childJSON, 'children');
                idMap[classId].push(typeId);
            }
            if (_.isArray(childJSON.children) && childJSON.children.length > 0) {
                loadSceneFromJSON(
                    childJSON,
                    propertyMap,
                    dataScopeMap,
                    idMap,
                    parentMap,
                    datasetId
                );
            }
        });
    }
};
