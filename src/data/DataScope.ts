import _ from 'underscore';
import {
    getFilterStringFromScope,
    getTuplesFromScope,
    getTupleStringFromScope,
} from './data_utils';
/**
 * The scope of the data for a particular scene. DataScopes can be the same across multiple scenes, or can change
 * within scenes (e.g. when a data filter is applied).
 */

export default class DataScope {
    /**
     * @param filters {Object} enumerated dictionary of local filters for this scope
     * @param inheritedFilters {Object} enumerated dictionary of parent/inherited filters for this scope
     * @param datasetId {string} id of {Dataset}
     */
    constructor(filters, inheritedFilters, datasetId) {
        this.filters = filters;
        this.inheritedFilters = inheritedFilters;
        this.datasetId = datasetId;
        this.resetTuples();
        this.resetStrings();
    }

    public filters: any;
    public inheritedFilters: any;
    public datasetId: string;
    public tuples: any[];
    public filterString: string;
    public tupleString: string;

    public resetTuples() {
        this.tuples = getTuplesFromScope(this);
    }

    public resetStrings() {
        this.filterString = getFilterStringFromScope(this);
        this.tupleString = getTupleStringFromScope(this);
    }

    get allFilters() {
        return _.extend(this.filters, this.inheritedFilters);
    }

    /**
     * @return {Object} cloned JSON representation of this DataScope (includes filters and inheritedFilters)
     */
    toJSON() {
        return {
            filters: this.filters,
            inheritedFilters: this.inheritedFilters,
        };
    }

    /**
     * Copy and inherit all filters from the provided {@link DataScope}
     * @param dataScope {DataScope} the scope to inherit filters from
     */
    inheritFrom(dataScope: DataScope) {
        this.inheritedFilters = _.extend(
            this.inheritedFilters,
            dataScope.allFilters
        );
        this.resetTuples();
        this.resetStrings();
    }
}
