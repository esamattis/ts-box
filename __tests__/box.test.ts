import {runBox} from "../src/box";
import {boxify} from "../src/box";

test("sync success", () => {
    expect.assertions(1);

    const box = runBox(() => {
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

    const box = runBox(() => {
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
    const box = await runBox(async () => {
        return "cool";
    });

    if (box.ok) {
        expect(box.value).toBe("cool");
    } else {
        console.log(box.error);
    }
});

test("async fail", async () => {
    expect.assertions(1);
    const box = await runBox(async () => {
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
});

test("can boxify existing function", async () => {
    function ding(foo: string) {
        throw new Error("fail");
    }

    const boxedDing = boxify(ding);

    const box = boxedDing("foo");

    expect.assertions(1);

    if (box.ok) {
        console.log(box.value);
    } else {
        expect(box.error.message).toBe("fail");
    }
});

test("can bind context", async () => {
    expect.assertions(2);

    class Foo {
        val = 2;
        getIt() {
            return this.val;
        }
    }

    const foo = new Foo();
    const boxedGetit = boxify(foo.getIt, foo);
    const box = boxedGetit();
    if (box.ok) {
        expect(box.value).toBe(2);
    }

    const boxedFoo = boxify(foo);
    const box2 = boxedFoo.getIt();
    if (box2.ok) {
        expect(box2.value).toBe(2);
    }
});

test("can boxify object of functions", async () => {
    expect.assertions(2);
    const obj = {
        foo() {
            return 1;
        },
        async fooAsync() {
            return 2;
        },
    };

    const boxedObj = boxify(obj);

    const foo = boxedObj.foo();
    if (foo.ok) {
        expect(foo.value).toEqual(1);
    }

    const fooAsync = await boxedObj.fooAsync();

    if (fooAsync.ok) {
        expect(fooAsync.value).toEqual(2);
    }
});
