type ResultBox<T> = {ok: true; value: T} | {ok: false; error: any};

type BoxPromise<T> = T extends Promise<infer V>
    ? ResultBox<Promise<V>>
    : ResultBox<T>;

type UnwrapPromise<T> = T extends Promise<infer V> ? V : T;

/**
 * Wrap T in promise if Function FN is an async function
 */
type WrapPromise<FN extends (...args: any[]) => any, T> = FN extends (
    ...args: any[]
) => Promise<any>
    ? Promise<T>
    : T;

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
function boxit<ReturnValue>(
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

function boxify<FN extends (...args: any[]) => any>(
    fn: FN,
): (
    ...args: Parameters<FN>
) => WrapPromise<FN, ResultBox<UnwrapPromise<ReturnType<FN>>>> {
    const ret = (...args: any[]) => {
        return boxit(() => {
            return fn(...args);
        });
    };

    return ret as any;
}

test("sync success", () => {
    expect.assertions(1);

    const box = boxit(() => {
        return 3;
    });

    if (box.ok) {
        expect(box.value).toBe(3);
    } else {
        console.error(box.error);
    }
});

test("sync fail", () => {
    expect.assertions(1);

    const box = boxit(() => {
        if (false) {
            return 3;
        }

        throw new Error("fail");
    });

    if (box.ok) {
        console.log(box.value);
    } else {
        expect(box.error.message).toBe("fail");
    }
});

test("async success", async () => {
    expect.assertions(1);
    const box = await boxit(async () => {
        return "cool";
    });

    if (box.ok) {
        expect(box.value).toBe("cool");
    } else {
        console.log(box.error);
    }
});

function ding(dong: string, dang: number) {
    return 324;
}

const dingBoxed = boxify(ding);

test("async fail", async () => {
    expect.assertions(1);
    const box = await boxit(async () => {
        if (false) {
            return "cool";
        }

        // Do a tick
        await Promise.resolve();

        throw new Error("fail");
    });

    if (box.ok) {
        console.log(box.value);
    } else {
        expect(box.error.message).toBe("fail");
    }

    const fetchBoxed = boxify(fetch);

    const resBox = await fetchBoxed("/");
    if (resBox.ok) {
        console.log(resBox.value.json);
    }
});
