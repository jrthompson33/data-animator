import * as d3 from 'd3';

const formatDecimal = d3.format('~f');

export function getExtensionFromFileName(fileName: string) {
    let re = /(?:\.([^.]+))?$/;
    let x = re.exec(fileName);
    return x[1] ? x[1] : null;
}

function zeroPad(n, width) {
    let z = '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

/** Returns whether the value is a function. Acts as a type guard. */
// tslint:disable-next-line:ban-types
export function isFunction(value: any): value is Function {
    return typeof value === 'function';
}

/**
 * Safely invoke the function with the given arguments, if it is indeed a
 * function, and return its value. Otherwise, return undefined.
 */
export function safeInvoke<R>(func: (() => R) | undefined): R | undefined;
export function safeInvoke<A, R>(
    func: ((arg1: A) => R) | undefined,
    arg1: A
): R | undefined;
export function safeInvoke<A, B, R>(
    func: ((arg1: A, arg2: B) => R) | undefined,
    arg1: A,
    arg2: B
): R | undefined;
export function safeInvoke<A, B, C, R>(
    func: ((arg1: A, arg2: B, arg3: C) => R) | undefined,
    arg1: A,
    arg2: B,
    arg3: C
): R | undefined;
export function safeInvoke<A, B, C, D, R>(
    func: ((arg1: A, arg2: B, arg3: C, arg4: D) => R) | undefined,
    arg1: A,
    arg2: B,
    arg3: C,
    arg4: D
): R | undefined;
// tslint:disable-next-line:ban-types
export function safeInvoke(func: Function | undefined, ...args: any[]) {
    if (isFunction(func)) {
        return func(...args);
    }
    return undefined;
}

export function formatCount(count: number) {
    return formatDecimal(count);
}

/**
 * Returns a duration of milliseconds in MM:SS format. Rounds to the nearest second.
 *
 * @param milliseconds - duration of time in ms
 * @return {string}
 */
export function formatDurationWithoutDecimal(milliseconds) {
    let hours = milliseconds / 3.6e6;
    let minutes = (milliseconds % 3.6e6) / 6e4;
    let seconds = (milliseconds % 6e4) / 1e3;
    if (minutes >= 1) {
        return (
            Math.floor(minutes).toFixed(0) + ':' + zeroPad(Math.floor(seconds), 2)
        );
    } else {
        return seconds.toFixed(0);
    }
}

/**
 * Returns a duration of milliseconds in MM:SS.SSS format.
 *
 * @param milliseconds - duration of time in ms
 * @param decimal - how many decimals to include
 * @param padMinutes - 0 pad the minutes
 * @param padHours - 0 pad the hours
 * @return {string}
 */
export function formatDurationWithFixed(
    milliseconds,
    decimal,
    padMinutes,
    padHours
) {
    if (!decimal) {
        decimal = 3;
    }
    let hours = milliseconds / 3.6e6;
    let minutes = (milliseconds % 3.6e6) / 6e4;
    let seconds = (milliseconds % 6e4) / 1e3;
    if (hours >= 1 || padHours) {
        let h = padHours
            ? zeroPad(Math.floor(hours), 2)
            : Math.floor(hours).toFixed(0);
        let m = padMinutes
            ? zeroPad(Math.floor(minutes), 2)
            : Math.floor(minutes).toFixed(0);
        return (
            h +
            ':' +
            m +
            ':' +
            zeroPad(Math.floor(seconds), 2) +
            '.' +
            (seconds % 1).toFixed(decimal).substring(2)
        );
    } else if (minutes >= 1 || padMinutes) {
        let m = padMinutes
            ? zeroPad(Math.floor(minutes), 2)
            : Math.floor(minutes).toFixed(0);
        return (
            m +
            ':' +
            zeroPad(Math.floor(seconds), 2) +
            '.' +
            (seconds % 1).toFixed(decimal).substring(2)
        );
    } else {
        return seconds.toFixed(decimal);
    }
}

export function formatDurationWithDecimal(milliseconds, padMinutes, padHours) {
    let hours = milliseconds / 3.6e6;
    let minutes = (milliseconds % 3.6e6) / 6e4;
    let seconds = (milliseconds % 6e4) / 1e3;
    if (hours >= 1 || padHours) {
        let h = padHours
            ? zeroPad(Math.floor(hours), 2)
            : Math.floor(hours).toFixed(0);
        let m = padMinutes
            ? zeroPad(Math.floor(minutes), 2)
            : Math.floor(minutes).toFixed(0);
        return h + ':' + m + ':' + formatDecimal(seconds);
    } else if (minutes >= 1 || padMinutes) {
        let m = padMinutes
            ? zeroPad(Math.floor(minutes), 2)
            : Math.floor(minutes).toFixed(0);
        return m + ':' + formatDecimal(seconds);
    } else {
        return formatDecimal(seconds);
    }
}

export function formatDurationWithDecimalNoPad(milliseconds) {
    return formatDurationWithDecimal(milliseconds, false, false);
}

export function formatDurationWithFixedNoPad(milliseconds, decimal) {
    return formatDurationWithFixed(milliseconds, decimal, false, false);
}
