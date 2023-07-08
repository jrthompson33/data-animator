import * as d3 from 'd3';
import _ from 'underscore';
import DataScope from '../data/DataScope';
import ITiming from './ITiming';
import {EasingOption, EasingOptionList} from './EasingOption';
import Dataset from '../data/Dataset';
import {
    computeAggregate,
    computeGrouping,
    DATE_FORMAT,
    NUMBER_FORMAT,
} from '../data/data_utils';

export default class ObjectTiming implements ITiming {
    constructor(properties: string[]) {
        this._setSequencingToDefault();
        properties.forEach((p) => this.setPropTimes(p, 0, 1));
        this._updatePeerGroups();
    }

    public scale = d3.scaleLinear().clamp(true);
    public parent: ObjectTiming = undefined;
    // Progress scale is unused b/c timing is handled by peer timing, keeping to also support decorations
    public progressScale = d3.scaleLinear().clamp(true);

    public easing: EasingOption = EasingOptionList[0];

    public peerGroups: any[];

    // property scales can be uniforms?
    private _propTimes = {};

    private _listeners = [];
    public startRaw = 0;
    public endRaw = 1;

    private _sequencing;

    private _rawScale = d3.scaleLinear().clamp(true);
    private _peerScale = d3.scaleLinear().clamp(true);

    private _setSequencingToDefault() {
        this._peerScale.range([0, 1]);
        this._sequencing = {
            scale: undefined,
            field: undefined,
            duration: 1,
            delay: 0,
            type: 'all',
            subType: undefined,
            aggr: undefined,
            info: undefined,
            dataScopes: undefined,
            grouping: undefined,
            isReverse: false,
        };
    }

    public setParent(parent: ObjectTiming) {
        this.parent = parent;

        let listener = () => {
            if (this.parent.sequenceType === 'all') {
                this.scale.range([this.parent.startScaled, this.parent.endScaled]);
            } else {
                let parentDiff = this.parent.endRaw - this.parent.startRaw;
                this.scale.range([
                    this.parent.startScaled,
                    this.parent.scale(
                        this.parent.sequenceDefaultDuration * parentDiff +
                            this.parent.startRaw
                    ),
                ]);
            }

            // If this has listeners, then kick them off as well
            this._listeners.forEach((l) => l());
        };
        this.parent.addListener(listener);
    }

    public setPropTimes(property: string, start: number, end: number) {
        if (this._propTimes.hasOwnProperty(property)) {
            this._propTimes[property].start = start;
            this._propTimes[property].end = end;
        } else {
            this._propTimes[property] = {start, end};
        }
    }

    public setPropStart(property: string, start: number) {
        if (this._propTimes.hasOwnProperty(property)) {
            this._propTimes[property].start = start;
        } else {
            this._propTimes[property] = {start, end: 1};
        }
    }

    public setPropEnd(property: string, end: number) {
        if (this._propTimes.hasOwnProperty(property)) {
            this._propTimes[property].end = end;
        } else {
            this._propTimes[property] = {start: 0, end};
        }
    }

    public getPropTimes(property: string) {
        return this._propTimes[property];
    }

    public getPropTimeMap() {
        return this._propTimes;
    }

    public createSequencing(
        type: string,
        field: string,
        bindColumn: string,
        dataSet: Dataset,
        dataScopes: DataScope[]
    ) {
        if (type === 'all') {
            this._setSequencingToDefault();
        } else {
            let info = dataSet.getInfo(field),
                grouping = computeGrouping(
                    field,
                    info,
                    info.type === 'string' ? 'DATA SRC' : 'MEAN',
                    false,
                    bindColumn,
                    dataScopes
                );
            this._sequencing.field = field;
            this._sequencing.type = type;
            this._sequencing.aggr = info.type === 'string' ? 'DATA SRC' : 'MEAN';
            this._sequencing.subType = 'linear';
            this._sequencing.isReverse = false;
            this._sequencing.info = info;
            this._sequencing.bindColumn = bindColumn;
            this._sequencing.grouping = grouping;
            this._sequencing.dataScopes = dataScopes;
            switch (info.type) {
                case 'number':
                    this._sequencing.scale = d3
                        .scaleLinear()
                        .domain([grouping.min, grouping.max])
                        .clamp(true);
                    break;
                case 'string':
                    this._sequencing.scale = d3
                        .scalePoint()
                        .domain(grouping.unique.map((u) => u.key));
                    break;
                case 'integer':
                    this._sequencing.scale = d3
                        .scaleLinear()
                        .domain([grouping.min, grouping.max])
                        .clamp(true);
                    break;
                case 'date':
                    this._sequencing.scale = d3
                        .scaleTime()
                        .domain([new Date(grouping.min), new Date(grouping.max)])
                        .clamp(true);
                    break;
                default:
                    break;
            }

            let defaultDuration = Math.max(0.3, 1 / grouping.unique.length);

            if (type === 'stagger') {
                this._sequencing.scale.range([0, 1 - defaultDuration]);
                this._sequencing.duration = defaultDuration;
                this._peerScale.range([0, defaultDuration]);
            } else if (type === 'speed') {
                this._sequencing.scale.range([defaultDuration, 1]);
                this._sequencing.delay = 0;
                this._peerScale.range([0, defaultDuration]);
            }
        }
        this._updatePeerGroups();
        this._listeners.forEach((l) => l());
    }

    public getDelay(dataScope: DataScope, props: any) {
        switch (this._sequencing.type) {
            case 'all':
                return this._sequencing.delay;
            case 'stagger':
                return this._sequencing.scale(this._getPeerGroupValue(dataScope));
            case 'speed':
                return this._sequencing.delay;
        }
    }

    public getDuration(dataScope: DataScope, props: any) {
        switch (this._sequencing.type) {
            case 'all':
                return this._sequencing.duration;
            case 'stagger':
                return this._sequencing.duration;
            case 'speed':
                return this._sequencing.scale(this._getPeerGroupValue(dataScope));
        }
    }

    public getPeer(dataScope: DataScope, props: any) {
        let parentPeer = this.parent
            ? this.parent.getPeer(dataScope, props)
            : undefined;
        let delay = this.getDelay(dataScope, props),
            duration = this.getDuration(dataScope, props),
            scaledDelay = this._rawScale(delay),
            scaledDuration = this._rawScale(delay + duration) - scaledDelay;

        if (parentPeer) {
            return [
                scaledDelay * parentPeer[1] + parentPeer[0],
                scaledDuration * parentPeer[1],
            ];
        } else {
            return [scaledDelay, scaledDuration];
        }
    }

    public setStartRaw(startRaw: number) {
        this.startRaw = startRaw;
        this._rawScale.range([this.startRaw, this.endRaw]);
        this._listeners.forEach((l) => l());
    }

    public setEndRaw(endRaw: number) {
        this.endRaw = endRaw;
        this._rawScale.range([this.startRaw, this.endRaw]);
        this._listeners.forEach((l) => l());
    }

    public setDefaultDuration(defaultDuration: number) {
        switch (this._sequencing.type) {
            case 'all':
                break;
            case 'stagger':
                this._sequencing.scale.range([0, 1 - defaultDuration]);
                this._sequencing.duration = defaultDuration;
                this._peerScale.range([0, defaultDuration]);
                break;
            case 'speed':
                this._sequencing.scale.range([defaultDuration, 1]);
                this._peerScale.range([0, defaultDuration]);
                break;
        }
        this._updatePeerGroups();
        this._listeners.forEach((l) => l());
    }

    public setAggregation(aggr: string) {
        this._sequencing.aggr = aggr;
        this._sequencing.grouping = computeGrouping(
            this._sequencing.field,
            this._sequencing.info,
            aggr,
            this._sequencing.isReverse,
            this._sequencing.bindColumn,
            this._sequencing.dataScopes
        );
        switch (this._sequencing.info.type) {
            case 'number':
            case 'integer':
                let domain = [
                    this._sequencing.grouping.min,
                    this._sequencing.grouping.max,
                ];
                if (this._sequencing.isReverse) {
                    domain = domain.reverse();
                }
                this._sequencing.scale.domain(domain);
                break;
            case 'date':
                domain = [
                    new Date(this._sequencing.grouping.min),
                    new Date(this._sequencing.grouping.max),
                ];
                if (this._sequencing.isReverse) {
                    domain = domain.reverse();
                }
                this._sequencing.scale.domain(domain);
                break;
            case 'string':
            case 'boolean':
                this._sequencing.scale.domain(
                    this._sequencing.grouping.unique.map((u) => u.key)
                );
                break;
            default:
                break;
        }
        this._updatePeerGroups();
    }

    public toggleIsReverse() {
        this._sequencing.isReverse = !this._sequencing.isReverse;
        this._sequencing.grouping = computeGrouping(
            this._sequencing.field,
            this._sequencing.info,
            this._sequencing.aggr,
            this._sequencing.isReverse,
            this._sequencing.bindColumn,
            this._sequencing.dataScopes
        );
        switch (this._sequencing.info.type) {
            case 'number':
            case 'integer':
                let domain = [
                    this._sequencing.grouping.min,
                    this._sequencing.grouping.max,
                ];
                if (this._sequencing.isReverse) {
                    domain = domain.reverse();
                }
                this._sequencing.scale.domain(domain);
                break;
            case 'date':
                domain = [
                    new Date(this._sequencing.grouping.min),
                    new Date(this._sequencing.grouping.max),
                ];
                if (this._sequencing.isReverse) {
                    domain = domain.reverse();
                }
                this._sequencing.scale.domain(domain);
                break;
            case 'string':
            case 'boolean':
                this._sequencing.scale.domain(
                    this._sequencing.grouping.unique.map((u) => u.key)
                );
                break;
            default:
                break;
        }
        this._updatePeerGroups();
    }

    public addListener(listener: () => void): void {
        this._listeners.push(listener);
    }

    public removeListener(listener: () => void): void {
        this._listeners = _.without(this._listeners, listener);
    }

    public get sequenceType() {
        return this._sequencing.type;
    }

    public get sequenceDefaultDuration() {
        switch (this._sequencing.type) {
            case 'all':
            case 'stagger':
                return this._sequencing.duration;
            case 'speed':
                return this._sequencing.scale.range()[0];
        }
    }

    public get sequenceField() {
        return this._sequencing.field;
    }

    public get sequenceFieldType() {
        return this._sequencing.info ? this._sequencing.info.type : 'integer';
    }

    public get sequenceSubType() {
        return this._sequencing.subType;
    }

    public get sequenceAggr() {
        return this._sequencing.aggr;
    }

    public get sequenceIsReverse() {
        return this._sequencing.isReverse;
    }

    public get sequenceBindColumn() {
        return this._sequencing.bindColumn;
    }

    public get startScaled(): number {
        return this.scale(this.startRaw);
    }

    public get endScaled(): number {
        return this.scale(this.endRaw);
    }

    get totalDuration() {
        return this.endScaled - this.startScaled;
    }

    get peerScale() {
        return this._peerScale;
    }

    private _getPeerGroupValue(dataScope: DataScope) {
        if (dataScope.tuples && dataScope.tuples.length > 0) {
            return this._sequencing.grouping.bind[
                dataScope.tuples[0][this._sequencing.bindColumn]
            ];
        } else {
            return this._sequencing.grouping.bind[
                dataScope.allFilters[this._sequencing.bindColumn]
            ];
        }
    }

    private _getDataScopeValue(dataScope: DataScope) {
        if (
            this._sequencing.info.type === 'integer' ||
            this._sequencing.info.type === 'number'
        ) {
            return computeAggregate(
                dataScope.tuples.map((d) => d[this._sequencing.field]),
                this._sequencing.aggr
            );
        } else {
            return dataScope.tuples[0][this._sequencing.field];
        }
    }

    private _updatePeerGroups() {
        let data = [];

        switch (this._sequencing.type) {
            case 'all':
                data.push({
                    delay: this._sequencing.delay,
                    duration: this._sequencing.duration,
                    label: 'All Peer Shapes',
                    count: -1,
                });
                break;
            case 'stagger':
                let parse = PARSE_MAP[this._sequencing.info.type],
                    format = FORMAT_MAP[this._sequencing.info.type];
                data = this._sequencing.grouping.unique.map((u) => {
                    let value = parse(u.key);
                    return {
                        delay: this._sequencing.scale(value),
                        duration: this._sequencing.duration,
                        value,
                        label: `${this._sequencing.field} = ${format(value)}`,
                        count: u.value,
                    };
                });
                break;
            case 'speed':
                parse = PARSE_MAP[this._sequencing.info.type];
                format = FORMAT_MAP[this._sequencing.info.type];
                data = this._sequencing.grouping.unique.map((u) => {
                    let value = parse(u.key);
                    return {
                        delay: this._sequencing.delay,
                        duration: this._sequencing.scale(value),
                        value,
                        label: `${this._sequencing.field} = ${format(value)}`,
                        count: u.value,
                    };
                });
                break;
        }
        this.peerGroups = data.reverse();
    }
}

const PARSE_MAP = {
    number: parseFloat,
    integer: parseFloat,
    string: (d) => d,
    boolean: (d) => d === 'true',
    date: (d) => new Date(+d),
};

// Format numbers if they are small or large, but issues when aggregating
const FORMAT_MAP = {
    number: NUMBER_FORMAT,
    integer: NUMBER_FORMAT,
    string: (d) => d,
    boolean: (d) => d,
    date: DATE_FORMAT,
};

// const SORT_BY_VALUE = (a, b) => {
//     return d3.ascending(a.value, b.value);
// };
