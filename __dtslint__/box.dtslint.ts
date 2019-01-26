import {runBox, boxify} from "../src/box";

test("cannot access without if-statement", () => {
    // $ExpectType ResultBox<number>
    const box = runBox(() => {
        return 3;
    });

    // $ExpectError
    expect(box.value).toBe(3);

    // $ExpectError
    console.error(box.error);
});

test("can boxify existing function", async () => {
    function ding(foo: number) {}

    const boxedDing = boxify(ding);

    // $ExpectError
    const box = boxedDing("foo");
});

test("can boxify object of functions", async () => {
    const obj = {
        foo() {
            return 3;
        },
        async fooAsync() {
            return 3;
        },
    };

    const boxedObj = boxify(obj);

    // $ExpectType ResultBox<number>
    boxedObj.foo();

    // $ExpectType Promise<ResultBox<number>>
    boxedObj.fooAsync();
});

test("can boxify class objectg", async () => {
    class Foo {
        ding() {
            return 1;
        }
    }

    const boxedFoo = boxify(new Foo());

    // $ExpectType ResultBox<number>
    boxedFoo.ding();
});

test("run box can pass arguments", () => {
    function fun(arg1: number, arg2: string) {
        return 1;
    }

    const box = runBox(fun, 1, "s");

    // $ExpectError
    runBox(fun, 1);

    // $ExpectError
    runBox(fun, 1, 2);
});
