import _ from 'underscore';
import * as d3 from 'd3';

import store from '../store';

import Dataset from './Dataset';
import {ADD_DATASET} from '../actions/action_types';
import DataScope from './DataScope';
import {getDatasetById, getDatasets} from '../selectors';

export const loadDatasetFromJSON = (json) => {
    let datasetName = json.hasOwnProperty('datasetName')
        ? json['datasetName']
        : 'Data File';
    let i = 0;
    let datasets = _.values(getDatasets(store.getState()));
    // Check to see if any of the datasets have the same name
    for (let d = 0; d < datasets.length; d++) {
        let dataset = datasets[d],
            datasetId = dataset.datasetId;
        if (datasetId.startsWith(datasetName)) {
            if (
                !_.isEqual(json['columns'], dataset.columns) ||
                !_.isEqual(json['table'], dataset.table)
            ) {
                // Different dataset, but same name so need to enumerate name suffix
                i++;
            } else {
                // Is the same dataset so break the for loop and return that id name
                return datasetId;
            }
        }
    }
    // Did not return early, this is a new dataset
    let newId = datasetName + '-' + i;
    try {
        store.dispatch({
            type: ADD_DATASET,
            id: newId,
            payload: Dataset.fromJSON(json, newId, datasetName),
        });
    } catch (e) {
        console.error(e.message);
    }

    return newId;
};

/**
 *
 * @param tuple
 * @param filters
 * @return {boolean}
 */
export const matchFilters = (tuple, filters) => {
    let ret = true;
    for (let columnName in filters) {
        if (Array.isArray(filters[columnName])) {
            for (let filterValue of filters[columnName]) {
                if (tuple[columnName] === filterValue) {
                    ret = true;
                } else {
                    // Return early if any columns don't match filter
                    return false;
                }
            }
            return ret;
        } else {
            if (tuple[columnName] === filters[columnName]) {
                ret = true;
            } else {
                // Return early if any columns don't match filter
                return false;
            }
        }
    }
    return ret;
};

export const getTuplesFromScope = (scope: DataScope): any[] => {
    let dataset = getDatasetById(store.getState(), scope.datasetId);
    return dataset.getTuples(scope.allFilters);
};

export const getTuplesFromFilters = (filters, datasetId): any[] => {
    let dataset = getDatasetById(store.getState(), datasetId);
    return dataset.getTuples(filters);
};

export const getClassFromFilters = (filters, datasetId) => {
    let tuples = getTuplesFromFilters(filters, datasetId).map(
        (d) => 'Row_ID=' + d['Row_ID']
    );

    let orderedTuples = tuples.sort();
    return 'DataSet=' + datasetId + orderedTuples.join(';');
};

export const getFilterStringFromScope = (scope: DataScope): string => {
    let orderedFilters = _.keys(scope.allFilters)
        .sort()
        .map((k) => `${k}=[${scope.allFilters[k]}]`)
        .join('|');
    return `filters={${orderedFilters}}`;
};

export const getTupleStringFromScope = (scope: DataScope): string => {
    let orderedFilters = scope.tuples
        .map((t) => t['Row_ID'])
        .sort()
        .map((id) => `$Row_ID=[${id}]`)
        .join('|');
    return `data=[${scope.datasetId}] tuples={${orderedFilters}}`;
};

export const getPeerTermFromScope = (scope: DataScope) => {
    return Object.keys(scope.inheritedFilters)
        .concat(Object.keys(scope.filters))
        .join(' | ');
};

export const getHumanReadableFieldInfo = (info: any): string => {
    return FIELD_INFO_MAP[info.type](info);
};

// Format to something readable with scientific, or float based on how big absolute number is
const SCIENCE_FORMAT = d3.format('~s'),
    FLOAT_FORMAT = d3.format('~f');
export const formatNumericalTick = (t: number): string => {
    return Math.abs(t) > 1000 || Math.abs(t) < 0.001
        ? SCIENCE_FORMAT(t)
        : FLOAT_FORMAT(t);
};

