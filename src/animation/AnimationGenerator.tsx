import React from 'react';
import ReactDOM from 'react-dom';

import _ from 'underscore';

import IRenderable from 'graphics/IRenderable';
import IObject from '../graphics/objects/IObject';
import {VisGenerator} from '../core/VisGenerator';

import store from '../store';
import {
    computeBoundsFromProps,
    createPeerShape,
    generatePropertyListFromDiffs,
    generateVisualFields,
} from '../graphics/graphic_utils';
import ITiming from './ITiming';
import {ILayerTreeNode} from '../views/animate/LayerTreeNode';
import LayerElement from '../views/animate/svg/LayerElement';
import {formatCount} from '../utils';
import * as d3 from 'd3';
import {
    areDecorationsAnimating,
    createBindingDecorationProperties,
    getAxisOrLegendFromType,
} from '../graphics/decorations/decoration_utils';
import DataScope from '../data/DataScope';
import {AnimationEffect, AnimationEffectMap} from './AnimationEffect';
import ObjectTiming from './ObjectTiming';
import DecorationTiming from './DecorationTiming';
import IDecoration from '../graphics/decorations/IDecoration';
import {EasingOption} from './EasingOption';
import Dataset from '../data/Dataset';
import {
    getCanvasObjectById,
    getCanvasObjects,
    getDatasetById,
    getVisDecorationById,
} from '../selectors';

export class AnimationGenerator implements IRenderable {
    constructor(startVis: VisGenerator, endVis: VisGenerator) {
        this.startVis = startVis;
        this.endVis = endVis;
        this._linkObjects();
    }

    public startVis: VisGenerator;
    public endVis: VisGenerator;
    public duration: number = 1e3;

    public id: string;
    public transitionType: string = 'auto';
    objects: IObject[];
    public enter = [];
    public linked = [];
    public exit = [];

    public updateObjects() {
        let objects = getCanvasObjects(store.getState());
        this.enter.forEach((e) => {
            if (e.type === 'object') {
                let props = e.idList.map(
                    (id) => this.endVis.template.propertyMap[e.objectMap.end][id]
                );
                let dataScopes = e.idList.map(
                    (id) => this.endVis.template.dataScopeMap[e.objectMap.end][id]
                );
                objects[e.objectMap.object].animatePropertiesWithEffect(
                    props,
                    dataScopes,
                    e.index,
                    e.timing,
                    e.effect,
                    this.endVis.template.bounds
                );
            } else if (e.type === 'decoration') {
                let decoration = getVisDecorationById(
                    store.getState(),
                    e.decorationMap.decoration
                );
                decoration.properties.end = createBindingDecorationProperties(
                    e.decorationMap.end[0]
                );
                decoration.properties.start = null;
            }
        });
        this.linked.forEach((l) => {
            if (l.type === 'object') {
                if (l.isMerge) {
                    let startProps = [],
                        endProps = [],
                        dataScopes = [];
                    l.idList.forEach((ids) => {
                        // Compute transformed properties for x,y,width,height
                        if (ids.start.length === 1) {
                            // Compute the merge effect from props
                            startProps.push(
                                ids.end.map(
                                    (i) =>
                                        this.startVis.template.propertyMap[
                                            l.objectMap.start
                                        ][ids.start[0]]
                                )
                            );
                            endProps.push(
                                ids.end.map(
                                    (i) =>
                                        this.endVis.template.propertyMap[
                                            l.objectMap.end
                                        ][i]
                                )
                            );
                            dataScopes.push(
                                ids.end.map(
                                    (i) =>
                                        this.endVis.template.dataScopeMap[
                                            l.objectMap.end
                                        ][i]
                                )
                            );
                            dataScopes = _.flatten(dataScopes);
                        } else {
                            startProps.push(
                                ids.start.map(
                                    (i) =>
                                        this.startVis.template.propertyMap[
                                            l.objectMap.start
                                        ][i]
                                )
                            );
                            endProps.push(
                                ids.start.map(
                                    (i) =>
                                        this.endVis.template.propertyMap[
                                            l.objectMap.end
                                        ][ids.end[0]]
                                )
                            );
                            dataScopes.push(
                                ids.start.map(
                                    (i) =>
                                        this.startVis.template.dataScopeMap[
                                            l.objectMap.start
                                        ][i]
                                )
                            );
                            dataScopes = _.flatten(dataScopes);
                        }
                    });
                    startProps = _.flatten(startProps);
                    endProps = _.flatten(endProps);

                    let data = l.idList.map(
                        (id) =>
                            this.startVis.template.dataScopeMap[l.objectMap.start][
                                id.start[0]
                            ]
                    );
                    let endDataScopes = l.idList.map(
                        (id) =>
                            this.endVis.template.dataScopeMap[l.objectMap.end][
                                id.end[0]
                            ]
                    );
                    objects[l.objectMap.object].animatePropertiesWithMerge(
                        startProps,
                        endProps,
                        dataScopes,
                        l.index,
                        l.timing
                    );
                } else {
                    let startProps = l.idList.map(
                        (id) =>
                            this.startVis.template.propertyMap[l.objectMap.start][
                                id.start[0]
                            ]
                    );
                    let endProps = l.idList.map(
                        (id) =>
                            this.endVis.template.propertyMap[l.objectMap.end][
                                id.end[0]
                            ]
                    );
                    let startDataScopes = l.idList.map(
                        (id) =>
                            this.startVis.template.dataScopeMap[l.objectMap.start][
                                id.start[0]
                            ]
                    );
                    let endDataScopes = l.idList.map(
                        (id) =>
                            this.endVis.template.dataScopeMap[l.objectMap.end][
                                id.end[0]
                            ]
                    );
                    objects[l.objectMap.object].animateProperties(
                        startProps,
                        endProps,
                        startDataScopes,
                        endDataScopes,
                        l.index,
                        l.timing
                    );
                }
            } else if (l.type === 'decoration') {
                let decoration = getVisDecorationById(
                    store.getState(),
                    l.decorationMap.decoration
                );
                decoration.properties.start = createBindingDecorationProperties(
                    l.decorationMap.start[0]
                );
                decoration.properties.end = createBindingDecorationProperties(
                    l.decorationMap.end[0]
                );
            }
        });
        this.exit.forEach((e) => {
            if (e.type === 'object') {
                let props = e.idList.map(
                    (id) => this.startVis.template.propertyMap[e.objectMap.start][id]
                );
                let dataScopes = e.idList.map(
                    (id) =>
                        this.startVis.template.dataScopeMap[e.objectMap.start][id]
                );
                objects[e.objectMap.object].animatePropertiesWithEffect(
                    props,
                    dataScopes,
                    e.index,
                    e.timing,
                    e.effect,
                    this.startVis.template.bounds
                );
            } else if (e.type === 'decoration') {
                let decoration = getVisDecorationById(
                    store.getState(),
                    e.decorationMap.decoration
                );
                decoration.properties.end = null;
                decoration.properties.start = createBindingDecorationProperties(
                    e.decorationMap.start[0]
                );
            }
        });
    }

