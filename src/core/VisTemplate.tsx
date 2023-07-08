import * as THREE from 'three';
import * as d3 from 'd3';

import _ from 'underscore';

import {getElementCounter} from '../utils/counter';
import {computeBoundsFromProps} from '../graphics/graphic_utils';

export class VisTemplate {
    constructor(
        objectMap: any,
        propertyMap: any,
        dataScopeMap: any,
        idMap: any,
        parentMap: any,
        bindingMap: any,
        decorationMap: any,
        alignments: any,
        background: any
    ) {
        this.id = getElementCounter(this.type);
        this.classId = `${this.type}-${this.id}`;
        this.name = `${this.type} ${this.id}`;

        this.objectMap = objectMap;
        this.propertyMap = propertyMap;
        this.dataScopeMap = dataScopeMap;
        this.idMap = idMap;
        this.parentMap = parentMap;

        this.bindingMap = bindingMap;
        this.decorationMap = decorationMap;
        this.alignments = alignments;

        this.background = background;
        this.bounds = this.getBounds();
        this.center = [
            (this.bounds.left + this.bounds.right) / 2,
            (this.bounds.top + this.bounds.bottom) / 2,
        ];
    }

    public type: string = 'Template';
    public id: number;
    public classId: string;
    public name: string;
    public background: any;
    public alignments: any;
    public decorationMap: any;
    public bindingMap: any;
    public objectMap: any;
    public propertyMap: any;
    public dataScopeMap: any;
    public idMap: any;
    public parentMap: any;
    public bounds: any;
    public center: any;

    protected getBounds(): any {
        let bounds = undefined;
        _.keys(this.idMap).forEach((id) => {
            bounds = computeBoundsFromProps(_.values(this.propertyMap[id]), bounds);
        });
        return bounds;
    }

    protected updateBindings() {
        //    Update bindings with information needed, e.g. what is the initial position of all of the shapes
    }

    protected updateAlignments() {
        // Update alignments based on info from Composites in the scene
    }
}
