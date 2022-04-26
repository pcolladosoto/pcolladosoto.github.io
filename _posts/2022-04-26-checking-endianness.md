---
title: Checking a system's endianness
tags: fundamentals programming C Go
aside:
  toc: false
---

# So... what's endianness?
Put simply, the [*endianness*](https://en.wikipedia.org/wiki/Endianness) of a machine tells us how that machine's memory is organised. In order to fully grasp what that means we need to take a small step back and take a look at how we interact with a computer's memory.

Before we begin note we'll make extensive use of hexadecimal (i.e. hex) numbers. When we're using them we'll prefix them with `0x`.

## What was memory again?
When a program runs it needs some 'space' on which to save its contents. We call that space the *memory*. Now, when we discuss memory we usually differentiate among the *stack* and the *heap* and so on and so forth. That's of no interest to us now though! We just need to know we *store* stuff on memory and that we can recover whatever we store there through an *address*. Just like in normal life, an address tells us where something (i.e. a piece of data) is.

Each memory address identifies a single *byte*. We can picture something like:

    Address
              + -------------- +
              |                |
       0x0    | 1 byte of data |
              |                |
              + -------------- +
              |                |
       0x1    | 1 byte of data |
              |                |
              + -------------- +
              |                |
       0x2    | 1 byte of data |
              |                |
              + -------------- +

See, each of the boxes holds one byte of data and we can refer to each of the boxes through their addresses.

### How many boxes do we need
Whenever we work with a programming language we need to be informed of the *size* of its data types. That is, how many boxes a variable of a given type needs. From now on we'll use *C* as an example given it's very well suited to this type of discussion: it's data types are very simple!

In C, a `char` takes up a **single byte**. Then, we just need a single address to locate a char un memory:

    Address
              + -------------- +
              |       'A'      |
       0x0    |                |
              |    0011 0001   |
              + -------------- +

Note the above address (i.e. we provide it in hex as that's the convention) holds character `'A'` which, according to the [ASCII table](https://www.asciitable.com) is `49 == 0x31`, which we represent in binary.

Okay, but, what happens with a data type taking up more than one byte? Do we need an address for each of the bytes? Well no! That would make them very unwieldy... What we do instead is locate the entire thing by knowing the address of the first byte **and** the number of bytes we need to rebuild anything we store on memory. That's what we actually did before too, but we knew a `char` is only 1 byte long!

In C integers (i.e. `int`s) take up **4 bytes**. Let's see what `0x00133539` would look like:

    Address                Address
              + ---- +              + ---- +
       0x0    | 0x00 |       0x0    | 0x39 |
              + ---- +              + ---- +
       0x1    | 0x13 |       0x1    | 0x35 |
              + ---- +              + ---- +
       0x2    | 0x35 |       0x2    | 0x13 |
              + ---- +              + ---- +
       0x3    | 0x39 |       0x3    | 0x00 |
              + ---- +              + ---- +

So... which one is correct? Both are, kind of. We can always say that this integer starts at `0x0` and is **4 bytes long**. The thing is we would get back `0x00133539` if we read out the first option sequentially and `0x39351300` if we instead went with the second one. If we told you the order we followed when storing the number you'd know which of the two options to choose. That's exactly what **endianness** is!

# The two types of endianness
In a **big endian** machine we say *'the high order byte goes to the lower address'*. That is, the byte with the largest weight (i.e. `0x00` in our example) would be stored at the low address and we would then store the rest of the data in the subsequent addresses. The 'good' thing with big endianness is that the memory layout resembles how we read numbers a bit more closely. In the example above the layout on the left uses big endian organisation. In the realm of networking information is expected to be mainly in big endian form (or, *network order*).

In **little endian** machines we say *'the low order byte goes to the lower address'*. Now, the byte with the smallest weight (i.e. `0x39`) is stored at the lowest address. Even though this 'flips' the number in memory, it does sound a bit more logical. In the previous example, the layout on the right follows a little endian organisation. ARM processors and most others use a little endian model.

After reading these two examples you can see how we often need to 'flip' from the big to the little world. Functions such as [`htons(3)`](https://linux.die.net/man/3/htons) take care of all this and on some languages that's 'automagically' done for us!

Now that we know what endianness is let's see how we can check the organisation of our own machine!

# Time to check our system
In order to do so we'll have to get a bit 'nasty' with programming. As you might already be fearing, 'nasty' is (almost) a synonym for *pointers* :scream:.

## A brief word on pointers
Some people love *pointers* and others don't: we're not trying to settle that debate. We're just here to tell you a pointer is a variable whose value is a memory address, nothing more.

We need to make use of pointers to work with the memory addresses in an unrestricted manner to decide whether we are on a little or big endian system.

Bear in mind we'll be writing **very unsafe code**: we'll be explicitly mangling data types to do what we want!

## C
We'll take a tour through time and offer a solution in two different programming languages. We'll begin at the beginning: *C*. The following snippet will print a message with the system's endianness:

```c++
// We need printf()
#include <stdio.h>

int main(void) {
    // We define 4 byte integer x whose value is 1
    int x = 0x1;

    // We define ptr_x as a pointer to an integer holding the address of x
    int* ptr_x = &x;

    // We define ptrb_x as a pointer to a character pointing to the first address of x
    char* ptrb_x = (char*) ptr_x;

    // We get the value of the first byte of x through the dereference (i.e. *) operator
    char x_0 = *ptrb_x;

    // If the first byte is 1 then we are working on a little endian environment.
        // If it's a 0, then it's a big endian one!
    if (x_0 == 1)
        printf("Little endian!\n");
    else
        printf("Big endian!\n");
    return 0;
}
```

The above can be rewritten in a more succinct manner too!

```c++
#include <stdio.h>

int main(void) {
    int x = 0x1;

    // Note that in C 'not 0 is considered true' and '0 is considered false'
    if (*(char*)&x)
        printf("Little endian!\n");
    else
        printf("Big endian!\n");
    return 0;
}
```

You can compile any of the above on Linux-based machines and macOS with:

    # We assume the above code is stored on a file called endianness.c
    gcc -o endianness endianness.c

    # Once compiled we can run it with
    ./endianness

So what the hell is going on? Let's see the memory's state as the statements are executed. When we define `x = 0x1` we have:

    Address    Big Endian     Little Endian
                + ---- +        + ---- +
       0x0      | 0x00 |        | 0x01 |
                + ---- +        + ---- +
       0x1      | 0x00 |        | 0x00 |
                + ---- +        + ---- +
       0x2      | 0x00 |        | 0x00 |
                + ---- +        + ---- +
       0x3      | 0x01 |        | 0x00 |
                + ---- +        + ---- +

Now, if we just try to get the value of `x` through a pointer to an integer we'll always get `1` back. That's because C knows that when we retrieve data pointed to by a pointer to an integer (i.e. `int*`) it needs to read 4 bytes! We instead need to 'force' it to just read the first one because that's the one 'telling' us about the machine's endianness! We can do so if we 'lie' and say that the address contained in `ptr_x` is instead pointing to a single byte (i.e. a `char`). That's what we accomplish with a *type cast* like `(char*) ptr_x`. After casting the pointer we just need to *dereference* it (i.e. get its value) with `*` and see what we get back.

According to the diagram above we can easily see how, if we retrieve the first byte and it's a `1` we on a little endian machine and, if it's a `0`, we're instead on a big endian system. This is exactly what the *if clause* checks for!

So, even though it looks hard and cryptic you can actually see it's not that complex in the end is it?

## Go
When working with Go we need to bend the language to our will just like with C. The thing is, Go is a bit more stubborn...

As we'll be playing with types and trying to override some security features that usually prevent things from going berserk we'll need to leverage the [`unsafe`](https://pkg.go.dev/unsafe) package.

The idea is pretty much the same as before: we just store `1` on a 4 byte `int` and then we define a pointer to said variable. In a normal scenario we would only be capable of defining a pointer to an `int` (i.e. a `*int`), but thanks to `unsafe`'s `Pointer` type we can circumvent that that restriction.

Using that 'trick' we'll instead define a pointer to a `byte` (i.e. a `char` in C's lingo) and just take a look at the value contained in that first address. Just like before, the result of the dereference operator (i.e. `*`) will tell us all we need to know.

Given C's 'not `0` is true' policy is not as standard in Go we decided to explicitly check whether the returned value is `1` or not. We also chose to explicitly define `px *byte` instead of writing it all within the `if` clause to make things a bit clearer: we feel Go is not as geared towards cryptic expressions as C.

```go
package main

import (
	"fmt"
	"unsafe"
)

func main() {
    var x int = 1
    var px *byte = (*byte)(unsafe.Pointer(&x))

    if *px == 1 {
        fmt.Printf("Little endian!\n")
    } else {
        fmt.Printf("Big endian!\n")
    }
}
```

If you store that on a file named `endianness.go` and run the following you'll get your result too:

    go run endianness.go

The idea and memory layout is exactly the same as before!

# That's it!
Well, we did really dig into C's and Go's 'belly' there! Time for a pat in the back :clap:

---

If you have any comments, questions or suggestions, feel free to drop me an email!

Thanks for your time! Hope you found this useful :smile_cat:
