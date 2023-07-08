import ITiming from './ITiming';
import * as d3 from 'd3';
import {EasingOption, EasingOptionList} from './EasingOption';

export default class DecorationTiming implements ITiming {
    public startRaw: number = 0;
    public endRaw: number = 1;
    public scale = d3.scaleLinear().clamp(true);
    public progressScale = d3.scaleLinear().clamp(true);

    public easing: EasingOption = EasingOptionList[0];

    public setStartRaw(startRaw: number) {
        this.startRaw = startRaw;
        this.progressScale.domain([this.startScaled, this.endScaled]);
    }

    public setEndRaw(endRaw: number) {
        this.endRaw = endRaw;
        this.progressScale.domain([this.startScaled, this.endScaled]);
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
}
