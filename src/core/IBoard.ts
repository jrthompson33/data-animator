import {VisGenerator} from './VisGenerator';
import ILink from './ILink';

export default interface IBoard {
    id: number;
    classId: string;
    name: string;
    generator: VisGenerator;
    previewData: any;
    position: {x; y};
    dimension: {w; h};
    previewLoading: boolean;
    selected: boolean;
    intersects: (other: {
        position: {x: number; y: number};
        dimension: {w: any; h: any};
    }) => boolean;
    renderToCanvasItem: () => any;
    renderToListItem: () => any;
    links: {in: undefined | ILink; out: undefined | ILink};
    getConnectorTransform: (inOut: string) => string;
    getConnectorLinkPosition: (inOut: string) => any;
    connectorAlignment: {
        in: 'top' | 'right' | 'bottom' | 'left';
        out: 'top' | 'right' | 'bottom' | 'left';
    };
}
