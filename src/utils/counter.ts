const ELEMENT_COUNTER = {};

export function getElementCounter(type: string): number {
    if (!type) return 0;

    if (typeof ELEMENT_COUNTER[type.toString()] === 'undefined') {
        ELEMENT_COUNTER[type.toString()] = 1;
    }

    return ELEMENT_COUNTER[type.toString()]++;
}
