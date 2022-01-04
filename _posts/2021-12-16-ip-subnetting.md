---
title: An introduction to subnetting in IP networks
tags: networking fundamentals IPv4 IPv6
aside:
  toc: false
---

# What was an IP again?
Let's start at the 'beginning'. When computers communicate among themselves they need to refer to other parties involved in the communication in some way or another. In the context of today's Internet, machines identify themselves through *IP addresses*.

Notice how the entire article is named '*What was an IP again?*'. That is purposefully *incorrect*. In order to understand why, we need to take a (small) step back and briefly visit the [*OSI Model*](https://en.wikipedia.org/wiki/OSI_model).

## A quick look at the OSI Model
When approaching any topic in networking, it's usually a good idea to have a conceptual grasp of whatever it is we are up against. At a lowish level, that usually implies thinking about where the topic at hand fits within the layers defined in the OSI model. For our purposes, we will only focus on the [*network layer*](https://en.wikipedia.org/wiki/Network_layer) (i.e. *layer 3*) of said model: a full blown description of OSI is well beyond the scope of this article.

If, on the other hand, you feel more inclined towards the *TCP/IP* model of networks, this discussion would them belong within the *internet layer*. A good comparison of both models can be found [here](https://www.cloudflare.com/en-gb/learning/network-layer/what-is-the-network-layer/).

In any case, we should that what we identify at layer 3 (i.e. L3) are *hosts*, or more precisely, *network interfaces*. For our discussion of subnetting we can safely assume a host has a single network interface, but that might not always be the case (I'm looking at you, routers). That is, L3 identifiers refer to hosts.

After all this nonsense, we can finally see why saying 'machine A has IP X.Y.Z.K' is wrong: IP is the L3 protocol, what a machine 'has' is an *IP address*. You can read up more (quite a lot more actually) on IP on its [RFC](https://datatracker.ietf.org/doc/html/rfc791).

As a fun fact, we would like to mention that there are indeed some other L3 protocols besides IP. An example of that would be [X.25](https://www.farsite.com/X.25/X.25_info/X.25.htm). Things here get a bit messy, as X.25 predates the OSI model, which is why X.25 should be regarded more as a protocol suite that includes a L3 protocol on its [*packet layer*](https://en.wikipedia.org/wiki/X.25#Relation_to_the_OSI_Reference_Model). Even though IP has pretty much conquered the world in terms of extension and usage, we shouldn't forget some other options exist. We even have circuit-switched instead of packet-switched networks too! That's a story for another time though...

## But then, what's an IP address?
Now that we know the 'correct' term when referring to addresses, we can discuss what they really are: just a [32-bit number](https://datatracker.ietf.org/doc/html/rfc791#section-3.1). Pretty anticlimactic right? However, this makes it very easy to conceptually work with IP: we can establish a number-to-machine correspondence when we think about how messages are addressed to a computer.

We humans are clumsy machines. Thus, making us work with these 32-bit addresses in a binary format is a recipe for disaster. That's the reason why you will almost never see an IP address as something like this:

    10101001011010010100001010101010

Imagine a machine you just configured can't be contacted: can you be sure you didn't mess up one of those `1`s and `0`s? In order to make these addresses more wieldy, we break them up into *bytes* and then present each of those bytes as a *base 10* number. Why base 10 numbers? They are the ones we use every day! This makes it a bit more 'familiar' to work with addresses. The following shows how we can get a 'raw' address in *binary* and then transform it into a familiar IP address:

    # This is our initial raw address
    11000000101010000000000100000001

    # Let's add a space between each byte to make it easier to work with
    11000000 10101000 00000001 00000001

    # Time to transform them to decimal. We'll do it a byte at a time.
        # Note the `d` suffix on base 10 numbers and the `b` suffix on binary numbers.
        # Note `a * b` is to be read as 'a times b'.
        # Note `a^b` is to be read as 'a to the power of b'.

        # ByteA
        11000000b = 1 * 2^7 + 1 * 2^6 + 0 * 2^5 + 0 * 2^4 + 0 * 2^3 + 0 * 2^2 + 0 * 2^1 + 0 * 2^0 = 192d

        # ByteB
        10101000b = 1 * 2^7 + 0 * 2^6 + 1 * 2^5 + 0 * 2^4 + 1 * 2^3 + 0 * 2^2 + 0 * 2^1 + 0 * 2^0 = 168d

        # ByteC
        00000001b = 0 * 2^7 + 0 * 2^6 + 0 * 2^5 + 0 * 2^4 + 0 * 2^3 + 0 * 2^2 + 0 * 2^1 + 1 * 2^0 = 1d

        # ByteD
        00000001b = 0 * 2^7 + 0 * 2^6 + 0 * 2^5 + 0 * 2^4 + 0 * 2^3 + 0 * 2^2 + 0 * 2^1 + 1 * 2^0 = 1d

    # Then, our resulting IP address in the familiar format would be:
    11000000101010000000000100000001 -> ByteA.ByteB.ByteC.ByteD -> 192.168.1.1

Even though the above is nice for illustrative purposes, it's something we usually find tiring and error prone. Besides, it requires knowledge of representation systems such as binary... That's why people usually resort to calculators that do this out of the box. A good example would be [this one](https://codebeautify.org/binary-to-ip-converter). If you're into Python, you can also take a look at a (very simple) library we made: [iptool](https://github.com/pcolladosoto/iptool). These transformations are something you won't need on a daily basis. However, knowing what IP addresses are is crucial for understanding what subnets are and how they work.

If you had no idea about what was going on in the snippet above, be sure to check [this site](https://www.mathsisfun.com/binary-number-system.html) for a quick introduction on what binary numbers are and how they work.

### Things to note
After learning how we can build a familiar representation of an IP address from the real thing, we can see how:

1. We can generate `2^32 = 4294967296` unique address ranging from `0` to `2^32 - 1 = 4294967295`. Given each Internet-capable device should have its own, unique address, the number is not that large. This is one of the aspects that motivated the appearance and proliferation of [NATs](https://en.wikipedia.org/wiki/Network_address_translation).

2. Each of the octets in an address will be a number between `0` and `255`. This follows from the fact that a byte's value belongs to the `[0, 2^8 - 1] = [0, 255]` interval. Thus, we can be sure that `278.16.1.5` is **not** a valid address. This 'rule of thumb' is crucial when it comes to spotting errors in network configurations.

## What's the difference between IPv4 and IPv6?
We actually have a better question: what happened to IPv5? The real answer is it never became an official protocol. It was mainly geared towards streaming and real-time applications such as VoIP. Given it used 32-bit addresses it suffered from the same problems than IPv4 and so it was never standardized. You can read (a bit) more on that [here](https://www.lifewire.com/what-happened-to-ipv5-3971327).

Jokes aside, we haven't been *completely* honest with you :scream:. Like many things in the realm of computing, the IP protocol comes in several versions. Up to now we have been dealing with the 'standard' version: IPv4. The thing is, IPv4 was designed at a time where few people could've predicted the adoption the Internet was going to have. After all, networks were born within a military context as a project for the *Defense Advanced Research Projects Agency* (i.e. *DARPA*). Once it was made available to general users some design problems became more noticeable, the most obvious being the shortage of available addresses.

Then, on 1995, the original [IPv6 RFC](https://datatracker.ietf.org/doc/html/rfc1883) is published. Many people (myself included for quite some time) deem IPv6 as 'IPv4 with longer addresses'. However, this approach just misses quite a lot of what IPv6 brings to the table: Link Local Addresses, Unique Local Addresses, restricted datagram fragmentation... You can read more on that [here](https://en.wikipedia.org/wiki/Unique_local_address), [here](https://blog.zivaro.com/need-know-link-local-ipv6-addresses) and [there](https://blogs.infoblox.com/ipv6-coe/common-ipv6-newbie-questions/). You might also want to take a look at the current [IPv6 RFC](https://datatracker.ietf.org/doc/html/rfc8200). [RFC 4864](https://datatracker.ietf.org/doc/html/rfc4864) also offers some very good insight into controversial topics such as why NAT doesn't really add security, something IPv4 supporters usually claim when deciding not migrate to IPv6.

This is not a discussion on IPv6 or a comparison between that and IPv4: we are concerned with subnets and things of that nature. The good thing is the general idea translates seamlessly from IPv4 to IPv6, so the ensuing discussion is applicable to both realms. The most noticeable difference is that IPv6 addresses are 128 bits long instead of 32. That means, we have `2^128 = 3,402823669209385 * 10^38` unique IPv6 addresses: looks like we won't need NAT at all!

### Representing IPv6 addresses
Just like with IPv4, at the end of the day an IPv6 address is a 128 bit integer. However, you'll see them expressed as hexadecimal numbers: they are much more wieldy than base 10 numbers! There are some other differences too:

1. The address is 'broken up' into 16-bit chunks. Given a hex digit can represent the sames quantities as 4 bits, each 16-bit chunk is translated into 4 hex digits. If this sounds alien-y to you, be sure to take a look at [this](https://www.tutorialspoint.com/hexadecimal-number-system) intro. You can also look for 'intro to hex numbers' in a search engine of your choice. We really like DuckDuckGo though :ok_woman:

2. The 16-bit chunks are separated by colons (i.e. `:`).

3. If several consecutive 16-bit chunks are all zeros (i.e. `0`) you can summarize them with two consecutive colons (i.e. `::`). You can only use this **once**!

4. You can drop leading zeros in a chunk (i.e. `0ABC` can be written as `ABC`).

With these rules we find how the following are valid IPv6 addresses:

    2345:425:2ca1::567:5673:23b5 (this would be equivalent to 2345:0425:2ca1:0000:0000:0567:5673:23b5)
    2607:f0d0:1002:51::4         (this would be equivalent to 2607:f0d0:1002:0051:0000:0000:0000:0004)

### Thinks to know and fun facts
Given the natural relation between binary and hex numbers, note we **cannot** write an IPv6 address that's 'too big' as long as we only use valid hex digits (i.e. `0123456789ABCD`) and just 4 of them. In other words, we cannot generate addresses that are wrong but that 'look okay' like `800.433.312.257`. It has just as many digits as `192.168.160.180`, but the former is completely wrong!

A good thing to know is that, if you want to explicitly use an address in applications such as browsers you **need** to enclose them with square brackets (i.e. `[]`). To understand why this is needed think about contacting a web server on a non-default port (i.e. `80` for HTTP and `443` for HTTPS). You would write something like the following in the search bar:

    http://129.168.1.5:8080

Now, if instead of an IPv4 address you use an IPv6 one you would write:

    http://2607:f0d0:1002:51::4:8080

How can the browser tell the port number (i.e. `8080`) apart from the address? They are both delimited through colons... Even though some rather complex logic could work things out, it's easier to just 'guard' the address with a well known character. That way, the browser (or any application) can quickly extract the address and begin sending stuff. Thus, the following is what you *should* write to contact that same process:

    http://[2607:f0d0:1002:51::4]:8080

## Who manages this?
Now we have been introduced to IPv4 and IPv6 addresses. Time for a pat in the back! :clap:

Managing all these addresses comes with quite a lot of organizational overhead. Even though it's not the topic of this article, we would like to mention that addresses are manged by several organizations (Regional Internet Registrars) that are geographically distributed:

| Geographical Area |     RIR      |                       Website                      |
| :---------------: | :----------: | :------------------------------------------------: |
|      Europe       |     RIPE     |   [https://www.ripe.net/](https://www.ripe.net/)   |
|  Asia & Pacific   |     APNIC    |   [https://www.apnic.net](https://www.apnic.net)   |
|      Africa       |    AFRINIC   | [https://www.afrinic.net](https://www.afrinic.net) |
|   Latin America   |     LACNIC   |  [https://www.lacnic.net](https://www.lacnic.net)  |
|   North America   |     ARIN     |    [https://www.arin.net](https://www.arin.net)    |

This doesn't really concern us, but the sites are a great information source and I find this type of thing quite interesting :woman_shrugging:

## Time for subnets!
Now it's time to picture ourselves as network administrators...

