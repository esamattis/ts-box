export type ResultBox<T> = {ok: true; value: T} | {ok: false; error: any};

type BoxPromise<T> = T extends Promise<infer V>
    ? ResultBox<Promise<V>>
    : ResultBox<T>;

/** Get the type wrapped in promise */
type PromiseType<T> = T extends Promise<infer V> ? V : T;

/**
 * Wrap T in promise if Function FN is an async function
 */
type WrapPromiseIf<FN extends (...args: any[]) => any, T> = FN extends (
    ...args: any[]
) => Promise<any>
    ? Promise<T>
    : T;

/** Put function return value in to a box */
type BoxifyReturnType<FN extends (...args: any[]) => any> = WrapPromiseIf<
    FN,
    ResultBox<PromiseType<ReturnType<FN>>>
>;

/** Convert function to boxified function */
type BoxifyFunction<FN extends (...args: any[]) => any> = (
    ...args: Parameters<FN>
) => BoxifyReturnType<FN>;

/** Convert all functions in a object to boxified functions */
type BoxifyObject<T extends Object> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any
        ? BoxifyFunction<T[K]>
        : T[K]
};

function isPromise<T = any>(v: any): v is Promise<T> {
    return v && typeof v.then === "function";
}

function boxValue<T>(value: T) {
    return {ok: true, value};
}

function boxError<T>(error: T) {
    return {ok: false, error};
}

/**
 * Execute given function and return boxed value or error
 *
 * @param fn
 */
export function runBox<ReturnValue>(
    fn: () => ReturnValue | Promise<ReturnValue>,
): BoxPromise<ReturnValue> {
    type Ret = BoxPromise<ReturnValue>;

    let res;

    try {
        res = fn();
    } catch (error) {
        // Sync error
        return boxError(error) as Ret;
    }

    if (isPromise<ReturnValue>(res)) {
        // async success or fail
        return (res.then(boxValue, boxError) as any) as Ret;
    } else {
        // sync success
        return boxValue(res) as Ret;
    }
}

function boxifyFunction<FN extends (...args: any[]) => any>(
    fn: FN,
    context: any = null,
): BoxifyFunction<FN> {
    const ret = (...args: any[]) => {
        return runBox(() => {
            return fn.apply(context, args);
        });
    };

    return ret as any;
}

// Required to make class instances work. Borrowed from lodash
// https://github.com/lodash/lodash/blob/6248f8a65861b506f2c106defe28619be5f45723/toPlainObject.js
function toPlainObject(value: any) {
    value = Object(value);
    const result: any = {};
    for (const key in value) {
        result[key] = value[value];
    }
    return result;
}

function boxifyObject<T extends Object>(
    object: T,
    context?: any,
): BoxifyObject<T> {
    const out: {[key: string]: Function} = {};

    Object.getOwnPropertyNames(toPlainObject(object)).forEach(key => {
        if (key === "constructor") {
            return;
        }

        const value = (object as any)[key];

        if (typeof value === "function") {
            out[key] = boxifyFunction(value, context || object);
        } else {
            out[key] = value;
        }
    });

    return out as any;
}

export function boxify<FN extends (...args: any[]) => any>(
    fn: FN,
    context?: any,
): BoxifyFunction<FN>;

export function boxify<T extends Object>(
    object: T,
    context?: any,
): BoxifyObject<T>;

export function boxify(thing: any, context?: any): any {
    if (typeof thing === "function") {
        return boxifyFunction(thing, context);
    }

    return boxifyObject(thing);
}
