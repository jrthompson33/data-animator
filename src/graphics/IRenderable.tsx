import IObject from './objects/IObject';

export default interface IRenderable {
    objects: IObject[];
    updateObjects();
}
