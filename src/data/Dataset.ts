import * as _ from 'underscore';
import {matchFilters} from './data_utils';

export default class Dataset {
    constructor(table, columns, summary, datasetName, datasetId) {
        this.table = table;
        this.columns = columns;
        this.summary = summary;
        this.datasetName = datasetName;
        this.datasetId = datasetId;
    }

    public table;
    public columns;
    public summary;
    public datasetName: string;
    public datasetId: string;

    /**
     *
     * @param filters
     * @return {Array}
     */
    getTuples(filters) {
        let tuples = [];
        for (let tuple of this.table) {
            if (matchFilters(tuple, filters)) {
                tuples.push(tuple);
            }
        }
        return tuples;
    }

    getInfo(colName) {
        let index = this.columns.indexOf(colName);
        return this.summary[index];
    }

    /**
     * Create a new {Dataset} object from JSON
     * @param json {Object} JSON loaded object for the dataset
     * @param datasetId {string} identifier for the dataset
     * @param datasetName {string} name of dataset file
     * @return {Dataset} created object from JSON data
     */
    static fromJSON(json, datasetId, datasetName) {
        // Check if valid json object
        if (
            json.hasOwnProperty('table') &&
            json.hasOwnProperty('summary') &&
            json.hasOwnProperty('columns')
        ) {
            return new Dataset(
                json.table,
                json.columns,
                json.summary,
                datasetName,
                datasetId
            );
        } else {
            console.error(json);
            throw new Error('Error loading dataset. Missing attributes.');
        }
    }
}
