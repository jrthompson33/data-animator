import Renderer from './Renderer';

export default class OffscreenRenderer extends Renderer {
    constructor(canvasElement, svgElement) {
        super(canvasElement, svgElement);
    }

    async getImageData(): Promise<Blob> {
        let canvas = this._threeRenderer.domElement;
        if (canvas instanceof HTMLCanvasElement) {
            return new Promise<Blob>((resolve, reject) => {
                (canvas as HTMLCanvasElement).toBlob(blob => {
                    resolve(blob);
                });
            });
        } else {
            return (canvas as OffscreenCanvas).convertToBlob();
        }
    }
}
