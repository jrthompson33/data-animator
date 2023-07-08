import {EasingOption} from '../../animation/EasingOption';

export default interface IDecoration {
    id: number;
    visible: boolean;

    setVisibleToSVG(svg: SVGSVGElement, visible: boolean): void;

    properties: {start: any; end: any; default: any};

    initToSVG(svg: SVGGElement): void;

    renderStaticToSVG(svg: SVGGElement, properties: any): void;

    renderAnimationToSVG(
        svg: SVGGElement,
        startProperties: any,
        endProperties: any
    ): void;

    removeFromSVG(svg: SVGGElement): void;

    setProgress(t: number): void;

    setEasingOption(easing: EasingOption): void;
}
