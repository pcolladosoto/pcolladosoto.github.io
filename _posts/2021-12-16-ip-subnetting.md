---
title: An introduction to subnetting in IP networks
tags: networking fundamentals IPv4 IPv6
aside:
  toc: false
---

# What was an IP again?
Let's start at the 'beginning'. When computers communicate among themselves they need to refer to other parties involved in the communication in some way or another. In the context of today's Internet, machines identify themselves through *IP addresses*.

Notice how the entire article is named '*What was an IP again?*'. That is purposefully *incorrect*. In order to understand why, we need to take a (small) step back and briefly visit the [*OSI Model*](https://en.wikipedia.org/wiki/OSI_model).

## A quick look at OSI
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
2. Each of the octets in an address will be a number between `0` and `255`. This follows from the fact that a byte's value belongs to the `[0, 2^8 - 1] = [0, 255]` interval.

From the above, we can be sure that `278.16.1.5` is **not** a valid address. These small caveats are crucial when it comes to spotting errors in network configurations.

## Time for subnets!
