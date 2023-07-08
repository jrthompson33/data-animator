export default interface IObject {
    type: string;
    id: number;
    classId: string;
    mesh: any;
    visible: boolean;
    setProgress(value: number);
    staticProperties(properties: any);
    animateProperties(
        startProperties: any,
        endProperties: any,
        startDataScopes: any,
        endDataScopes: any,
        startIndex: number,
        timing: any
    );
}
