export default interface ITiming {
    startScaled: number;
    endScaled: number;
    scale: any;
    progressScale: any;
    startRaw: number;
    endRaw: number;
    setStartRaw: (start: number) => void;
    setEndRaw: (end: number) => void;
}
