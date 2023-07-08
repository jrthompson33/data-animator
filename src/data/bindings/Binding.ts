import IBinding from './IBinding';
import DataScope from '../DataScope';
import {getElementCounter} from '../../utils/counter';

export default class Binding implements IBinding {
    constructor(
        dataColumn: string,
        visualField: string,
        classId: string,
        aggregator: string,
        isCategorical: boolean,
        scaleId,
        scaledMin: number,
    ) {
        this.dataColumn = dataColumn;
        this.visualField = visualField;
        this.classId = classId;
        this.aggregator = aggregator;
        this.isCategorical = isCategorical;
        this.scaleId = scaleId;
        this.id = getElementCounter('Binding');
        this.scaledMin = scaledMin;
    }

    public dataColumn: string;
    public visualField: string;
    public classId: string;
    public scaleId: number;
    public scaledMin: number;

    public aggregator: string;

    public isCategorical: boolean;
    public max: number;
    public min: number;

    public id: number;
    public type: string;

    public query(dataScopes: DataScope[], props: any[]) {
        return [0];
    }

    public transform(queried: number[], props: any[]) {
        return [0];
    }

    public apply(transformed: any[], props: any[]) {
        return [0];
    }

    public run(dataScopes: DataScope[], props: any[]) {
        let queried = this.query(dataScopes, props);
        let transformed = this.transform(queried, props);
        this.apply(transformed, props);
    }
}
