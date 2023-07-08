import {AnimationGenerator} from '../animation/AnimationGenerator';
import IBoard from './IBoard';

export default interface ILink {
    id: number;
    classId: string;
    name: string;
    boardNames: string;
    generator: AnimationGenerator;
    startBoard: IBoard;
    endBoard: IBoard;
    renderToCanvasItem: () => any;
    renderToListItem: () => any;
}