export const DATE_FORMAT = d3.timeFormat('%B %d, %Y'),
    NUMBER_FORMAT = d3.format('~g');

const FIELD_INFO_MAP = {
    date: (info) =>
        `${DATE_FORMAT(new Date(info.min))} - ${DATE_FORMAT(new Date(info.max))}`,
    string: (info) => `${info.distinct} value${info.distinct > 1 ? 's' : ''}`,
    integer: (info) => `${info.min} - ${info.max}`,
    number: (info) => `${NUMBER_FORMAT(info.min)} - ${NUMBER_FORMAT(info.max)}`,
    boolean: (info) => `${info.distinct} value${info.distinct > 1 ? 's' : ''}`,
};

const NUMBER_AGGR_MAP = {
    MEAN: d3.mean,
    SUM: d3.sum,
    MEDIAN: d3.median,
    MAX: d3.max,
    MIN: d3.min,
    // COUNT: d3.count,
};

export const computeAggregate = (array: number[], aggr: string): number => {
    return NUMBER_AGGR_MAP[aggr](array);
};

export const AGGREGATE_LIST = _.keys(NUMBER_AGGR_MAP);

export const ORDER_LIST = ['A→Z', 'DATA SRC'];

export const computeOrderedValueArray = (
    array: any[],
    info: any,
    order: string,
    reverse: boolean
): string[] => {
    switch (order) {
        case 'A→Z':
            return reverse
                ? array.sort(ASCENDING_LOWER_CASE)
                : array.sort(DESCENDING_LOWER_CASE);
        case 'DATA SRC':
            let uniqueOrder = {};
            (reverse ? _.keys(info.unique).reverse() : _.keys(info.unique)).forEach(
                (u, i) => {
                    uniqueOrder[u] = i;
                }
            );
            return array.sort((a, b) => uniqueOrder[a.value] - uniqueOrder[b.value]);
    }
};

const ASCENDING_LOWER_CASE = (a: any, b: any) =>
    d3.ascending(a.value.toLowerCase(), b.value.toLowerCase());
const DESCENDING_LOWER_CASE = (a: any, b: any) =>
    d3.descending(a.value.toLowerCase(), b.value.toLowerCase());

export const computeGrouping = (
    colName: string,
    info: any,
    aggr: string,
    reverse: boolean,
    bindColumn: string,
    dataScopes: DataScope[]
): any => {
    let grouping = {groups: []};

    dataScopes.forEach((ds) => {
        // TODO need to prevent from grouping on strings / dates that are not all the same?
        if (ds.tuples.length > 0) {
            let value = ds.tuples[0][colName];
            if (info.type === 'integer' || info.type === 'number') {
                value = computeAggregate(
                    ds.tuples.map((d) => d[colName]),
                    aggr
                );
            }
            grouping.groups.push({
                value,
                count: ds.tuples.length,
                bindValue: ds.filters[bindColumn],
            });
        }
    });

    if (info.type === 'integer' || info.type === 'number' || info.type === 'date') {
        grouping['min'] = d3.min(grouping.groups, (g) => g.value);
        grouping['max'] = d3.max(grouping.groups, (g) => g.value);
    }

    if (info.type === 'string') {
        grouping.groups = computeOrderedValueArray(
            grouping.groups,
            info,
            aggr,
            reverse
        );
    } else {
        grouping.groups = reverse
            ? grouping.groups.sort((a, b) => d3.descending(a.value, b.value))
            : grouping.groups.sort((a, b) => d3.ascending(a.value, b.value));
    }

    grouping['unique'] = d3
        .nest()
        .key((g) => g['value'])
        // @ts-ignore
        .rollup((l) => l.length)
        .entries(grouping.groups);
    grouping['bind'] = d3
        .nest()
        .key((g) => g['bindValue'])
        // @ts-ignore
        .rollup((l) => l[0]['value'])
        .object(grouping.groups);
    return grouping;
};