    // TODO Clean up access of timing since this gets called a ton
    public getTimingForObject(object: IObject): ITiming {
        let possible = this.enter.filter(
            (e) => e.type === 'object' && e.objectMap.object === object.classId
        );
        if (possible.length > 0) {
            return possible[0].timing;
        }
        possible = this.linked.filter(
            (e) => e.type === 'object' && e.objectMap.object === object.classId
        );
        if (possible.length > 0) {
            return possible[0].timing;
        }
        possible = this.exit.filter(
            (e) => e.type === 'object' && e.objectMap.object === object.classId
        );
        if (possible.length > 0) {
            return possible[0].timing;
        }
        return null;
    }

    // TODO Clean up access of timing since this gets called a ton
    public getTimingForDecoration(decoration: IDecoration): ITiming {
        let possible = this.enter.filter(
            (e) =>
                e.type === 'decoration' &&
                e.decorationMap.decoration === decoration.id
        );
        if (possible.length > 0) {
            return possible[0].timing;
        }
        possible = this.linked.filter(
            (e) =>
                e.type === 'decoration' &&
                e.decorationMap.decoration === decoration.id
        );
        if (possible.length > 0) {
            return possible[0].timing;
        }
        possible = this.exit.filter(
            (e) =>
                e.type === 'decoration' &&
                e.decorationMap.decoration === decoration.id
        );
        if (possible.length > 0) {
            return possible[0].timing;
        }
        return null;
    }

    public getBounds() {
        // TODO improve by using bounds pre-computed for templates
        let bounds = undefined;
        this.enter
            .filter((e) => e.type === 'object')
            .forEach((e) => {
                let props = _.values(
                    this.endVis.template.propertyMap[e.objectMap.end]
                );
                bounds = computeBoundsFromProps(props, bounds);
            });
        this.linked
            .filter((e) => e.type === 'object')
            .forEach((l) => {
                let startProps = _.values(
                    this.startVis.template.propertyMap[l.objectMap.start]
                );
                let endProps = _.values(
                    this.endVis.template.propertyMap[l.objectMap.end]
                );
                bounds = computeBoundsFromProps(startProps, bounds);
                bounds = computeBoundsFromProps(endProps, bounds);
            });
        this.exit
            .filter((e) => e.type === 'object')
            .forEach((e) => {
                let props = _.values(
                    this.startVis.template.propertyMap[e.objectMap.start]
                );
                bounds = computeBoundsFromProps(props, bounds);
            });
        return bounds;
    }

    public getLayerData(): ILayerTreeNode[] {
        let layerData = [];

        let linkedRoots = this._createObjectTree('linked'),
            linkedNodes = this._createObjectLayerDataWithTree(linkedRoots, 'linked'),
            enterRoots = this._createObjectTree('enter'),
            enterNodes = this._createObjectLayerDataWithTree(enterRoots, 'enter'),
            exitRoots = this._createObjectTree('exit'),
            exitNodes = this._createObjectLayerDataWithTree(exitRoots, 'exit');
        layerData = layerData.concat(linkedNodes.filter((e) => e.isAnimating));
        layerData = layerData.concat(enterNodes);
        layerData = layerData.concat(exitNodes);
        // this.enter
        //     .filter((e) => e.type === 'object')
        //     .forEach((e) => {
        //         layerData.push(this._createObjectLayerData(e, [], 'enter'));
        //     });
        // this.exit
        //     .filter((e) => e.type === 'object')
        //     .forEach((e) => {
        //         layerData.push(this._createObjectLayerData(e, [], 'exit'));
        //     });
        layerData = layerData.concat(linkedNodes.filter((e) => !e.isAnimating));
        this.linked
            .filter((e) => e.type === 'decoration' && e.isAnimating)
            .forEach((l) => {
                let specStart = l.decorationMap.start[0],
                    propStart = createBindingDecorationProperties(specStart),
                    specEnd = l.decorationMap.end[0],
                    propEnd = createBindingDecorationProperties(specEnd),
                    axisOrLegend = getAxisOrLegendFromType(specStart.type),
                    title =
                        propStart.title === propEnd.title
                            ? propStart.title
                            : `${propStart.title} → ${propEnd.title}`;
                layerData.push({
                    id: l.decorationMap.decoration,
                    map: l.decorationMap,
                    type: 'decoration',
                    label: `${axisOrLegend}: ${title}`,
                    icon: axisOrLegend.toUpperCase(),
                    counts: l.counts,
                    parentScale: l.timing.scale,
                    timing: l.timing,
                    linkType: 'linked',
                    isAnimating: l.isAnimating,
                    isSelected: false,
                });
            });
        this.enter
            .filter((e) => e.type === 'decoration')
            .forEach((e) => {
                let spec = e.decorationMap.end[0],
                    prop = createBindingDecorationProperties(spec),
                    title = prop.title,
                    axisOrLegend = getAxisOrLegendFromType(spec.type);
                layerData.push({
                    id: e.decorationMap.decoration,
                    map: e.decorationMap,
                    type: 'decoration',
                    label: `${axisOrLegend}: ${title}`,
                    icon: axisOrLegend.toUpperCase(),
                    counts: e.counts,
                    parentScale: e.timing.scale,
                    timing: e.timing,
                    linkType: 'enter',
                    isAnimating: e.isAnimating,
                    isSelected: false,
                });
            });
        this.exit
            .filter((e) => e.type === 'decoration')
            .forEach((e) => {
                let spec = e.decorationMap.start[0],
                    prop = createBindingDecorationProperties(spec),
                    title = prop.title,
                    axisOrLegend = getAxisOrLegendFromType(spec.type);
                layerData.push({
                    id: e.decorationMap.decoration,
                    map: e.decorationMap,
                    type: 'decoration',
                    label: `${axisOrLegend}: ${title}`,
                    icon: axisOrLegend.toUpperCase(),
                    counts: e.counts,
                    parentScale: e.timing.scale,
                    timing: e.timing,
                    linkType: 'exit',
                    isAnimating: e.isAnimating,
                    isSelected: false,
                });
            });
        this.linked
            .filter((e) => e.type === 'decoration' && !e.isAnimating)
            .forEach((l) => {
                let specStart = l.decorationMap.start[0],
                    propStart = createBindingDecorationProperties(specStart),
                    specEnd = l.decorationMap.end[0],
                    propEnd = createBindingDecorationProperties(specEnd),
                    axisOrLegend = getAxisOrLegendFromType(specStart.type),
                    title =
                        propStart.title === propEnd.title
                            ? propStart.title
                            : `${propStart.title} → ${propEnd.title}`;
                layerData.push({
                    id: l.decorationMap.decoration,
                    map: l.decorationMap,
                    type: 'decoration',
                    label: `${axisOrLegend}: ${title}`,
                    icon: axisOrLegend.toUpperCase(),
                    counts: l.counts,
                    parentScale: l.timing.scale,
                    timing: l.timing,
                    linkType: 'linked',
                    isAnimating: l.isAnimating,
                    isSelected: false,
                });
            });
        return layerData;
    }

