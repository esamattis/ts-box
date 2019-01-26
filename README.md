# 📦 ts-box

Put exceptions into boxes.

In JavaScript and therefor in TypeScript any function can throw anything at
any time. This makes exception handling hard. ts-box is a workaround which
puts function return values into boxes (like a maybe monad or error
container) and forces users to check for the error at the type level before
the actual value can be accessed.

## Install

    npm install ts-box

## Usage

Use `boxify()` to boxify existing functions

```ts
import {boxify} from "ts-box";

// Make a version of fetch that never throws or rejects
const boxedFetch = boxify(fetch);

async function main() {
    const box = await boxedFetch("/api");

    box.value; // TypeError! Cannot access the value before the error is handled

    if (!box.ok) {
        console.log("Fetch failed", box.error);
        return;
    }

    // The value can be now accessed when the error is handled
    console.log("Fetch ok!", box.value.status);
}
```

Use `runBox()` to immediately execute a function with boxing

```ts
import {runBox} from "ts-box";
const jsonBox = runBox(() => box.value.json());
if (jsonBox.ok) {
    // jsonBox.value...
}
```

Use `boxifyObject()` to boxify object of functions

```ts
import {boxifyObject} from "ts-box";
import Axiox from "axios";

const BoxifiedAxios = boxifyObject(Axios);
```

## The Return Type

In TypeScript jargon the return type of a boxified function is always a
discriminated union `ResultBox` with a common `ok` singleton property as the
discriminant which can be used to narrow the type to the value or error.

```ts
type ResultBox<T> = {ok: true; value: T} | {ok: false; error: any};
```

Read more about the TypeScript discriminated unions here:

<https://www.typescriptlang.org/docs/handbook/advanced-types.html#discriminated-unions>

## FAQ

Q: Can I somehow type the error to other than `any`?

A: No for the same reason the error is always `any` try-catch statements:
There's no way to guarantee the type of it since anything can throw at any
point. You must use type guards to narrow the error type.
