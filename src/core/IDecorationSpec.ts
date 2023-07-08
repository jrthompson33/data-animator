export default interface IDecorationSpec {
    bindingId: number;
    type: string;
    flipped?: boolean;
    userFlipped?: boolean;
    userTranslate?: number[];
    translate?: number[];
    showAll?: boolean;
    ids?: number[];
    bounds?: any;
    centerBounds?: any;
    decorationId: number;
}
