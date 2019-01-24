import {runBox} from "../src/box";

test("cannot access without if-statement", () => {
    const box = runBox(() => {
        return 3;
    });

    // $ExpectError
    expect(box.value).toBe(3);

    // $ExpectError
    console.error(box.error);
});
