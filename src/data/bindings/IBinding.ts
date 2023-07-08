import DataScope from '../DataScope';

export default interface IBinding {
    type: string;
    id: number;
    dataColumn: string;
    visualField: string;
    aggregator: string;
    max: number;
    min: number;
    isCategorical: boolean;
    classId: string;
    scaleId: number;
    scaledMin: number;
    query: (dataScopes: DataScope[], props: any[]) => number[];
    transform: (queried: number[], props: any[]) => any[];
    apply: (transformed: any[], props: any[]) => any[];
    run: (dataScopes: DataScope[], props: any[]) => void;
}