    public getObjectIds() {
        return _.union(
            this.enter
                .filter((o) => o.type === 'object')
                .map((e) => e.objectMap.object),
            this.exit
                .filter((o) => o.type === 'object')
                .map((e) => e.objectMap.object),
            this.linked
                .filter((o) => o.type === 'object')
                .map((l) => l.objectMap.object)
        );
    }

    public getDecorationIds() {
        return _.union(
            this.enter
                .filter((o) => o.type === 'decoration')
                .map((e) => e.decorationMap.decoration),
            this.exit
                .filter((o) => o.type === 'decoration')
                .map((e) => e.decorationMap.decoration),
            this.linked
                .filter((o) => o.type === 'decoration')
                .map((l) => l.decorationMap.decoration)
        );
    }

    public createSequencing(
        objectId: string,
        linkType: string,
        bindColumn: string,
        type: string,
        field: string
    ) {
        let a = _.filter(
            this[linkType],
            (l) => l.type === 'object' && l.objectMap.object === objectId
        )[0];
        if (a) {
            // TODO what do you do when the data changes between?
            let template =
                    linkType === 'enter'
                        ? this.endVis.template
                        : this.startVis.template,
                classId = linkType === 'enter' ? a.objectMap.end : a.objectMap.start,
                datasetId = _.values(template.dataScopeMap[classId])[0].datasetId,
                dataset = getDatasetById(store.getState(), datasetId);
            a.timing.createSequencing(
                type,
                field,
                bindColumn,
                dataset,
                _.values(template.dataScopeMap[classId])
            );
            this.updateObjects();
        } else {
            console.error('Tried to update timing of animation not found.');
            console.log(objectId, linkType);
        }
    }

    public updateEffect(
        objectId: string,
        linkType: string,
        effect: AnimationEffect
    ) {
        let a = _.filter(
            this[linkType],
            (l) => l.type === 'object' && l.objectMap.object === objectId
        )[0];
        if (a) {
            a.effect = effect;
            this.updateObjects();
        } else {
            console.error('Tried to update effect of animation not found.');
            console.log(objectId, linkType);
        }
    }

    public updateEasing(
        objectId: string,
        objectType: string,
        linkType: string,
        easing: EasingOption
    ) {
        let a = _.filter(
            this[linkType],
            (l) =>
                l.type === objectType &&
                (objectType === 'object'
                    ? l.objectMap.object === objectId
                    : l.decorationMap.decoration === objectId)
        )[0];
        if (a) {
            a.timing.easing = easing;
            if (objectType === 'object') {
                getCanvasObjectById(
                    store.getState(),
                    a.objectMap.object
                ).setEasingOption(easing);
            } else {
                getVisDecorationById(
                    store.getState(),
                    a.decorationMap.decoration
                ).setEasingOption(easing);
            }
        } else {
            console.error('Tried to update easing of animation not found.');
            console.log(objectId, objectType, linkType);
        }
    }

    public updateSoloed(
        svg: SVGSVGElement,
        ids: string[],
        type: string,
        linkType: string,
        isSoloed: boolean
    ) {
        let objects = getCanvasObjects(store.getState());

        this.enter.forEach((e) => {
            if (e.type === 'object') {
                if (isSoloed) {
                    objects[e.objectMap.object].visible =
                        linkType === 'enter' && ids.indexOf(e.objectMap.object) > -1;
                } else {
                    objects[e.objectMap.object].visible = true;
                }
            } else {
                let decoration = getVisDecorationById(
                    store.getState(),
                    e.decorationMap.decoration
                );
                if (isSoloed) {
                    decoration.setVisibleToSVG(
                        svg,
                        linkType === 'enter' &&
                            ids.indexOf(e.decorationMap.decoration) > -1
                    );
                } else {
                    decoration.setVisibleToSVG(svg, true);
                }
            }
        });
        this.linked.forEach((e) => {
            if (e.type === 'object') {
                if (isSoloed) {
                    objects[e.objectMap.object].visible =
                        linkType === 'linked' &&
                        ids.indexOf(e.objectMap.object) > -1;
                } else {
                    objects[e.objectMap.object].visible = true;
                }
            } else {
                let decoration = getVisDecorationById(
                    store.getState(),
                    e.decorationMap.decoration
                );
                if (isSoloed) {
                    decoration.setVisibleToSVG(
                        svg,
                        linkType === 'linked' &&
                            ids.indexOf(e.decorationMap.decoration) > -1
                    );
                } else {
                    decoration.setVisibleToSVG(svg, true);
                }
            }
        });
        this.exit.forEach((e) => {
            if (e.type === 'object') {
                if (isSoloed) {
                    objects[e.objectMap.object].visible =
                        linkType === 'exit' && ids.indexOf(e.objectMap.object) > -1;
                } else {
                    objects[e.objectMap.object].visible = true;
                }
            } else {
                let decoration = getVisDecorationById(
                    store.getState(),
                    e.decorationMap.decoration
                );
                if (isSoloed) {
                    decoration.setVisibleToSVG(
                        svg,
                        linkType === 'exit' &&
                            ids.indexOf(e.decorationMap.decoration) > -1
                    );
                } else {
                    decoration.setVisibleToSVG(svg, true);
                }
            }
        });
    }

    public updateKey(
        id: string,
        type: string,
        linkType: string,
        key: string,
        value: number,
        which: string
    ) {
        let a = _.filter(
            this[linkType],
            (l) =>
                l.type === type &&
                (type === 'decoration'
                    ? l.decorationMap.decoration === id
                    : l.objectMap.object === id)
        )[0];
        switch (key) {
            case 'start':
                a.timing.setStartRaw(value);
                break;
            case 'end':
                a.timing.setEndRaw(value);
                break;
            case 'prop-start':
                a.timing.setPropStart(which, value);
                break;
            case 'prop-end':
                a.timing.setPropEnd(which, value);
                break;
        }
        this.updateObjects();
    }

    public createLink(
        startId: string,
        endId: string,
        objectId: string,
        linkBy: string[]
    ) {
        let ex = _.filter(
                this.exit,
                (e) => e.type === 'object' && e.objectMap.start === startId
            )[0],
            en = _.filter(
                this.enter,
                (e) => e.type === 'object' && e.objectMap.end === endId
            )[0];
        if (ex && en) {
            this.exit = _.without(this.exit, ex);
            this.enter = _.without(this.enter, en);
            let startIdList = this.startVis.template.idMap[startId],
                startScopes = this.startVis.template.dataScopeMap[startId],
                startType = this.startVis.template.propertyMap[startId][
                    startIdList[0]
                ].type,
                endIdList = this.endVis.template.idMap[endId],
                endScopes = this.endVis.template.dataScopeMap[endId],
                endType = this.endVis.template.propertyMap[endId][endIdList[0]].type;

            let idLinks = [],
                idEnter = [],
                idExit = [],
                linkedBy = [],
                indexLink = 0,
                indexEnter = 0,
                indexExit = 0;

            if (linkBy.length <= 0) {
                // // Match based on the data scope
                // let startFilterStrings = startScopes.map(
                //     (ds) => ds.filterString
                //     ),
                //     endFilterStrings = endScopes.map((ds) => ds.filterString),
                //     startIndexMap = _.object(
                //         startFilterStrings,
                //         _.range(startFilterStrings.length)
                //     ),
                //     endIndexMap = _.object(
                //         endFilterStrings,
                //         _.range(endFilterStrings.length)
                //     ),
                //     linkedFilterStrings = _.intersection(
                //         startFilterStrings,
                //         endFilterStrings
                //     );
                // idExit = _.difference(
                //     startFilterStrings,
                //     linkedFilterStrings
                // ).map((s) => startIdList[startIndexMap[s]]);
                // idEnter = _.difference(
                //     endFilterStrings,
                //     linkedFilterStrings
                // ).map((s) => endIdList[endIndexMap[s]]);
                // indexLink = startIndexMap[linkedFilterStrings[0]];
                // if (idExit.length > 0) {
                //     indexExit = linkedFilterStrings.length;
                // }
                // if (idEnter.length > 0) {
                //     indexEnter = 0;
                // }
                //
                // // Use filters from example data scope
                // // TODO support for composites and groups
                // linkedBy = _.keys(startScopes[0].allFilters).reverse();
                //
                // linkedFilterStrings.forEach((s) =>
                //     idLinks.push({
                //         start: [startIdList[startIndexMap[s]]],
                //         end: [endIdList[endIndexMap[s]]],
                //     })
                // );
            } else {
                let startTupleStrings = startIdList.map(
                        (id) => startScopes[id].tupleString
                    ),
                    endTupleStrings = endIdList.map(
                        (id) => endScopes[id].tupleString
                    ),
                    startIndexMap = _.object(
                        startTupleStrings,
                        _.range(startTupleStrings.length)
                    ),
                    endIndexMap = _.object(
                        endTupleStrings,
                        _.range(endTupleStrings.length)
                    ),
                    linkedTupleStrings = _.intersection(
                        endTupleStrings,
                        endTupleStrings
                    );

                idExit = _.difference(startTupleStrings, linkedTupleStrings).map(
                    (s) => startIdList[startIndexMap[s]]
                );
                idEnter = _.difference(endTupleStrings, linkedTupleStrings).map(
                    (s) => endIdList[endIndexMap[s]]
                );

                indexLink = startIndexMap[linkedTupleStrings[0]];
                if (idExit.length > 0) {
                    indexExit = linkedTupleStrings.length;
                }
                if (idEnter.length > 0) {
                    indexEnter = 0;
                }

                // TODO need to add other ways to link objects
                linkedBy = ['Row_ID'];

                linkedTupleStrings.forEach((s) =>
                    idLinks.push({
                        start: [startIdList[startIndexMap[s]]],
                        end: [endIdList[endIndexMap[s]]],
                    })
                );
            }

            let propList = generatePropertyListFromDiffs(
                idLinks.map(
                    (l) => this.startVis.template.propertyMap[startId][l.start[0]]
                ),
                idLinks.map(
                    (l) => this.endVis.template.propertyMap[endId][l.end[0]]
                ),
                startType
            );

            if (
                startType !== endType &&
                (startType === 'Ellipse' || startType === 'Rectangle') &&
                (endType === 'Ellipse' || endType === 'Rectangle')
            ) {
                let properties = idLinks.map(
                    (l) => this.startVis.template.propertyMap[startId][l.start[0]]
                );
                propList.push('shape');
                let flubber = createPeerShape('Flubber', idLinks.length, properties);
                objectId = flubber.classId;
            }

            // Create new linked animation between objects
            this.linked.push({
                objectMap: {
                    start: startId,
                    end: endId,
                    object: objectId,
                },
                type: 'object',
                propList,
                linkedBy,
                idList: idLinks,
                index: indexLink,
                timing: new ObjectTiming(propList),
                counts: [idLinks.length, idLinks.length],
                effect: undefined,
                // TODO figure out a way if children are animating, then this is animating
                isAnimating:
                    startType === 'Composite' ||
                    startType === 'Group' ||
                    propList.length > 0,
            });
        }
    }

    public breakLink(objectId: string) {
        let animation = _.filter(
            this.linked,
            (l) => l.type === 'object' && l.objectMap.object === objectId
        )[0];
        if (animation) {
            this.linked = _.without(this.linked, animation);
            let startId = animation.objectMap.start,
                startList = this.startVis.template.idMap[startId],
                endId = animation.objectMap.end,
                endList = this.endVis.template.idMap[endId];
            this.exit.push({
                objectMap: {
                    start: startId,
                    end: null,
                    object: this.startVis.template.objectMap[startId],
                },
                type: 'object',
                propList: [],
                idList: startList,
                index: 0,
                timing: new ObjectTiming(['effect']),
                counts: [startList.length, 0],
                effect: AnimationEffectMap.FADE_OUT,
                isAnimating: true,
            });
            this.enter.push({
                objectMap: {
                    start: null,
                    end: endId,
                    object: this.endVis.template.objectMap[endId],
                },
                type: 'object',
                propList: [],
                idList: endList,
                index: 0,
                timing: new ObjectTiming(['effect']),
                counts: [0, endList.length],
                effect: AnimationEffectMap.FADE_IN,
                isAnimating: true,
            });
        }
    }

    private _linkObjects() {
        // Need a way to load shapes without merging
        // Need a way to merge shapes, need algebra for that - how to handle if at different levels?
        // How to merge?
        // Auto - same shape, same number, same filter / same data tuples
        // Auto - same shape, same number, same filter / different data tuples
        // Auto - same shape, diff number, same data tuples
        // Auto? if left over - diff shape, same number, same data tuples
        // Manual - diff shape, same number, same data tuples
        // Manual - diff shape, diff number, same data tuples
        // Manual -
        // Are there certain shape's that can't transform?
        // Need a way to split shapes that have been merged

        // Clear out object map
        this.enter = [];
        this.linked = [];
        this.exit = [];

        let startIds = _.keys(this.startVis.template.idMap),
            endIds = _.keys(this.endVis.template.idMap),
            startLinked = [],
            endLinked = [];

        let compareMap = {};

        // Auto - same shape, same number, same filter / same data tuples
        // TODO function for equivalent data scopes
        for (let s = 0; s < startIds.length; s++) {
            let startId = startIds[s],
                startIdList = this.startVis.template.idMap[startId],
                startProps = startIdList.map(
                    (id) => this.startVis.template.propertyMap[startId][id]
                ),
                startScopes = startIdList.map(
                    (id) => this.startVis.template.dataScopeMap[startId][id]
                ),
                startType = startProps[0].type;

            compareMap[startId] = {};

            // Loop through all objects in the end vis template & compare them
            for (let e = 0; e < endIds.length; e++) {
                let endId = endIds[e],
                    endIdList = this.endVis.template.idMap[endId],
                    endProps = endIdList.map(
                        (id) => this.endVis.template.propertyMap[endId][id]
                    ),
                    endScopes = endIdList.map(
                        (id) => this.endVis.template.dataScopeMap[endId][id]
                    );

                compareMap[startId][endId] = COMPARE_PROPS(
                    startProps,
                    startScopes,
                    endProps,
                    endScopes
                );
            }
        }

        let compareList = _.flatten(
            _.keys(compareMap).map((startId) =>
                _.keys(compareMap[startId]).map((endId) => ({
                    startId,
                    endId,
                    compare: compareMap[startId][endId],
                }))
            )
        ).filter((d) => d.compare.type === 1);
        compareList.sort((a, b) => COMPARE_SUM(b.compare) - COMPARE_SUM(a.compare));

        // let bestId = _.max(
        //     _.filter(
        //         _.keys(compareMap),
        //         (k) => compareMap[k].type === 1 && endLinked.indexOf(k) < 0
        //     ),
        //     (k) => COMPARE_SUM(compareMap[k])
        // );
        //
        // console.log(startId, bestId);
        //

        for (let i = 0; i < compareList.length; i++) {
            let {startId, endId, compare} = compareList[i];
            // If either already matched, don't try to match
            if (startLinked.indexOf(startId) >= 0 || endLinked.indexOf(endId) >= 0) {
                continue;
            }
            let startIdList = this.startVis.template.idMap[startId],
                startProps = startIdList.map(
                    (id) => this.startVis.template.propertyMap[startId][id]
                ),
                startScopes = startIdList.map(
                    (id) => this.startVis.template.dataScopeMap[startId][id]
                ),
                startType = startProps[0].type;

            if (_.isString(endId) && COMPARE_SUM(compare) >= 5) {
                let objectId = this.startVis.template.objectMap[startId],
                    endIdList = this.endVis.template.idMap[endId],
                    endScopes = endIdList.map(
                        (id) => this.endVis.template.dataScopeMap[endId][id]
                    );

                let idLinks = [],
                    idEnter = [],
                    idExit = [],
                    linkedBy = [],
                    indexLink = 0,
                    indexEnter = 0,
                    indexExit = 0;

                if (compare.dataScope === 1) {
                    // Match based on the data scope
                    let startFilterStrings = startScopes.map(
                            (ds) => ds.filterString
                        ),
                        endFilterStrings = endScopes.map((ds) => ds.filterString),
                        startIndexMap = _.object(
                            startFilterStrings,
                            _.range(startFilterStrings.length)
                        ),
                        endIndexMap = _.object(
                            endFilterStrings,
                            _.range(endFilterStrings.length)
                        ),
                        linkedFilterStrings = _.intersection(
                            startFilterStrings,
                            endFilterStrings
                        );
                    idExit = _.difference(
                        startFilterStrings,
                        linkedFilterStrings
                    ).map((s) => startIdList[startIndexMap[s]]);
                    idEnter = _.difference(
                        endFilterStrings,
                        linkedFilterStrings
                    ).map((s) => endIdList[endIndexMap[s]]);
                    indexLink = startIndexMap[linkedFilterStrings[0]];
                    if (idExit.length > 0) {
                        indexExit = linkedFilterStrings.length;
                    }
                    if (idEnter.length > 0) {
                        indexEnter = 0;
                    }

                    // Use filters from example data scope
                    // TODO support for composites and groups
                    linkedBy = _.keys(startScopes[0].allFilters).reverse();

                    linkedFilterStrings.forEach((s) =>
                        idLinks.push({
                            start: [startIdList[startIndexMap[s]]],
                            end: [endIdList[endIndexMap[s]]],
                        })
                    );
                } else if (compare.dataTuples === 1) {
                    // Need a way to account for one to many and non-aligning counts
                    let startTupleStrings = startScopes.map((ds) => ds.tupleString),
                        endTupleStrings = endScopes.map((ds) => ds.tupleString),
                        startIndexMap = _.object(
                            startTupleStrings,
                            _.range(startTupleStrings.length)
                        ),
                        endIndexMap = _.object(
                            endTupleStrings,
                            _.range(endTupleStrings.length)
                        ),
                        linkedTupleStrings = _.intersection(
                            endTupleStrings,
                            endTupleStrings
                        );

                    idExit = _.difference(startTupleStrings, linkedTupleStrings).map(
                        (s) => startIdList[startIndexMap[s]]
                    );
                    idEnter = _.difference(endTupleStrings, linkedTupleStrings).map(
                        (s) => endIdList[endIndexMap[s]]
                    );

                    indexLink = startIndexMap[linkedTupleStrings[0]];
                    if (idExit.length > 0) {
                        indexExit = linkedTupleStrings.length;
                    }
                    if (idEnter.length > 0) {
                        indexEnter = 0;
                    }

                    linkedBy = ['Row_ID'];

                    linkedTupleStrings.forEach((s) =>
                        idLinks.push({
                            start: [startIdList[startIndexMap[s]]],
                            end: [endIdList[endIndexMap[s]]],
                        })
                    );
                }

                let propList = generatePropertyListFromDiffs(
                    idLinks.map(
                        (l) =>
                            this.startVis.template.propertyMap[startId][l.start[0]]
                    ),
                    idLinks.map(
                        (l) => this.endVis.template.propertyMap[endId][l.end[0]]
                    ),
                    startType
                );

                // Create new linked animation between objects
                this.linked.push({
                    objectMap: {
                        start: startId,
                        end: endId,
                        object: objectId,
                    },
                    type: 'object',
                    propList,
                    linkedBy,
                    idList: idLinks,
                    index: indexLink,
                    timing: new ObjectTiming(propList),
                    counts: [idLinks.length, idLinks.length],
                    effect: undefined,
                    isAnimating:
                        startType === 'Composite' ||
                        startType === 'Group' ||
                        propList.length > 0,
                });

                if (idEnter.length > 0) {
                    this.enter.push({
                        objectMap: {
                            start: null,
                            end: endId,
                            object: this.endVis.template.objectMap[endId],
                        },
                        type: 'object',
                        propList: [],
                        linkedBy: [],
                        idList: idEnter,
                        index: indexEnter,
                        timing: new ObjectTiming(['effect']),
                        counts: [0, idEnter.length],
                        effect: AnimationEffectMap.FADE_IN,
                        isAnimating: true,
                    });
                }

                if (idExit.length > 0) {
                    this.exit.push({
                        objectMap: {
                            start: startId,
                            end: null,
                            object: this.startVis.template.objectMap[startId],
                        },
                        type: 'object',
                        propList: [],
                        linkedBy: [],
                        idList: idExit,
                        index: indexExit,
                        timing: new ObjectTiming(['effect']),
                        counts: [idExit.length, 0],
                        effect: AnimationEffectMap.FADE_OUT,
                        isAnimating: true,
                    });
                }

                startLinked.push(startId);
                endLinked.push(endId);
            } else if (_.isString(endId) && compare.combineMatches > 0) {
                // If there are any shapes that can be combined/partition then create a merge animation

                let {combineMap, combineStart} = compare;

                let objectId = combineStart
                        ? this.endVis.template.objectMap[endId]
                        : this.startVis.template.objectMap[startId],
                    endIdList = this.endVis.template.idMap[endId],
                    endScopes = endIdList.map(
                        (id) => this.endVis.template.dataScopeMap[endId][id]
                    );

                let startTupleStrings = startScopes.map((ds) => ds.tupleString),
                    endTupleStrings = endScopes.map((ds) => ds.tupleString),
                    startIndexMap = _.object(
                        startTupleStrings,
                        _.range(startTupleStrings.length)
                    ),
                    endIndexMap = _.object(
                        endTupleStrings,
                        _.range(endTupleStrings.length)
                    );

                let idLinks = [],
                    idExit = [],
                    idEnter = [],
                    linkedBy = [],
                    startCount = 0,
                    endCount = 0;

                _.keys(combineMap).forEach((key, i) => {
                    let manyIds = combineMap[key].map(
                            (s) =>
                                (combineStart ? endIdList : startIdList)[
                                    (combineStart ? endIndexMap : startIndexMap)[s]
                                ]
                        ),
                        oneId = (combineStart ? startIdList : endIdList)[
                            (combineStart ? startIndexMap : endIndexMap)[key]
                        ];
                    startCount += combineStart ? 1 : manyIds.length;
                    endCount += combineStart ? manyIds.length : 1;
                    idLinks.push({
                        start: combineStart ? [oneId] : manyIds,
                        end: combineStart ? manyIds : [oneId],
                    });
                    // Using the first match as an example, find matching filters for linked by property
                    if (i === 0) {
                        let oneScope = combineStart
                                ? this.startVis.template.dataScopeMap[startId][oneId]
                                : this.endVis.template.dataScopeMap[endId][oneId],
                            manyScopes = combineStart
                                ? manyIds.map(
                                      (id) =>
                                          this.endVis.template.dataScopeMap[endId][
                                              id
                                          ]
                                  )
                                : manyIds.map(
                                      (id) =>
                                          this.startVis.template.dataScopeMap[
                                              startId
                                          ][id]
                                  ),
                            intersect = _.intersection(
                                _.pairs(oneScope.filters).map((p) => p.join('__')),
                                _.flatten(
                                    manyScopes.map(
                                        (s) =>
                                            _.pairs(s.filters).map((p) =>
                                                p.join('__')
                                            ),
                                        true
                                    )
                                )
                            );
                        linkedBy = intersect.map((p) => p.split('__')[0]).reverse();
                    }
                });

                let propList = generatePropertyListFromDiffs(
                    idLinks.map(
                        (l) =>
                            this.startVis.template.propertyMap[startId][l.start[0]]
                    ),
                    idLinks.map(
                        (l) => this.endVis.template.propertyMap[endId][l.end[0]]
                    ),
                    startType
                );

                this.linked.push({
                    objectMap: {
                        start: startId,
                        end: endId,
                        object: objectId,
                    },
                    type: 'object',
                    propList,
                    linkedBy,
                    idList: idLinks,
                    index: 0,
                    timing: new ObjectTiming(propList),
                    counts: [startCount, endCount],
                    effect: undefined,
                    isMerge: true,
                    isAnimating: true,
                });

                startLinked.push(startId);
                endLinked.push(endId);
            }
        }

        _.difference(startIds, startLinked).forEach((startId) => {
            let objectId = this.startVis.template.objectMap[startId],
                idList = this.startVis.template.idMap[startId];
            let animation = {
                objectMap: {
                    start: startId,
                    end: null,
                    object: objectId,
                },
                type: 'object',
                propList: [],
                idList,
                index: 0,
                timing: new ObjectTiming(['effect']),
                counts: [idList.length, 0],
                effect: AnimationEffectMap.FADE_OUT,
                isAnimating: true,
            };
            this.exit.push(animation);
        });
        _.difference(endIds, endLinked).forEach((endId) => {
            let objectId = this.endVis.template.objectMap[endId],
                idList = this.endVis.template.idMap[endId];
            let animation = {
                objectMap: {
                    start: null,
                    end: endId,
                    object: objectId,
                },
                type: 'object',
                propList: [],
                idList,
                index: 0,
                timing: new ObjectTiming(['effect']),
                counts: [0, idList.length],
                effect: AnimationEffectMap.FADE_IN,
                isAnimating: true,
            };
            this.enter.push(animation);
        });

        let startDecorationKeys = _.flatten(
            _.keys(this.startVis.template.decorationMap).map((classId) => {
                let objectId = classId;
                if (startLinked.indexOf(classId) >= 0) {
                    objectId = _.find(
                        this.linked,
                        (l) => l.objectMap.start === classId
                    ).objectMap.object;
                } else {
                    objectId = _.find(
                        this.exit,
                        (l) => l.objectMap.start === classId
                    ).objectMap.object;
                }
                return _.keys(this.startVis.template.decorationMap[classId]).map(
                    (visualField) => {
                        let spec = this.startVis.template.decorationMap[classId][
                            visualField
                        ][0];
                        return `${objectId}__${visualField}__${spec.type}`;
                    }
                );
            })
        );

        let endDecorationKeys = _.flatten(
            _.keys(this.endVis.template.decorationMap).map((classId) => {
                let objectId = classId;
                if (endLinked.indexOf(classId) >= 0) {
                    objectId = _.find(
                        this.linked,
                        (l) => l.objectMap.end === classId
                    ).objectMap.object;
                } else {
                    objectId = _.find(this.enter, (l) => l.objectMap.end === classId)
                        .objectMap.object;
                }
                return _.keys(this.endVis.template.decorationMap[classId]).map(
                    (visualField) => {
                        let spec = this.endVis.template.decorationMap[classId][
                            visualField
                        ][0];
                        return `${objectId}__${visualField}__${spec.type}`;
                    }
                );
            })
        );

        const linkedObjects = _.filter(this.linked, (l) => l.type === 'object'),
            exitObjects = _.filter(this.exit, (l) => l.type === 'object'),
            enterObjects = _.filter(this.enter, (l) => l.type === 'object');

        _.intersection(startDecorationKeys, endDecorationKeys).forEach((l) => {
            let split = l.split('__'),
                objectId = split[0],
                visualField = split[1];
            let linkFound = _.find(
                linkedObjects,
                (l) => l.objectMap.object === objectId
            );
            let startClassId = linkFound.objectMap.start;
            let endClassId = linkFound.objectMap.end;
            let startSpec = this.startVis.template.decorationMap[startClassId][
                    visualField
                ],
                endSpec = this.endVis.template.decorationMap[endClassId][
                    visualField
                ];
            let animation = {
                decorationMap: {
                    start: startSpec,
                    end: endSpec,
                    decoration: startSpec[0].decorationId,
                },
                type: 'decoration',
                timing: new DecorationTiming(),
                counts: [1, 1],
                isAnimating: areDecorationsAnimating(startSpec[0], endSpec[0]),
            };
            this.linked.push(animation);
        });

        _.difference(startDecorationKeys, endDecorationKeys).forEach((e) => {
            let split = e.split('__'),
                objectId = split[0],
                visualField = split[1];
            let startClassId;
            let linkFound = _.find(
                linkedObjects,
                (l) => l.objectMap.object === objectId
            );
            if (!linkFound) {
                startClassId = _.find(
                    exitObjects,
                    (l) => l.objectMap.object === objectId
                ).objectMap.start;
            } else {
                startClassId = linkFound.objectMap.start;
            }
            let spec = this.startVis.template.decorationMap[startClassId][
                visualField
            ];
            let animation = {
                decorationMap: {
                    start: spec,
                    end: null,
                    decoration: spec[0].decorationId,
                },
                type: 'decoration',
                timing: new DecorationTiming(),
                counts: [1, 0],
                isAnimating: true,
            };
            this.exit.push(animation);
        });

        _.difference(endDecorationKeys, startDecorationKeys).forEach((e) => {
            let split = e.split('__'),
                objectId = split[0],
                visualField = split[1];
            let endClassId;
            let linkFound = _.find(
                linkedObjects,
                (l) => l.objectMap.object === objectId
            );
            if (!linkFound) {
                endClassId = _.find(
                    enterObjects,
                    (l) => l.objectMap.object === objectId
                ).objectMap.end;
            } else {
                endClassId = linkFound.objectMap.end;
            }
            let spec = this.endVis.template.decorationMap[endClassId][visualField];
            let animation = {
                decorationMap: {
                    start: null,
                    end: spec,
                    decoration: spec[0].decorationId,
                },
                type: 'decoration',
                timing: new DecorationTiming(),
                counts: [0, 1],
                isAnimating: true,
            };
            this.enter.push(animation);
        });

        this._linkTimingForParents('linked');
        this._linkTimingForParents('enter');
        this._linkTimingForParents('exit');
    }

    private _linkTimingForParents(linkType: string) {
        let which = linkType === 'enter' ? 'end' : 'start',
            template =
                linkType === 'enter' ? this.endVis.template : this.startVis.template,
            objects = _.filter(this[linkType], (anim) => anim.type === 'object');
        objects.forEach((anim) => {
            if (template.parentMap.hasOwnProperty(anim.objectMap[which])) {
                let parentAnim = _.find(
                    objects,
                    (lo) =>
                        lo.objectMap[which] ===
                        template.parentMap[anim.objectMap[which]]
                );
                if (parentAnim) {
                    anim.timing.setParent(parentAnim.timing);
                }
            }
        });
    }

    private _createObjectTree(linkType: string) {
        let roots = [],
            nodeMap = {},
            objects = this[linkType].filter((anim) => anim.type === 'object'),
            which = linkType === 'enter' ? 'end' : 'start',
            template =
                linkType === 'enter' ? this.endVis.template : this.startVis.template;

        objects.forEach((anim) => {
            nodeMap[anim.objectMap[which]] = {anim, children: []};
        });

        for (let i = 0; i < objects.length; i++) {
            let anim = objects[i];
            if (
                template.parentMap[anim.objectMap[which]] &&
                nodeMap[template.parentMap[anim.objectMap[which]]]
            ) {
                nodeMap[template.parentMap[anim.objectMap[which]]].children.push(
                    nodeMap[anim.objectMap[which]]
                );
            } else {
                roots.push(nodeMap[anim.objectMap[which]]);
            }
        }
        return roots;
    }

    private _createObjectLayerDataWithTree(roots: any[], linkType: string): any {
        return roots.map((r) => {
            let {anim, children} = r;
            let template =
                    linkType === 'enter'
                        ? this.endVis.template
                        : this.startVis.template,
                which = linkType === 'enter' ? 'end' : 'start',
                props = template.propertyMap[anim.objectMap[which]],
                ds = template.dataScopeMap[anim.objectMap[which]],
                ids = template.idMap[anim.objectMap[which]];
            let type =
                    props[ids[0]].type !== 'Composite'
                        ? props[ids[0]].type
                        : props[ids[0]].layout.type === 'Stack Layout'
                        ? 'Partition'
                        : 'Repeat',
                peerField = _.keys(ds[ids[0]].filters)[0],
                datasetId = ds[ids[0]].datasetId,
                dataset = getDatasetById(store.getState(), datasetId),
                dataColumns = FILTER_NON_UNIFORM_COLUMNS(dataset, ids, ds),
                visualFields = generateVisualFields(type),
                childNodes = this._createObjectLayerDataWithTree(children, linkType);
            return {
                id: anim.objectMap.object,
                map: anim.objectMap,
                type: 'object',
                label: `${type}: by ${peerField}`,
                icon: type.toUpperCase(),
                counts: anim.counts,
                parentScale: anim.timing.scale,
                timing: anim.timing,
                linkType,
                isAnimating: anim.isAnimating,
                isSelected: false,
                linkedBy: anim.linkedBy,
                idList: anim.idList,
                properties: anim.propList.map((p) => ({
                    name: p,
                    startType: 'data',
                    endType: 'data',
                    startKey: anim.timing.getPropTimes(p).start,
                    endKey: anim.timing.getPropTimes(p).end,
                })),
                effect: anim.effect,
                childNodes,
                childExpanded: childNodes.length > 0,
                peers: {
                    peerField: peerField,
                    sequenceOptions: CREATE_SEQUENCE_OPTIONS(dataColumns, []),
                    scale: anim.timing.peerScale,
                    groups: anim.timing.peerGroups,
                },
            };
        });
    }

