---
title: An introduction to subnetting in IP networks
tags: ["networking-fundamentals", "IPv4", "IPv6"]
date: "2021-12-16"
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
|  Asia & Pacific   |     APNIC    |   [https://www.apnic.net](https://www.apnic.net)   |
|      Africa       |    AFRINIC   | [https://www.afrinic.net](https://www.afrinic.net) |
|   Latin America   |     LACNIC   |  [https://www.lacnic.net](https://www.lacnic.net)  |
|   North America   |     ARIN     |    [https://www.arin.net](https://www.arin.net)    |

This doesn't really concern us, but the sites are a great information source and I find this type of thing quite interesting :woman_shrugging:

## Time for subnets!
Now it's time to picture ourselves as network administrators... How would we go about managing a corporate network or even a home network? Should we manage addresses as a bunch of loose identifiers with no relation whatsoever? As you might have guessed, that's not how stuff works!

Simply put, subnets are *logical* divisions of the IP address space. Now, that sounds like some new-age mumbo jumbo right? It's often said that the Internet is a *network of networks*. It's something most of us repeat like a mantra but... what does it mean?

Many of us have never worked with networks detached from the Internet. The common use case of a home LAN (Local Area Network) is often (if not always) equipped with an Internet-capable connection. The thing is, this network could be completely isolated from the Internet and still be very useful. We could access local services like, for instance, a Minecraft server running on a machine plugged into our home router. We can now begin to see how LANs are networks in their own right. It just so happens that we decide to connect them to the larger Internet.

Like our home, many others are also connected to the Internet. This not only happens with domestic LANs: corporate networks are a common example of local networks that are attached to the Internet in some way or another. The great thing with this idea is that, no matter how big a given network is, we can always regard it as a local network that's attached to the larger Internet. We can even move a step further and subdivide a local network into more subnets. A sub-subnet would then be attached to a network of networks (the original, large subnet) which itself is attached to the Internet. You see how we can stack subnets on and on? This is what we mean by subnets being a logical division: they help us organize stuff.

Aside from easing easing network management, subnets also make the Internet more efficient. We a machine *A* sends a datagram to a machine *B* it has to be forwarded through an arbitrary number of routers (or, more specifically, layer 3 switches). These routers don't know where **every** IP address can be reached: if they did, they would need to have lookup tables with `2^32` entries for IPv4 and with `2^128` entries for IPv6! Instead they contain a 'rough' estimate of where the datagrams need to be forwarded. This rough estimate comes in the shape of subnets: routers know where to forward a packet so that it gets closer to the destination subnet. They can rest assured that as the packet travels it will reach routers knowing more and more about the actual destination of the datagram. In this way, the datagram traverses a 'funnel' until it reaches its destination.

If we continue 'abusing' the funnel metaphor we can establish a relation between the funnel's diameter and the specificity of the subnet. In other words, the smaller the subnet (that is, the less addresses it contains) the smaller the funnel's diameter. This idea is at the heart of the [longest matching prefix](https://en.wikipedia.org/wiki/Longest_prefix_match) rule on routers. We are deviating a bit from the topic of subnets at this point and entering the realm of routing. However, these two concepts are intrinsically related. Routing deems the Internet as a collection of arbitrarily sized subnets. This allows routing to be done in a hierarchical, orderly and efficient manner.

Now that we have a loose idea of what subnets are let's take a look at how they're specified. We really think it will make matters that much clearer!

### Specifying subnets
From an address point of view, a subnet is just a set of addresses. Nowadays these are almost always specified using the [CIDR](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing) (Classless Inter-Domain Routing) syntax, but we'll also take a look at the 'traditional' way of defining them. We'll even look at classful subnets!

Subnets are specified by an *network address* and a *subnet mask*. The term mask is used due to how these two are related: the mask is applied to the address through a set of bitwise operators. These bitwise operators are the classic `AND`, `OR`, `XOR` and `NOT`. For those who learned programming in C, the operators are `&`, `|`, `^` and `~`. This way of handling numbers is very common in the realm of electronics. It's very common to have to handle (and often burn) physical `AND` and `NOT` gates on digital electronics courses...

We're presenting the outcome of logical operations in a couple table as a reminder:

| A | B | AND | OR | XOR | NOT A |
|:-:|:-:|:---:|:--:|:---:|:-----:|
| 0 | 0 |  0  | 0  |  0  |   1   |
| 0 | 1 |  0  | 1  |  1  |   1   |
| 1 | 0 |  0  | 1  |  1  |   0   |
| 1 | 1 |  1  | 1  |  0  |   0   |

We'll start by defining subnets in a somewhat 'arid' way. We promise examples will make this clearer.

1. A subnet's network address is defined as the result of applying the `AND` operation to the subnet's address and subnet mask:

        net_addr = subnet_addr & subnet_mask

2. A subnet's broadcast address is defined as the result of applying the `OR` operation to subnet's address and the inverse of the subnet mask:

        brd_addr = subnet_addr | (~subnet_mask)

3. The subnet's addresses are contained in the `[net_addr, brd_addr]` interval:

        net_addr <= a_subnet_addr <= brd_addr

Yeah, we know: what does that even mean? Let's begin by looking into what the network and broadcast addresses are.

### The subnet's limits
The lowest and highest addresses in a subnet do theoretically belong to a subnet. However, unless we are dealing with a point-to-point link not all of them are 'usable':

1. The *network address* is the lowest one in the subnet's range. This address has no 'real' use in practice: it just identifies the network. This address is the one that will often be provided with the subnet mask to identify the actual subnet. Even though we'd bending the definition of subnets, we can unambiguously identify a subnet with a handful of addresses as long as we provided the correct subnet mask. However, the most common choice is the network address as it makes things much clearer.

2. The *broadcast address* is the larges address in the subnet's range. When a host addresses a datagram to this address it's broadcasted to the entire subnet. This address **is not** forwarded across routers. Back in the day it was (wrongly) forwarded. This opened up the possibility for [Smurf Attacks](https://en.wikipedia.org/wiki/Smurf_attack), which made it possible to have the entire Internet pinging a poor machine...

In the specific case where we have just two machines on a single link these two addresses loose quite a lot of meaning: each machine would have one of the two addresses on that subnet. One of them would indeed be the network address and the other one would be the subnet address... The catch is some implementations will not allow machines to use these two addresses as regular IP addresses at all... In any case, this is more of a toy example, don't take it too seriously :upside_down_face:.

You can find a nice discussion on network and broadcast addresses on the [Network Engineering StackExchange](https://networkengineering.stackexchange.com/questions/11200/what-is-the-purpose-of-network-address)

### The subnet mask
A subnet mask is just a string of as many bits as the IP address: it's 32 bits long on IPv4 and 128 bits long on IPv6. When we were dealing with addresses we found out how we preferred to express them as decimal or hex numbers so that we could have an easier time handling them. The picture is a bit different when dealing with subnet masks. As we need to combine them with network addresses through bit-level operations we'll find it's better to think of them as regular binary numbers.

Now, a subnet mask tells us which bits define the subnet and which identify a machine **within** that subnet. It logically divides the address in two distinct parts. Wherever we find a `1` on the subnet mask, we can be sure that bit is part of the subnet address: addresses with the exact same subnet address bits belong to the same subnet. Those bits showing a `0` on the subnet mask will be used to identify hosts belonging to that subnet. Thus, we can regard the subnet mask as a number telling us which bits define a logical address block. Those that can be 'freely' altered identify machines within that block.

Let's look at an example with a real-world scenario. We'll always be working with the `192.168.1.0` subnet address and a subnet mask of `11111111 11111111 11111111 00000000`. Notice we have purposefully spaced the binary number so that it's easier to read. However, the spaces have no 'real' meaning. Let's apply the operations:

    net_addr = subnet_addr & subnet_mask

    11000000 10101000 00000001 00000000 <- subnet_addr (Recall the example of address-to-binary conversion we presented before!)
    11111111 11111111 11111111 00000000 <- subnet_mask
    ----------------------------------- <-     AND
    11000000 10101000 00000001 00000000 -> 192.168.1.0

    brd_addr = subnet_addr | (~subnet_mask)

    11000000 10101000 00000001 00000000 <-  subnet_addr
    00000000 00000000 00000000 11111111 <- ~subnet_mask
    ----------------------------------- <-      OR
    11000000 10101000 00000001 11111111 ->  192.168.1.255

Now we know that any address belonging to this subnet must be within the `[192.168.1.0, 192.168.1.255]` range. What's more, usable addresses are in the range `[192.168.1.1, 192.168.1.254]` (or `(192.168.1.0, 192.168.1.255)` for those mathematicians out there :stuck_out_tongue_winking_eye:)

If we apply the concept of what a subnet mask is to the above we can see how an IPv4 address such as `192.168.1.3` within the previous subnet can be logically seen as:

              Subnet              Host
    ------------------------- + --------
    11000000 10101000 00000001  00000011

In a more general way, we can regard addresses in this subnet as (`QWERTYZX` each stand for a single bit):

              Subnet              Host
    ------------------------- + --------
    11000000 10101000 00000001  QWERTYZX

This is a key idea that's worth reviewing a couple of times! It's also important to note that the 'larger' the subnet mask is (i.e. the more lading `1`s it has) the less hosts it will be able to provide service to. However, you'll have more subnets at your disposal. It's crucial to know that, no matter how you partition a network into subnets, you'll always have the same number of available addresses (well, you're loosing 2 on each subnet (network and broadcast), but you get the point). Interconnection between subnets is done by routers which can filter traffic, so if you want to have a tight control on traffic flows you can maybe deploy more-but-smaller subnets. If on the other hand you're managing a subnet where every host should 'see' each other you can maybe opt for a large subnet. In the end it's a matter of reaching a compromise based on the network's needs!

### Making subnet masks a bit more wieldy
What if I told you that there's an easier way to define a subnet than by specifying the subnet mask as a binary number? Cool right? Before walking through the two ways of specifying them let's talk a bit about history before.

#### The age of classful networks
We've already seen how the initial design of IPv4 didn't really predict the size the Internet would reach. It estimated a way more modest usage, and so it made several assumptions as to what network sizes were going to likely be. That's why they defined a set of *subnet classes* based on size:

1. Class *A* subnets had an associated mask of `11111111 00000000 00000000 00000000`. They were intended to be deployed wherever a large number of addresses was required.
2. Class *B* subnets had an associated mask of `11111111 11111111 00000000 00000000`. These were designed with mid-sized network needs in mind.
3. Class *C* subnets had an associated mask of `11111111 11111111 11111111 00000000`. These were devised for small networks.
4. Up to now, all IPv4 addresses were *unicast*. Even though it doesn't really concern us, when we send a datagram to a *unicast* address it'll only reach a single machine. When we send it to a *multicast* address, it'll be relayed to (gasp) multiple hosts. A common application of multicast addresses is the broadcast of multimedia streams for instance. Now, class *D* addresses are just that, multicast addresses.
5. The initial design set some addresses apart for experimentation too. These are contained in the so called class *E*.

As you might expect, these definitions only apply to the realm of IPv4. Don't take the above too seriously, you can just read [this Wikipedia entry](https://en.wikipedia.org/wiki/Classful_network) if you want a bit more of information. The bottom line is the initial design of the Internet partitioned the entire IPv4 addressing space into a set of classes, which made subnetting a lot more rigid than it's today.

#### Enter CIDR
CIDR (or, as we said before, Classless Inter-Domain Routing) is a way of defining subnets in a much more flexible way. In terms of notation it all boils down to specifying the subnet mask as `/x`, where `x` is a number on the `[0, 32]` interval. That `x` is just the number of leading `1`s on the subnet mask:

    /1  -> 10000000 00000000 00000000 00000000
    /8  -> 11111111 00000000 00000000 00000000 <- These are the old Class A subnets!
    /12 -> 11111111 11110000 00000000 00000000
    /16 -> 11111111 11111111 00000000 00000000 <- These are the old Class B subnets!
    /24 -> 11111111 11111111 11111111 00000000 <- These are the old Class C subnets!
    /32 -> 11111111 11111111 11111111 11111111

Now we are not restricted to just `/8`, `/16` and `/24`: we can have a `/12` subnet too! This is what motivates the C in CIDR.

An example of a CIDR subnet would be `192.168.1.0/24`, which has usable addresses ranging from `192.168.1.1` to `192.168.1.254`. Note you can also define the subnet as, say, `192.168.1.5/24`. When you apply the `AND` operation to those two you'll end up with the same network address (i.e. `192.168.1.0`). However, people often use the network address for specifying the subnet: it makes understanding stuff easier and that's actually the purpose of the network address...

#### The traditional notation
Those who have worked with Cisco equipment are more used to another syntax. Instead of relying on the `/x` syntax, we can also specify the subnet mask as another dotted decimal address, just like a regular IPv4 address. The following presents some CIDR-to-traditional equivalencies:

    /8  -> /255.0.0.0
    /12 -> /255.240.0.0
    /16 -> /255.255.0.0
    /24 -> /255.255.255.0
    /32 -> /255.255.255.255

Pay special attention to the `/12` case: what's easier to handle, `/12` or `/255.240.0.0`? We at least feel strongly inclined toward the former option... We can define the example subnet in the previous section with this notation as `192.168.1.0/255.255.255.0`.

Evn though a bit more unwieldy, this traditional approach is needed if we are to deal with 'weird' subnets. Imagine the following:

    subnet_mask = 11111111 11111111 11111111 00000001 === 255.255.255.1 === /?

    11000000 10101000 00000001 00000000 <- subnet_addr
    11111111 11111111 11111111 00000001 <- subnet_mask
    ----------------------------------- <-     AND
    11000000 10101000 00000001 00000000 -> 192.168.1.0

    brd_addr = subnet_addr | (~subnet_mask)

    11000000 10101000 00000001 00000000 <-  subnet_addr
    00000000 00000000 00000000 11111110 <- ~subnet_mask
    ----------------------------------- <-      OR
    11000000 10101000 00000001 11111110 ->  192.168.1.254

The subnet defined in the previous example is quite anomalous. According to the concept of what a subnet mask 'tells' us we can see how the addresses belonging to this subnet need to have a `192.168.1` prefix and the also **must** have a trailing `0` (i.e. the least significant bit must be `0`)! The following are examples of valid and invalid addresses:

    11000000 10101000 00000001 00000010 -> 192.168.1.2 belongs to the 192.168.1.0/255.255.255.1 subnet! :)
    11000000 10101000 00000001 00000011 -> 192.168.1.3 doesn't belong to the 192.168.1.0/255.255.255.1 subnet! O_o

### Does an address belong to a subnet?
How can we check we're right? Just `AND` the subnet mask and the candidate IP address together. If the result is the network address for the subnet you're checking it does belong to the subnet at hand. If it doesn't... bad luck!

    subnet_addr = 11000000 10101000 00000001 00000000

    11000000 10101000 00000001 00000010 <- 192.168.1.2
    11111111 11111111 11111111 00000001 <- 255.255.255.1
    ----------------------------------- <-     AND
    11000000 10101000 00000001 00000000 == subnet_addr :)

    11000000 10101000 00000001 00000011 <- 192.168.1.3
    11111111 11111111 11111111 00000001 <- 255.255.255.1
    ----------------------------------- <-     AND
    11000000 10101000 00000001 00000001 != subnet_addr O_o

Even though this example is rather interesting, we have never encountered anything like this in the 'wild'. Notice how the address space for this subnet **is not** consecutive. That is, the first usable address would be `192.168.1.2`, the second one would be `192.168.1.4`, the third one would be `192.168.1.6` and so on. This is bound to confuse users and administrators in the not even long run and, honestly, using this type of subnet masks is asking for trouble...

In a real-world scenario you'll usually (if not always) encounter subnets that can be expressed as a CIDR block. This simplifies checking whether an address belongs to a subnet quite a lot: you just have to see whether the address belongs to the `[net_address, broadcast_address]` range!

### What about IPv6?
Just like we said before, all these subnet ideas transition cleanly to the IPv6 realm. You'll commonly have to deal with CIDR style subnet masks and you'll just have to bear in mind that these can be as high as `/128` instead of `/32`.

### What subnet contains a set of IP addresses?
This question is quite tricky to answer in absolute terms. As with many things in life, the actual answer is it depends... They 'witty' and 'wrong' answer is that the `0.0.0.0/0` subnet contains the given addresses and that's actually always true!

When faced with such a question you should usually ask for more information. Begin by asking for either the network address or the broadcast address. If you know a single address belonging to the target subnet and you apply the definitions of the network and broadcast addresses you can work out thr actual subnet. As an aide you can try to find out the default gateway's (i.e. router's) address. It's usually either the first or last usable address, although this **is not** a requirement. If you know it you can make a pretty educated guess as to what the network or broadcast addresses are.

In any case, this scenario is something that's pretty different from case to case: best of luck!

## Summing up
At this point we've covered pretty much everything pertaining subnets that anyone needs to know on an everyday basis. You can now:

1. Know the limit addresses of a subnet.
2. Check whether an address belongs to a subnet.
3. Define subnets containing a set of given addresses.

All in all, these ideas are sometimes taken for granted but we have found out how they can get more complex than what wou could've initially expected.

---

If you have any comments, questions or suggestions, feel free to drop me an email!

Thanks for your time! Hope you found this useful :smile_cat:
