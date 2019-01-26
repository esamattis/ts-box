type ResultBox<T> = {ok: true; value: T} | {ok: false; error: any};

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

export function boxify<FN extends (...args: any[]) => any>(
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