    private _createObjectLayerData(
        anim: any,
        childAnims: any[],
        linkType: string
    ): any {
        let template =
                linkType === 'enter' ? this.endVis.template : this.startVis.template,
            which = linkType === 'enter' ? 'end' : 'start',
            props = template.propertyMap[anim.objectMap[which]],
            ds = template.dataScopeMap[anim.objectMap[which]],
            ids = template.idMap[anim.objectMap[which]],
            type =
                props[ids[0]].type !== 'Composite'
                    ? props[ids[0]].type
                    : props[ids[0]].layout.type === 'Stack Layout'
                    ? 'Partition'
                    : 'Repeat',
            peerField = _.keys(ds[ids[0]].filters)[0],
            datasetId = ds[ids[0]].datasetId,
            dataset = getDatasetById(store.getState(), datasetId),
            dataColumns = FILTER_NON_UNIFORM_COLUMNS(dataset, ids, ds),
            visualFields = generateVisualFields(type);
        return {
            id: anim.objectMap.object,
            map: anim.objectMap,
            type: 'object',
            label: `${type}: by ${peerField}`,
            icon: type.toUpperCase(),
            counts: anim.counts,
            parentScale: anim.timing.scale,
            timing: anim.timing,
            linkType,
            isAnimating: anim.isAnimating,
            isSelected: false,
            linkedBy: anim.linkedBy,
            idList: anim.idList,
            properties: anim.propList.map((p) => ({
                name: p,
                startType: 'data',
                endType: 'data',
                startKey: anim.timing.getPropTimes(p).start,
                endKey: anim.timing.getPropTimes(p).end,
            })),
            effect: anim.effect,
            childNodes: [],
            peers: {
                peerField: peerField,
                sequenceOptions: CREATE_SEQUENCE_OPTIONS(dataColumns, []),
                scale: anim.timing.peerScale,
                groups: anim.timing.peerGroups,
            },
        };
    }
}

const REG_EX_TUPLES = /{([^}]+)}/;

const COMPARE_PROPS = (
    props: any[],
    scopes: DataScope[],
    otherProps: any[],
    otherScopes: DataScope[]
): any => {
    let maxLength = Math.max(props.length, otherProps.length),
        minLength = Math.min(props.length, otherProps.length),
        count = Math.abs(props.length - otherProps.length),
        type = props[0].type === otherProps[0].type ? 1 : 0,
        classId = props[0].classID === otherProps[0].classID ? 1 : 0,
        compId = _.intersection(
            props.map((p) => p.compID),
            otherProps.map((p) => p.compID)
        ).length,
        dataScope = _.intersection(
            scopes.map((s) => s.filterString),
            otherScopes.map((s) => s.filterString)
        ).length,
        dataTuples = _.intersection(
            scopes.map((s) => s.tupleString),
            otherScopes.map((s) => s.tupleString)
        ).length,
        visualFields = 0;
    count = 1 - count / (count <= minLength ? minLength : maxLength);
    compId = compId / (compId <= minLength ? minLength : maxLength);
    dataScope = dataScope / (dataScope <= minLength ? minLength : maxLength);
    dataTuples = dataTuples / (dataTuples <= minLength ? minLength : maxLength);
    // Are the shapes that match to one shape? Based on scopes? Or based on data tuples
    // TODO handle different datasets?
    let combineMap = {},
        combineMatches = 0,
        combineMisses = 0;

    let tupleDensity =
            _.reduce(scopes, (memo, s) => memo + s.tuples.length, 0) / scopes.length,
        otherTupleDensity =
            _.reduce(otherScopes, (memo, s) => memo + s.tuples.length, 0) /
            otherScopes.length;

    let combineStart = otherTupleDensity < tupleDensity,
        oneScopes = combineStart ? scopes : otherScopes,
        manyScopes = combineStart ? otherScopes : scopes;

    oneScopes.forEach((s) => {
        let one = s.tuples.map((t) => t['Row_ID']);
        let matches = [];
        manyScopes.forEach((os) => {
            let many = os.tuples.map((t) => t['Row_ID']);
            let diff = _.difference(many, one);
            if (diff.length === 0) {
                // This is a match
                matches.push(os.tupleString);
            }
        });
        combineMap[s.tupleString] = matches;
        // Test if a complete match was made, only count if complete tuple overlap was made
        if (
            s.tuples.length -
                _.flatten(
                    matches.map((m) => {
                        let match = m.match(REG_EX_TUPLES);
                        if (match) {
                            return match[1].split('|');
                        } else {
                            return [];
                        }
                    })
                ).length ===
            0
        ) {
            combineMatches += 1;
        } else {
            combineMisses += 1;
        }
    });

    return {
        type,
        count,
        dataScope,
        dataTuples,
        classId,
        compId,
        visualFields,
        combineMap,
        combineMatches,
        combineMisses,
        combineStart,
    };
    // TODO Compute one to many field - based this off of collections?
};

// only do same shapes
// 0.75 for same number, 0.5 for same filter (e.g. repeat by?), 0.5 for same tuples, 0.75 for same classId,
// 0.5 for similarity of props?

// Need a way to say that the filters match up per shape
// Need a way to say that the filters match up but not by shape
// Same thing for tuples - should there be some type of tree structure there?
const COMPARE_SUM = (compare: any): number => {
    return (
        compare.count * 3 +
        compare.dataScope * 2 +
        compare.dataTuples * 2 +
        compare.classId * 1.5 +
        compare.compId * 1.5
    );
};

const FILTER_NON_UNIFORM_COLUMNS = (dataset: Dataset, ids: any[], ds: any): any => {
    let nonUniformColumns = dataset.summary
        .filter((s) => s.type === 'string' || s.type === 'boolean')
        .filter((s) => {
            for (let i = 0; i < ids.length; i++) {
                let u = _.uniq(ds[ids[i]].tuples.map((t) => t[s.field]));
                // Not unique so return early
                if (u.length > 1) {
                    return true;
                }
            }
            // Got through all the checks with uniform datascopes for this field
            return false;
        });
    return _.difference(dataset.summary, nonUniformColumns);
};

const CREATE_SEQUENCE_OPTIONS = (
    dataOptions: any[],
    visualOptions: any[]
): any[] => {
    return [
        {
            title: 'All at once',
            description: 'All shapes animate at the same time.',
            type: 'all',
            previewImage: './assets/icons/sequence_preview_all.png',
            iconImages: [],
            dataOptions: [],
            visualOptions: [],
        },
        {
            title: 'Stagger',
            description: 'Shapes start animating one after another.',
            type: 'stagger',
            previewImage: './assets/icons/sequence_preview_stagger.png',
            iconImages: [
                './assets/icons/sequence_fxn_stagger_linear.png',
                './assets/icons/sequence_fxn_stagger_grouped.png',
            ],
            dataOptions,
            visualOptions,
        },
        {
            title: 'Speed',
            description: 'Vary speed (duration) of shapes.',
            type: 'speed',
            previewImage: './assets/icons/sequence_preview_speed.png',
            iconImages: [
                './assets/icons/sequence_fxn_speed_linear.png',
                './assets/icons/sequence_fxn_speed_grouped.png',
            ],
            dataOptions,
            visualOptions,
        },
    ];
};
