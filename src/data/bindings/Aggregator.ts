import * as d3 from 'd3';

export const Aggregator = {
    SUM: d3.sum,
    MEAN: d3.mean,
    MEDIAN: d3.median,
    MAX: d3.max,
    MIN: d3.min,
    COUNT: (array: any[]) => array.length,
};
