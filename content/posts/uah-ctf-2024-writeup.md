---
title: Ciberseg 2024 Writeup
tags: ["CTF", "UAH"]
date: "29-01-2024"
---

# Ciberseg's 2024 CTF Writeup
This post provides a basic writeup of the different challenges we managed to overcome at [Ciberseg's 2024 CTF](https://ciberseg.uah.es/ctf.html).
In order to make everything a bit (or much) more interesting and fun we partnered up with [David Carrascal](https://github.com/davidcawork) to
spend quite a pleasant evening :P

In this CTF flags will be presented as `flag{foo}`, were `foo` can be any arbitrary set of characters. It's also possible to come across so called
'flase' flags which are always `flag{}`. As the name implies, these flags are not the ones we're actually looking for...

### A little note on manpages
We believe one of the best (if not the best altogether) source of information regarding *NIX commands are manpages. You'll usually find references
to a command's (i.e. `foo`) manpage as `foo(N)`, where `N` denotes the manual section we are referring to. We'll follow that very same convention.

You can consult these manpages locally through `man` (i.e. by running `man foo`, for instance) or by browsing through the
[*man-pages* project](https://www.kernel.org/doc/man-pages/). You'll usually get the manual section you want right out of
the box, but you can explicitly state the section by invoking `man` as `man N foo`, where `N` is a section number as explained
in `man man`.

### A note on the output of commands
We're running all the commands detailed in the following sections on macOS. Unlike Linux-based machines, macOS' kernel is Darwin, and the userland
lies closer to *BSD than traditional Linux distributions. This explains why command outputs may differ slightly, but the main idea will always
be the same no matter the system you're running on.

Finally, note that commands you're to run at a prompt will be introduced by a dollar sign (`$`). If you need to run something with elevated
privileges the prompt will be `#` instead.

Enough conventions! Let's get to the fin part :smirk_cat:

## Labyrinth
In this challenge we needed to extract the flag from a file called [`maze.zip`](maze.zip). As you never know what to expect on CTFs, we first
ran the file through, well, `file(1)`:

    $ file maze.zip
    maze.zip: Zip archive data, at least v2.0 to extract, compression method=store

Everything looks okay for now, so the next step would be to unzip the file with, well, `unzip(1)` (as you can see command names do not tend to be
very original):

    $unzip maze.zip
    Archive:  maze.zip
       creating: maze/
       creating: maze/1riqsmU2/
       creating: maze/1riqsmU2/9eblzuuc/
       creating: maze/1riqsmU2/9eblzuuc/0RhP5SDi/
       creating: maze/1riqsmU2/9eblzuuc/0RhP5SDi/84svsjey/
       creating: maze/1riqsmU2/9eblzuuc/0RhP5SDi/84svsjey/4C8NvkZG/
     extracting: maze/1riqsmU2/9eblzuuc/0RhP5SDi/84svsjey/4C8NvkZG/flag.txt
       creating: maze/1riqsmU2/9eblzuuc/0RhP5SDi/84svsjey/6JuNhVWR/
     extracting: maze/1riqsmU2/9eblzuuc/0RhP5SDi/84svsjey/6JuNhVWR/flag.txt
       creating: maze/1riqsmU2/9eblzuuc/0RhP5SDi/84svsjey/AcElgR02/
     extracting: maze/1riqsmU2/9eblzuuc/0RhP5SDi/84svsjey/AcElgR02/flag.txt
       creating: maze/1riqsmU2/9eblzuuc/0RhP5SDi/84svsjey/EGaE7LQT/
     extracting: maze/1riqsmU2/9eblzuuc/0RhP5SDi/84svsjey/EGaE7LQT/flag.txt
       creating: maze/1riqsmU2/9eblzuuc/0RhP5SDi/84svsjey/HgpQ0rBV/
     extracting: maze/1riqsmU2/9eblzuuc/0RhP5SDi/84svsjey/HgpQ0rBV/flag.txt
       creating: maze/1riqsmU2/9eblzuuc/0RhP5SDi/84svsjey/J2B5MzHS/
     extracting: maze/1riqsmU2/9eblzuuc/0RhP5SDi/84svsjey/J2B5MzHS/flag.txt
       creating: maze/1riqsmU2/9eblzuuc/0RhP5SDi/84svsjey/QkXTcwS3/
    [...]

The output's been truncated at `[...]` because it's quite long... The bottom line is the file is generating a convoluted directory tree with some
text files named `flag.txt` at the leaves. As you can imagine, all of these `flag.txt` files but one contain false flags. You can check that
by running `cat maze/1riqsmU2/9eblzuuc/0RhP5SDi/84svsjey/4C8NvkZG/flag.txt

    $ cat maze/1riqsmU2/9eblzuuc/0RhP5SDi/84svsjey/4C8NvkZG/flag.txt
    flag{}

We then need to somehow search for the valid flag across the tree: this is where `find(1)` comes in extra handy! Find will look for a file recursively
based on a series of parameters supplied to it. As all the false flags are contained in files called `flag.txt` we can't really search based on
the filename: we need some other criteria to find the actual valid flag. We can work with the fact that false flags will always be `flag{}`: it means
valid ones will be always longer! Let's see how many characters make up a false flag (we could count them but hey, we like `wc(1)` okay?):

    $ echo "flag{}" | wc -c
    7

The above is actually not true: false flags **don't** include the trailing newline (i.e. `\n`), so the actual character count is `6`. We could
have also use `echo(1)`'s `-n` flag to avoid including the trailing newline, but who wants to skip a learning opportunity? Anyway, you can also
check the actual size with `ls(1)` (look for the `6` corresponding to the actual size in bytes):

    $ ls -l maze/1riqsmU2/9eblzuuc/0RhP5SDi/84svsjey/4C8NvkZG/flag.txt
    -rw-r--r--@ 1 collado  staff  6 23 Jan 13:02 maze/1riqsmU2/9eblzuuc/0RhP5SDi/84svsjey/4C8NvkZG/flag.txt

Anyway, given it's likely the flag won't be a single character long we can just assume it'll be `8` bytes long at least. This let's us find the flag
with `find`:

    $ find maze -name "flag.txt" -size +8c
    maze/K8gbEW40/Y6LmHlWV/gaQUqalY/7Jeqsnkm/QRgEbX9H/flag.txt

The above will basically begin looking recursively from the `maze` directory for files named `flag.txt` that are at least `8` characters
(i.e. bytes) long. It returns, as expected, a single match. We can just `cat(1)` it to get our first flag:

    $ cat maze/K8gbEW40/Y6LmHlWV/gaQUqalY/7Jeqsnkm/QRgEbX9H/flag.txt
    flag{m1n0t4ur}

### Bonus solution
We actually didn't solve this challenge following the precedure detailed above. To be honest, we're running a bit low on disk sapce, so we didn't want
to unzip the entire thing (the `maze` directory takes up about `700 MiB`). As the flags don't look to be encrypted, chances are we can just `awk(1)`
the raw contents of the file interpreted as ASCII characters. We can use `xxd(1)` to display the raw contents of the files as hexadecimal values together
with the derived textual representation. We won't get probably get the flag on the first try, but we might spot something to begin out search with.

    $ xxd maze.zip | awk '/.*flag{[^}].*/'
    00567fc0: 7478 7466 6c61 677b 6d31 6e30 7434 7572  txtflag{m1n0t4ur

The above shows how at index `0x567fc0` we find the text `flag{m1n0t4ur`. To get that we just run the raw output of `xxd` through `awk`, where we match
on lines adhering to a regular expression that can roughly be translated into 'look for lines containing `flag{` and where the next character **is not**
`}`' (i.e. ignore false flags). You can run over to [Regex 101](https://regex101.com) to play around with the regexp if you like! Anyway, we can just check
to see if we're missing a part of the flag by `grep(1)`ping for the file index:

    $ xxd maze.zip | grep -C 1 00567fc0
    00567fb0: 6d2f 5152 6745 6258 3948 2f66 6c61 672e  m/QRgEbX9H/flag.
    00567fc0: 7478 7466 6c61 677b 6d31 6e30 7434 7572  txtflag{m1n0t4ur
    00567fd0: 7d0a 504b 0304 1403 0000 0000 4168 3758  }.PK........Ah7X

We can see how we were lucky enough to get the entire flag on a single line! Bottom line: we got the flag with no need for decompressing the file.

## Agent
In this challenge we were given a URI for an HTTP server. The server's down already, so we'll just assume it's IPv4 address was `1.2.3.4` as an example.
At any rate, the challenge pointed you to `http://1.2.3.4:9090`. When accessing the site you just got the picture of a cartoon duck dressed as a hard
boiled detective and/or a spy: depends on your preferences.

Given the name of the challenge and the fact that a duck picture was being returned David was quick to discover that the key of the challenge lied on
the HTTP client's announced [`User-Agent`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent) and that the user agent one had
to use was DuckDuckGo's.

Somewhat recently, DuckDuckGo's made a [browser](https://duckduckgo.com/&) available to the public. One can browser around for its user agent: the
[user-agents.net](https://user-agents.net/browsers/duckduckgo-browser) site has a complete list. The only things that's left for us to do is to
somehow embed the user agent into the request: that's a piece of cake for `curl(1)`:

    $ curl -v -A 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.211 Mobile DuckDuckGo/5 Safari/537.36' \
        -L http://1.2.3.4:9090
    flag{DuckdUCKGo}

The above not only embeds the user agent, it'll also log the request details (`-v`) and follow any redirections returned by the server `-L`. You can see the
server replies with the flag right away! Just for the sake of trying, we probed the server to see what it was looking for in the request when deciding whether
to serve the flag or not. It turned out you just needed to configure the user agent as `DuckDuckGo/5`:


    $ curl -v -A 'DuckDuckGo/5' -L http://1.2.3.4:9090
    flag{DuckdUCKGo}

One less to go!

## Captain Crunch
In a similar fashion to **Labyrinth**, we're given a ZIP file which is now password protected together with the password's hash. However, we're told
the password is rather insecure and that it's related to the world's most famous mouse, which os no other than Mickey Mouse, of course. The password-protected
ZIP file is [`zipdivertido.zip`](./zipdivertido.zip), and the passwords hash is:

    3eb4e968a6b408ebf49eeac9a98e3f8a

The first thing we need to do is find out the password's hashing algorithm. It's length is `128` bits, so chances are it's an [MD5](https://en.wikipedia.org/wiki/MD5)
hash:

    $ echo $(( $(echo -n "3eb4e968a6b408ebf49eeac9a98e3f8a" | wc -c) * 4 ))
    128

The above leverages `bash(1)`'s *arithmetic expansion* in case you want to look it up. The idea is we count the number of characters in the hash with `wc -c`
to then multiply that number by `4` given each hex digit amounts to `4` bits. This is just fancy stuff to check the actual size of the output hash. If you
check [this list of hashes](https://en.wikipedia.org/wiki/Secure_Hash_Algorithms) you can see how only MD5 sports 128-bit long hashes.

Now that we know we're dealing with MD5 we can begin thinking about cracking it: that's basically trying out different password candidates, by hasing them
and then comparing the result with the provided hash. Despite the nightmare it is to install it, we've worked with [`hashcat`](https://hashcat.net/hashcat/)
in the past, so that's what we'll do now:

    $ hashcat -m 0 -a 3  --increment -1 mickey 3eb4e968a6b408ebf49eeac9a98e3f8a '?1?1?1?1?1?1?1?1?1?1?1'
    3eb4e968a6b408ebf49eeac9a98e3f8a:ecemk

Let's take a quick tour through the options:

- `-m 0`: We'll be using MD5 hashes.
- `-a 3`: We'll perform a mask attack (i.e. a 'fancier' brute force attack).
- `--increment`: We'll begin trying out 1-character long passwords to then move on to longer ones up to the mask's length.
- `-1 mickey`: We'll generate candidate passwords by combining the characters that make up the word `mickey`. This is where
   one of the challenge's clues comes in handy!
- `3eb4e968a6b408ebf49eeac9a98e3f8a`: The hash we want to crack. It can also be the path to a file containing the target hashes.
- `'?1?1?1?1?1?1?1?1?1?1?1'`: The password mask. You can check [the documentation](https://hashcat.net/wiki/doku.php?id=mask_attack)
   for more information, but this mask basically represents all the possible 10-character passwords one can create by combining the
   characters making up the work `mickey` as specified through `-1`. Given we use the `--increment` flag, `hashcat` will try out all
   possible 1-character passwords, then 2-character passwords and so on until it tries out all 10-character passwords. Given the
   challenge states the password is rather weak we expect it to be from 1 to 10 characters long.

It's worth mentioning the entire `hashcat` invocation was David's doing! Thanks a ton :P

If you check the output of the command, you can see how the hashed password is the 5-character long `ecemk`! You can verify that
by computing it's MD5 hash with `md5sum(1)`:

    $ echo -n ecemk | md5sum
    3eb4e968a6b408ebf49eeac9a98e3f8a  -

We got the password! After all this work it might come as a surprise that there's a much easier way to get the password. Just head
over to [crackstation.net](https://crackstation.net) and enter the hash: it'll be cracked in a second provided you don't fail the
*Completely Automated Public Turing test to tell Computers and Humans Apart" :P

No matter how you got it, we can now `unzip(1)` the provided file:

    $ unzip -P ecemk zipdivertido.zip
    Archive:  zipdivertido.zip
      inflating: notOswald.jpeg

As seen on the output, this creates a file named `notOswald.jpeg` showing a screenshot of the [Steamboat Willie](https://en.wikipedia.org/wiki/Steamboat_Willie)
shot film. However, the statement hints at how the key to the challenge is *inside* the image. This is a perfect prompt for using
`strings(1)`. We'll just `grep(1)` for a flag candidate:

    $ strings notOswald.jpeg | grep flag
    flag{StEAmBoAtWiLLieIsNowPUBLIC}

Jackpot! That about does it for the challenge :P

## POW
In this reversing challenge we're provided with an executable (which will only run on Linux-based systems, by the way): `pow`.
We can try to run the executable: we'll be presented with a prompt to enter a password (which we, of course, have no idea about).

    $ ./pow
    ++++++++++++++++++++
    +                  +
    +   Introduce la   +
    +      clave:      +
    +                  +
    ++++++++++++++++++++

    > foo
    ¡Clave incorrecta!

We can try keys until we get bored, but the next step would be disassembling the whole thing. What we usually use is
[`cutter`](https://cutter.re), the graphical frontend for [`rizin`](https://rizin.re). Given the controversy that gripped
the original project (i.e. `radare2`) we decided to switch some time ago...

At any rate, after opening up the binary in `cutter` the first thing we have to look for is the program's entrypoint, `main()`:

```asm
0x000014a1      call    exit       ; sym.imp.exit ; void exit(int status)
int main (int argc, char **argv, char **envp);
; var char **var_10h @ rbp-0x10
; var uint64_t var_4h @ rbp-0x4
; arg int argc @ rdi
; arg char **argv @ rsi
0x000014a6      push    rbp
0x000014a7      mov     rbp, rsp
0x000014aa      sub     rsp, 0x10
0x000014ae      mov     dword [var_4h], edi ; argc
0x000014b1      mov     qword [var_10h], rsi ; argv
0x000014b5      cmp     dword [var_4h], 3
0x000014b9      je      0x14c7
0x000014bb      mov     eax, 0
0x000014c0      call    fcn.00001165
0x000014c5      jmp     0x14dd
0x000014c7      lea     rdi, str.Clave_incorrecta ; 0x2097 ; const char *s
0x000014ce      call    puts       ; sym.imp.puts ; int puts(const char *s)
0x000014d3      mov     edi, 0xffffffff ; -1 ; int status
0x000014d8      call    exit       ; sym.imp.exit ; void exit(int status)
0x000014dd      mov     eax, 0
```

It might be a bit easier to look at the decompilation:

```c
#include <stdint.h>

int32_t main (char ** argv, int32_t argc) {
    char ** var_10h;
    uint64_t var_4h;
    rsi = argv;
    rdi = argc;
    var_4h = edi;
    var_10h = rsi;
    if (var_4h != 3) {
        eax = 0;
        fcn_00001165 ();
    } else {
        puts ("\u00a1Clave incorrecta!");
        exit (0xffffffff);
    }
    eax = 0;
    return eax;
}
```

It looks like if we get the password right function `fcn_00001165()` will output the flag: otherwise the message `Clave incorrecta!` gets
printed... One can look at the `entry_init1()` function. We'll stick to decompilation for now: it's much easier to read!

```c
#include <stdint.h>
 
int64_t entry_init1 (char ** arg2, int64_t arg1) {
    char ** argv;
    int64_t var_4h;
    rsi = arg2;
    rdi = arg1;
    var_4h = edi;
    argv = rsi;
    puts ("++++++++++++++++++++");
    puts ("+                  +");
    puts ("+   Introduce la   +");
    puts ("+      clave:      +");
    puts ("+                  +");
    puts ("++++++++++++++++++++");
    eax = 0;
    printf (0x00002066);
    rsi = 0x00004060;
    rdi = "%14s";
    eax = 0;
    isoc99_scanf ();
    eax = *(0x00004060);
    eax = (int32_t) al;
    edx = *(0x0000406d);
    edx = (int32_t) dl;
    eax -= edx;
    if (eax != 0xffffffea) {
        eax = *(0x00004060);
        edx = (int32_t) al;
        eax = *(0x0000406d);
        al = (al != 0x16) ? 1 : 0;
        eax = (int32_t) al;
        if (edx != eax) {
            rax = argv;
            main (3, argv);
        }
    } else {
        eax = *(0x00004061);
        eax = (int32_t) al;
        edx = *(0x0000406c);
        edx = (int32_t) dl;
        eax -= edx;
        if (eax != 0xa) {
            eax = *(0x00004061);
            edx = (int32_t) al;
            eax = *(0x0000406c);
            al = (al != 0x7a) ? 1 : 0;
            eax = (int32_t) al;
            if (edx != eax) {
                rax = argv;
                main (3, argv);
            }
        } else {
            eax = *(0x00004062);
            eax = (int32_t) al;
            edx = *(0x0000406b);
            edx = (int32_t) dl;
            eax -= edx;
            if (eax != 0xffffffea) {
                eax = *(0x00004062);
                edx = (int32_t) al;
                eax = *(0x0000406b);
                al = (al != 0x3a) ? 1 : 0;
                eax = (int32_t) al;
                if (edx != eax) {
                    rax = argv;
                    main (3, argv);
                }
            } else {
                eax = *(0x00004063);
                eax = (int32_t) al;
                edx = *(0x0000406a);
                edx = (int32_t) dl;
                eax -= edx;
                if (eax != 0xffffffcc) {
                    eax = *(0x00004063);
                    edx = (int32_t) al;
                    eax = *(0x0000406a);
                    al = (al != 0x5c) ? 1 : 0;
                    eax = (int32_t) al;
                    if (edx != eax) {
                        rax = argv;
                        main (3, argv);
                    }
                } else {
                    eax = *(0x00004064);
                    eax = (int32_t) al;
                    edx = *(0x00004069);
                    edx = (int32_t) dl;
                    eax -= edx;
                    if (eax != 0x35) {
                        eax = *(0x00004064);
                        edx = (int32_t) al;
                        eax = *(0x00004069);
                        al = (al != 0x5f) ? 1 : 0;
                        eax = (int32_t) al;
                        if (edx != eax) {
                            rax = argv;
                            main (3, argv);
                        }
                    } else {
                        eax = *(0x00004065);
                        eax = (int32_t) al;
                        edx = *(0x00004068);
                        edx = (int32_t) dl;
                        eax -= edx;
                        if (eax != 0xffffffdc) {
                            eax = *(0x00004065);
                            edx = (int32_t) al;
                            eax = *(0x00004068);
                            al = (al != 0x2c) ? 1 : 0;
                            eax = (int32_t) al;
                            if (edx != eax) {
                                rax = argv;
                                main (3, argv);
                            }
                        } else {
                            eax = *(0x00004066);
                            eax = (int32_t) al;
                            edx = *(0x00004067);
                            edx = (int32_t) dl;
                            eax -= edx;
                            if (eax != 0xfffffffa) {
                                eax = *(0x00004066);
                                edx = (int32_t) al;
                                eax = *(0x00004067);
                                al = (al != 0xa) ? 1 : 0;
                                eax = (int32_t) al;
                                if (edx != eax) {
                                    rax = argv;
                                    main (3, argv);
                                }
                            } else {
                                puts ("\u00a1Clave correcta! Aqui tienes tu flag:");
                            }
                        }
                    }
                }
            }
        }
    }
    rax = argv;
    main (1, argv);
    return exit (0);
}
```

Judging by the contents of `main()` the flag will only be printed if we reach the `main(1, argv)` call. If the argument
is `3`, the `Clave incorrecta!` message will be shown... At this point we can take one of two paths:

1. We can try to find the password satisfying all the checks so that we reach `main(1, argv)`. This way we can just invoke
   the program and supply the correct password to get the flag.

2. We can run `fcn_00001165()` whilst debugging it so that we can reconstruct the flag itself. That's what we'll be doing!

`Cutter` lets you **emulate** the program: we can also set up a couple of breakpoints to make our task a bit easier! When
execution stops we can inspect the values of any registers. However, before diving into the code let's take a look at
the function in question:

```asm
fcn.00001165 ();
; var const char *var_12h @ rbp-0x12
; var int64_t var_4h @ rbp-0x4
0x00001165      push    rbp
0x00001166      mov     rbp, rsp
0x00001169      sub     rsp, 0x20
0x0000116d      mov     dword [var_4h], 0
0x00001174      jmp     0x11c0
0x00001176      mov     eax, dword [var_4h]
0x00001179      cdqe
0x0000117b      mov     edx, 6
0x00001180      sub     rdx, rax
0x00001183      lea     rax, [0x00004048]
0x0000118a      movzx   eax, byte [rdx + rax]
0x0000118e      xor     eax, 0x63
0x00001191      mov     edx, eax
0x00001193      mov     eax, dword [var_4h]
0x00001196      cdqe
0x00001198      mov     byte [rbp + rax - 0x12], dl
0x0000119c      mov     eax, dword [var_4h]
0x0000119f      cdqe
0x000011a1      lea     rdx, str.NhT ; 0x404f
0x000011a8      movzx   edx, byte [rax + rdx]
0x000011ac      mov     eax, dword [var_4h]
0x000011af      cdqe
0x000011b1      add     rax, 7
0x000011b5      xor     edx, 0x37
0x000011b8      mov     byte [rbp + rax - 0x12], dl
0x000011bc      add     dword [var_4h], 1
0x000011c0      mov     eax, dword [var_4h]
0x000011c3      cmp     eax, 6
0x000011c6      jbe     0x1176
0x000011c8      lea     rax, [var_12h]
0x000011cc      mov     rsi, rax
0x000011cf      lea     rdi, str.flag__s ; 0x2008 ; const char *format
0x000011d6      mov     eax, 0
0x000011db      call    printf     ; sym.imp.printf ; int printf(const char *format)
0x000011e0      nop
0x000011e1      leave
0x000011e2      ret
```

Now that's barely readable is it? Let's inspect the decompiled version now:

```c
int64_t fcn_00001165 (void) {
    const char * var_12h;
    int64_t var_4h;
    var_4h = 0;
    while (eax <= 6) {
        eax = var_4h;
        rax = (int64_t) eax;
        edx = 6;
        rdx -= rax;
        rax = 0x00004048;
        eax = *((rdx + rax));
        eax ^= 0x63;
        edx = eax;
        eax = var_4h;
        rax = (int64_t) eax;
        *((rbp + rax - 0x12)) = dl;
        eax = var_4h;
        rax = (int64_t) eax;
        rdx = "NhT_";
        edx = *((rax + rdx));
        eax = var_4h;
        rax = (int64_t) eax;
        rax += 7;
        edx ^= 0x37;
        *((rbp + rax - 0x12)) = dl;
        var_4h++;
        eax = var_4h;
    }
    rax = &var_12h;
    rsi = rax;
    eax = 0;
    printf ("flag{%s}\n");
    return rax;
}
```

The function basically iterates `7` times to then call `printf` to print the flag. What's more, the `char*` being
passed to `printf()` is `var_12h` which, according to the disassembled function is initialized to `rbp - 0x12`.
Now, the key to the whole thing are both `*((rbp + rax - 0x12)) = dl` lines. What's going on there is that the
contents of register `rax` are indexing the string pointed to by `var_12h` (remember it's initial address is
`rbp - 0x12`) so that the contents of `dl` are inserted at index `rax`. We could work out all the values of `dl`
and `rax` at each iteration, but we'd rather make use of `cutter`'s emulator :P Just set up a breakpoint on each
of these lines before moving on and you should be good to go.

### Just a note on register names
Modern `64` bit machines use, well, `64` bit registers. The different ways of addressing the registers allow us
to access different subsets of those `64` bits. In the case of the `A` register so to speak we can refer to:

- The full `64` bits as `RAX`.
- The lower `32` bits as `EAX`.
- The lower `16` bits as `AX`.
- The lower `8` bits as `AL`.
- Bits `8` through `15` (i.e. the top half of `AX`) as `AH`.

Please refer to [this StackOverflow post](https://stackoverflow.com/questions/15191178/how-do-ax-ah-al-map-onto-eax) for
more info! The bottom line is whenever you see `RAX`, `EAX`, `AX`, `AL` or `AH` you can just think `A` register.

The following table illustrates the values of `RAX` and `RDX` at each breakpoint. Remember `RAX` is the index into the
string and `RDX` provides each inserted byte!

| Breakpoint Stop | New Character Index (`RAX`) | New Character (`RDX`) |
| :-------------: | :-------------------------: | :-------------------: |
|       00        |            `0x00`           |       `0x74 = t`      |
|       01        |            `0x07`           |       `0x79 = y`      |
|       02        |            `0x01`           |       `0x30 = 0`      |
|       03        |            `0x08`           |       `0x5f = _`      |
|       04        |            `0x02`           |       `0x30 = 0`      |
|       05        |            `0x09`           |       `0x63 = c`      |
|       06        |            `0x03`           |       `0x5f = _`      |
|       07        |            `0x0a`           |       `0x68 = h`      |
|       08        |            `0x04`           |       `0x6d = m`      |
|       09        |            `0x0b`           |       `0x33 = 3`      |
|       10        |            `0x05`           |       `0x34 = 4`      |
|       11        |            `0x0c`           |       `0x6b = k`      |
|       12        |            `0x06`           |       `0x6e = n`      |
|       13        |            `0x0d`           |       `0x73 = s`      |

If we reorder them based on the index we get: `t00_m4ny_ch3ks`. Remember the `printf()` call: this string is enclosed
by `flag{}`, which means the challenges flag is `flag{t00_m4ny_ch3ks}`.

## Slow Mobius
In this case we're handed another binary: `justaprintf`. The strategy we followed is similar: we began by running it.

    $ ./justaprintf
    flag?: VInJTkxTLMq|q\rNU}Qqpiun

If you run it several times you get different flags, which hints at some time-based random number generation... The next
step is firing `cutter` up again and looking at `main()`'s (well, its beginning) disassembly:

```asm
int main (int argc, char **argv, char **envp);
; var int64_t var_3ch @ rbp-0x3c
; var int64_t var_38h @ rbp-0x38
; var int64_t var_30h @ rbp-0x30
; var int64_t var_28h @ rbp-0x28
; var int64_t var_20h @ rbp-0x20
; var int64_t var_18h @ rbp-0x18
; var int64_t canary @ rbp-0x8
0x0000134a      endbr64
0x0000134e      push    rbp
0x0000134f      mov     rbp, rsp
0x00001352      sub     rsp, 0x40
0x00001356      mov     rax, qword fs:[0x28]
0x0000135f      mov     qword [canary], rax
0x00001363      xor     eax, eax
0x00001365      movabs  rax, 0x7449687b67616c66 ; 'flag{hIt'
0x0000136f      movabs  rdx, 0x687468546977454d ; 'MEwiThth'
0x00001379      mov     qword [var_30h], rax
0x0000137d      mov     qword [var_28h], rdx
0x00001381      movabs  rax, 0x65424b636f4c4345 ; 'ECLocKBe'
0x0000138b      mov     qword [var_20h], rax
0x0000138f      mov     dword [var_18h], 0x7d4d41 ; 'AM}'
0x00001396      mov     edi, 0     ; time_t *timer
0x0000139b      call    time       ; sym.imp.time ; time_t time(time_t *timer)
0x000013a0      mov     edi, eax   ; int seed
0x000013a2      call    srand      ; sym.imp.srand ; void srand(int seed)
0x000013a7      mov     dword [var_3ch], 0
0x000013ae      jmp     0x1483
0x000013b3      mov     eax, 0
0x000013b8      call    f2         ; sym.f2
0x000013bd      mov     qword [var_38h], rax
0x000013c1      mov     eax, dword [var_3ch]
0x000013c4      and     eax, 1
0x000013c7      test    eax, eax
0x000013c9      jne     0x1424
0x000013cb      mov     eax, dword [var_3ch]
0x000013ce      cdqe
0x000013d0      movzx   eax, byte [var_30h + rax]
0x000013d5      mov     edi, eax
0x000013d7      mov     rax, qword [var_38h]
0x000013db      mov     edx, dword [rax]
0x000013dd      mov     rax, qword [var_38h]
0x000013e1      add     rax, 8
0x000013e5      mov     eax, dword [rax]
0x000013e7      add     edx, eax
0x000013e9      movsxd  rax, edx
0x000013ec      imul    rax, rax, 0x66666667
```

One thing that struck us is that the flag is practically readable as is: `flag{hItMEwiThthECLocKBeAM}`. You can
check the binary at the addresses passed to the `movabs` instructions and find these strings. Given the name
of the challenge we found out [Slow Mobius](https://rickandmorty.fandom.com/wiki/Slow_Mobius) is actually a
character in Rick and Morty, so the flag's contents made sense... Anyway, it was the solution, so we didn't
give it any more thought!

## Token Vault
In this challenge we are pointed to an Ethereum contract in two different test nets. We'll look at the one
on Sepolia, which we can inspect on [`Etherscan`](https://sepolia.etherscan.io/address/0x1776645C7f4995c83249e16D7a626Bc10a3c905c).
Whose address is `0x1776645C7f4995c83249e16D7a626Bc10a3c905c`.

The key piece of information can be obtained by going through the [contract code](https://sepolia.etherscan.io/address/0x1776645C7f4995c83249e16D7a626Bc10a3c905c#code).
Aside from all the additional code, the most important bit is the constructor of the `ERC1155` token included below
for convenience:

```solidity
constructor(bytes32 _password) ERC1155("ipfs://QmSdnK8U7BgdVrVL1r8wKxgVwvF55edJdwEMWzQ6J7A3bZ") {
    PASSWORD = _password;
}
```

Two things immediatly pop out:

1. The constructor receives some kind of object stored on [IPFS](https://ipfs.tech/) whose URI is
   `ipfs://QmSdnK8U7BgdVrVL1r8wKxgVwvF55edJdwEMWzQ6J7A3bZ`.
2. When invoked, a *password* must be supplied which is then stored on the `PASSWORD` variable.

Let's look at the seconf bullet point. If you browse to the bottom of the
[contract code](https://sepolia.etherscan.io/address/0x1776645C7f4995c83249e16D7a626Bc10a3c905c#code). You
can see the arguments passed to the constructro upon contract creation:

    -----Decoded View---------------
    Arg [0] : _password (bytes32): 0x4164614c6f76656c616365403230323400000000000000000000000000000000

We can run the raw `_password` through [`CyberChef`](https://gchq.github.io/CyberChef/) (thanks `@elserio` for that!) to
find that, when interpreted as ASCII characters, the password is `AdaLovelace@2024`. In case it's your first time
using `CyberChef` you can just use the **From Hex** operation to decode the data.

Okay, we now have a password but really nothing to use it with. Let's focus on the first bullet point: we need to
grab the content of the IPFS URI. To do so we can use [`ipget`](https://github.com/ipfs/ipget):

    $ ipget QmSdnK8U7BgdVrVL1r8wKxgVwvF55edJdwEMWzQ6J7A3bZ -o token.init
    $ cat.init
    {
        "name": "CTF Byron 2024 Reward",
        "description": "Reward for completing the token vault challenge.",
        "flag": "TMgzlqsOfgaWVulLOmWrLg==",
        "algorithm": "AES 256 CBC",
        "image": "ipfs://QmRZSKCco2Xja3bNVYr8FybuqSXnZw8jQg9HdqNjVYYyAi",
        "external_url": "https://byronlabs.io"
    }

Well well, it looks like we have our flag already! But... it's encrypted! The good news is we have a password to try out.
We can leverage `CyberChef` once again! Bear in mind the trailing `==` in the content of `flag` is indicative of a `Base64`
encoding. We then need to decode the content and then run it through AES decryption. The recipe then becomes:

1. **From Base64** with *alphabet* `A-Za-z0-9+/=`.
2. **AES Decrypt** with *key* `AdaLovelace@2024` in *Latin 1* format, *IV* `0000000000000000000000000000000` (i.e. 16 bytes for AES 128)
   *mode* `CBC` and a `Raw` *intput* and *output*.

It's crucial to note the JSON document retrieved from IPFS specifies the encryption algorithm is `AES 256 CBC`, but given the
input to `CyberChef` it looks like the used algorithm was `AES 128 CBC` instead. We initially tried to leverage `openssl(1)` for
the decryption and trying to get `AES 256 CBC` to work was impossible...

We almost forgot! The decryption gives us the flag right away: `flag{v1t4l1k}`.

Unlike what we initially assumed, there's no need to run any transactions whatsoever! If you went that route we hope you found
[Automata's Sepolia Faucet](https://www.sepoliafaucet.io/): its the one that worked out best for us...

## And the rest?
Well, that's all the challenges we did... If you want to add the writeup for a new one feel more than free to do so! You can even
open a PR to this [site's repository](https://github.com/pcolladosoto/pcolladosoto.github.io)!

---

If you have any comments, questions or suggestions, feel free to drop me an email!

Thanks for your time! Hope you found this useful :smile_cat:
