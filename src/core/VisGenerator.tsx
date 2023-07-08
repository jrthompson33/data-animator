import React from 'react';
import ReactDOM from 'react-dom';

// Vis Instance holds the data
// Computes against a VisTemplate to get all of the property values
// These should be able to compute on the fly? Don't want to store all of the data?
import Dataset from '../data/Dataset';
import {VisTemplate} from './VisTemplate';

export class VisGenerator {
    constructor(dataScopeMap, idMap, template) {
        this.dataScopeMap = dataScopeMap;
        this.idMap = idMap;
        this.template = template;
    }

    public dataScopeMap: any;
    public idMap: any;
    public template: VisTemplate;
    public previewData: any;
    public decorationData: any;
    public activeProperties: any;
    public dimension = {w: 260, h: 200};

    get background(): any {
        return this.template.background;
    }
}
