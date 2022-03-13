---
title: Setting up a WireGuard VPN
tags: networking WireGuard VPN
aside:
  toc: false
---

# So... what are VPNs really?
Well, that's not really a straightforward question. Put simply, *Virtual Private Networks* (that's where VPN comes from :gasp:) allow us to leverage public networks such as the Internet in such a way that those communicating through the VPN really think they're on a real private network: they have no idea their traffic is actually traversing public networks at all!

Now, this can be accomplished in several ways: we have [IPsec](https://www.cloudflare.com/en-gb/learning/network-layer/what-is-ipsec/) and [MPLS](https://networklessons.com/mpls/mpls-layer-3-vpn-explained)-based VPNs for instance. At this point it's important to point out a subtle-yet-crucial thing: a VPN is a set of services which can be provided by different technologies. The ones we've listed just now are two examples of how different technologies can offer VPN-like services. However, MPLS and IPsec couldn't be more apart in terms of what they do and what they are. What's more, different VPN implementations (i.e. technologies) function at different levels of the OSI protocol layer! These breadth of flavours offers a great deal of flexibility: some technologies are better at certain things than others, so choose whatever fits you best.

In this article we'll turn our attention to another contender jnot listed above: [WireGuard](https://www.wireguard.com). When compared to another known contender in the VPN area (that's no other than [OpenVPN](https://openvpn.net)), we find how WireGuard runs **within** the kernel on Linux-based hosts. This provides a level of performance and (maybe more importantly in some scenarios) a huge level of flexibility when it comes to configuration.

We'll walk you through how to install and deploy a WireGuard-based VPN on [Fedora 35](https://getfedora.org). However, it shouldn't be a massive headache to modulate these steps to other platforms. The most interesting part (at least we think it is) walks you through how to generate certificates for new clients so that you can incorporate anybody you want to to your brand-new and shiny VPN.

Strapped in? Let's go!

## Getting a copy of Fedora 35
With the years we've become quite lazy: once we discovered [Vagrant](https://www.vagrantup.com) we kind of stopped looking for ISOs around the Internet. We plan on (at some point) writing about Vagrant where we look a t it a bit more in depth. The good thing is we can get started in a (fairly) straightforward way:

1. Install [VirtualBox](https://www.virtualbox.org) for your OS. If you'd rather use a different Virtual Machine (i.e. VM) provider you can do so, but beware about possible hurdles down the road. If you have no idea what a VM provider is, just install VirtualBox and you'll be fine.
2. Follow the installation instructions for your OS [here](https://www.vagrantup.com/downloads).
3. Once Vagrant is up and running you can just run `vagrant version` on a shell and you should get an informative message.
4. Paste the following into a file called **exactly** `Vagrantfile`:

        Vagrant.configure("2") do |config|
            config.vm.box = "generic/fedora35"
            config.vm.provision "shell", privileged: false, run: "always", inline: <<-SHELL
                sudo systemctl disable --now firewalld
            SHELL

            config.vm.provider "virtualbox" do |v|
                v.customize ["modifyvm", :id, "--memory", 1024]
            end

            config.vm.define "wg-server" do |wgs|
                wgs.vm.hostname = 'wg-server'
                wgs.vm.network :private_network, ip: "10.0.123.2"
            end

            config.vm.define "wg-client" do |wgc|
                wgc.vm.hostname = 'wg-client'
                wgc.vm.network :private_network, ip: "10.0.123.3"
            end
        end

5. And run `vagrant up`!
6. When finished, you should be able to run `vagrant ssh wg-server` and `vagrant ssh wg-client` from the same directory.

### Important caveat: get rid of firewalld
By default, Fedora ships with `firewalld`: that's something we absolutely do not want for now! We can just stop and disable it with:

    # The --now flag will stop the service too!
    systemctl disable --now firewalld

This is something we need to do on **every machine**!. You can find more info on this [here](https://unix.stackexchange.com/questions/552857/why-are-my-network-connections-being-rejected).

That's it: you've got yourself a pair working machines running Fedora 35 :clap:. If you'd rather use a different distribution you can just swap the `"generic/fedora35"` line for whatever you like, such as `ubuntu/focal64`. You can take a look at the [catalog](https://app.vagrantup.com/boxes/search) of available images.

Time to install WireGuard!

## Getting the dragon
Even though we'll walk you through this section, you can always refer to [WireGuard's installation instructions](https://www.wireguard.com/install/).

The good thing with Fedora is it just takes a command to install WireGuard:

    # Time to connect to the server
    collado@hoth$ vagrant ssh wireguard-server

    # We're on the server now! Time to install WireGuard
    [vagrant@wg-server ~]$ sudo dnf install wireguard-tools

    # You should now log out to get onto the client machine (pst: you can also hit CTRL + D [i.e. ^D])
    vagrant@wg-server ~]$ exit

    # Log into the client...
    collado@hoth$ vagrant ssh wireguard-client

    # Time to install WireGuard on the client too!
    [vagrant@wg-server ~]$ sudo dnf install wireguard-tools

Once installed, you'll interact with WireGuard through two commands:

- `wg`: Used to set and retrieve the configuration of an interface.
- `wg-quick`: Used to quickly (pun intended) set up a WireGuard interface.

Did you notice the term *interface* in the above command descriptions? That's what's great about WireGuard: it manifests itself as a simple network interface. That means we can leverage tools such as `iptables` and interact with it as if it were a regular Ethernet card, for instance.

If you want to find more information about them we can query their respective manpages. You can access them locally with `man wg` and `man wg-quick`, respectively. You can also find them [here](https://git.zx2c4.com/wireguard-tools/tree/src/man).

Okay, we've already got WireGuard installed but... We need to set it up! Time to move on...

## Generating certificates
In order for someone (i.e. a machine) to join the VPN we've just set up you'll need to issue a certificate. These contain the information needed for establishing communication among VPN members.

Put simply, these certificates provide the information needed by `wg` and `wg-quick` when setting up WireGuard on the different machines belonging to the VPN. A certificate for a server looks something like this:

    [Interface]
    PrivateKey = <server-private-key>
    Address = <server's-address-in-the-VPN>
    ListenPort = <VPN-server-port>

    # Client A
    [Peer]
    PublicKey = <client-public-key>
    PresharedKey = <peer-symmetric-key>
    AllowedIPs = <client's-address-in-the-VPN>

    # Client B
    [Peer]
    PublicKey = <client-public-key>
    PresharedKey = <peer-symmetric-key>
    AllowedIPs = <client's-address-in-the-VPN>

    # Other clients go below...

The above contains quite a lot of blanks right? Let's take a step back to understand what we need to fill them with.

### A bit on WireGuard's internals
WireGuard is a Layer 3 (i.e. network layer) VPN implementation. This means that IP datagrams are encapsulated and sent over a public network. On the wire, a WireGuard packet looks something like:

    + -------- + <-- +
    |   HTTP   |     |  --> This could be any other protocol!
    + -------- +     |
    |   TCP    |     | WireGuard Packet
    + -------- +     |
    |    IP    |     |
    + -------- + <-- +
    |   UDP    | --> This datagram's destination port is the VPN's port!
    + -------- +
    |    IP    | --> This datagram's destination address is the VPN server!
    + -------- +
    | Ethernet | --> This could also be WiFi or whatever you like!
    + -------- +

Keep this in mind when we walk through the pieces of data we need to configure the server. This high-level overview will often come in handy!

By the way, you can check the above by using [WireShark](https://www.wireshark.org) and capturing traffic both on your *real* interface (i.e. your WiFi or Ethernet card) and then on the WireGuard interface and comparing the two.

### Getting to port
We encounter the first piece of data we need: the server's port and address. Like in any other occasion, the address identifies the VPN host (i.e. the machine) and the port identifies the process (i.e. the port WireGuard listens on). The servers address depends on its network configuration. Ideally, this would be a static, public address. For us it's going to be `10.0.123.2`, as seen on the `Vagrantfile`. You can also run `ip a` on the server machine and check the output :eyes:. The port is specified on the server's certificate: that's what you need to include on the `ListenPort` parameter. You'll usually see people using port `51820` and, as we're not smarter than anybody we'll stick to the tradition.

### Allocating addresses
Next up we can decide on the addresses we'll internally use on the VPN. These are the exact equivalent to the one's you use at home (unless you've migrated to IPv6 that is). You **should** choose a private range that doesn't collided with the private ranges your machines will belong to. In other words, if your home's network is `192.68.1.0/24`, you could use addresses on the `192.168.2.0/24` block, for instance. If you decide to use addresses on the `192.168.1.0/24` block for the VPN too you'll encounter all sorts of networking problems, so... good luck!

Please note we'll be using [CIDR notation](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing#CIDR_notation) to describe network address allocation. We'd also like to remind you what the private IPv4 ranges are (check [ARIN](https://www.arin.net/reference/research/statistics/address_filters/) if you don't believe us :wink:): `10.0.0.0/8`, `172.16.0.0/12` and `192.168.0.0/16`.

We live in Spain and tradition has it that local networks use the `192.168.1.0/24` block. To shake things up a bit we'll allocate addresses within the `10.1.2.0/24` block. Thus, the server's address will be `10.1.2.1/24`. Note we need to include the netmask (i.e. `/24`) in the configuration so that WireGuard knows addresses `10.1.2.1` through `10.1.2.255` belong the the VPN.

We'll also move things along and allocate address `10.1.2.2` to the client. After all, we also need it to complete the server's certificate!

### Generating the keys
Pretty much like SSH, WireGuard leverages asymmetric key cryptography to establish connections among VPN peers. Luckily for us, the `wg` utility can generate these for us. When generating keys and copying them around be sure to reset your shell's history afterwards: you don't want your keys lingering around there!

One more thing: **do not use these keys yourself**. They're just an example and they're suitable for testing stuff out, but don't use them in a production setting. What's more, when you run `wg genkey` and the like you **will get different keys**. You just need to carry out the same steps as us and you'll be good to go.

Without further ado, let's generate all the keys we need for the server:

    # Let's generate a private key.
        # This is what must be provided to the PrivateKey parameter.
    [vagrant@wg-server ~]$ wg genkey
    qK+FDQO9P1e2Th85sn5nq8Nrs3iOY2ZAowip7kHWd0k=

    # And let's find out the corresponding public key.
        # This is what we'll need to specify on the client certificates later on
    [vagrant@wg-server ~]$ echo 'qK+FDQO9P1e2Th85sn5nq8Nrs3iOY2ZAowip7kHWd0k=' | wg pubkey
    FqjHP1a0MFGrI6j3Xj7Zn2ffxPC6fLFc8ZJu6tHW52Y=

    # We can also chain the two with `tee` and process substitution.
        # This messes up the output though...
    [vagrant@wg-server ~]$ wg genkey | tee >(wg pubkey)
    qK+FDQO9P1e2Th85sn5nq8Nrs3iOY2ZAowip7kHWd0k=
    [vagrant@wg-server ~]$ FqjHP1a0MFGrI6j3Xj7Zn2ffxPC6fLFc8ZJu6tHW52Y=

On top of asymmetric keys we can also generate a symmetric one:

    [vagrant@wg-server ~]$ wg genpsk
    8B+kRNDGnBVIm77tpVCt0D0RbBPWuzX2GJ1T8Slo+2I=

This key **must** be included on the corresponding peer configuration on the server. In other words, we'll need to generate a symmetric key **for each** client if we decide to use them. We can also have just some clients using them. These provide (as per the `wg` manpage) *post-quantum resistance*.

After getting the keys straight, we're ready to configure the server!

### The server's (almost) ready!
After all the above, we find how the server's configuration is:

    [Interface]
    PrivateKey = qK+FDQO9P1e2Th85sn5nq8Nrs3iOY2ZAowip7kHWd0k=
    Address = 10.1.2.1/24
    ListenPort = 51820

    # Client A
    [Peer]
    PublicKey = <client-public-key>
    PresharedKey = 8B+kRNDGnBVIm77tpVCt0D0RbBPWuzX2GJ1T8Slo+2I=
    AllowedIPs = 10.1.2.2/32

Did you notice the `/32` mask on the `AllowedIPs` parameter? This roughly means that only packets addressed to `10.1.2.2` (and only that!) will be relayed to the client. This is, in a way, WireGuard's routing table. This is only scratching WireGuard's possibilities, so we encourage to take a look at [WireGuard's homepage](https://www.wireguard.com) and it's [technical paper](https://www.wireguard.com/papers/wireguard.pdf).

#### Enabling IPv4 forwarding
Due to how the server will be managing traffic we need to enable IPv4 forwarding on it. This can be easily accomplished with:

    sudo sysctl -w net.ipv4.ip_forward=1

Now the server will be able to move packets across interfaces.

We're still missing something :scream:. We won't know the client's public key until we generate the private one so... let's get on that!

## The client's certificate
A client certificate looks something like:

    [Interface]
    PrivateKey = <client-private-key>
    Address = <client's-address-in-the-VPN>

    [Peer]
    Endpoint = <VPN-server-ip>:<VPN-server-port>
    PublicKey = <server-public-key>
    PresharedKey = <peer-symmetric-key>
    AllowedIPs = 0.0.0.0/0

Just like before, the `AllowedIPs` field control what's routed through the VPN on the client. The special `0.0.0.0/0` address means **everything**. We could, however, include a comma-separated list of CIDR networks if we wanted to be more specific. If that's the path you want to take make sure the server's real IP address (i.e. `10.0.123.2` for us) **is not** routed through the VPN: if it is you'll create a routing loop and break connectivity... Without getting into too much detail, using the `0.0.0.0/0` wildcard routes stuff according to an identifier instead of 'traditional' routes. If you use 'real' CIDR networks this won't be the case and that opens up this possible pitfall :sweat:.

Given what we saw before we only need to generate the private and public keys to fill in the holes! Just like before:

    # Private key generation
    [vagrant@wg-client ~]$ wg genkey
    UA36Uq7UN0joXIXAPMaSaezyq6d9oKn6t9aACEDCpmI=

    # Public key time!
    [vagrant@wg-client ~]$ echo 'UA36Uq7UN0joXIXAPMaSaezyq6d9oKn6t9aACEDCpmI=' | wg pubkey
    OkCW9JriehL1JWjQ8tS1DVEPs4ZscuJd5MafOezWWkE=

Then, the client certificate becomes:

    [Interface]
    PrivateKey = UA36Uq7UN0joXIXAPMaSaezyq6d9oKn6t9aACEDCpmI=
    Address = 10.1.2.2/24

    [Peer]
    Endpoint = 10.0.123.2:51820
    PublicKey = FqjHP1a0MFGrI6j3Xj7Zn2ffxPC6fLFc8ZJu6tHW52Y=
    PresharedKey = 8B+kRNDGnBVIm77tpVCt0D0RbBPWuzX2GJ1T8Slo+2I=
    AllowedIPs = 0.0.0.0/0

And the server's would be:

    [Interface]
    PrivateKey = qK+FDQO9P1e2Th85sn5nq8Nrs3iOY2ZAowip7kHWd0k=
    Address = 10.1.2.1/24
    ListenPort = 51820

    # Client A
    [Peer]
    PublicKey = OkCW9JriehL1JWjQ8tS1DVEPs4ZscuJd5MafOezWWkE=
    PresharedKey = 8B+kRNDGnBVIm77tpVCt0D0RbBPWuzX2GJ1T8Slo+2I=
    AllowedIPs = 10.1.2.2/32

## Placing the certificates where they should be
When interfaces are brought up with `wg-quick`, the tool looks for configuration files on `/etc/wireguard` following the `*.conf` syntax. Note the leading `*` determines the name of the generated interface! What's more, this name is only taken into account within the server itself: two VPN members can have the same interface name.

Let's leverage [here docs](https://tldp.org/LDP/abs/html/here-docs.html) to write the files into the appropriate locations:

    # Let's make sure the necessary directories exist
    [vagrant@wg-server ~]$ mkdir -p /etc/wireguard
    [vagrant@wg-client ~]$ mkdir -p /etc/wireguard

    # Configure the appropriate permissions
    [vagrant@wg-server ~]$ chmod 0700 /etc/wireguard
    [vagrant@wg-client ~]$ chmod 0700 /etc/wireguard

    # Write the file on the server!
        # You can also use `nano` or `vim`: if not copied exactly the
        # following may fail due to whitespace...
    [vagrant@wg-server ~]$ sudo bash -c 'cat <<-EOF > /etc/wireguard/wg0.conf
    [Interface]
    PrivateKey = qK+FDQO9P1e2Th85sn5nq8Nrs3iOY2ZAowip7kHWd0k=
    Address = 10.1.2.1/24
    ListenPort = 51820

    # Client A
    [Peer]
    PublicKey = OkCW9JriehL1JWjQ8tS1DVEPs4ZscuJd5MafOezWWkE=
    PresharedKey = 8B+kRNDGnBVIm77tpVCt0D0RbBPWuzX2GJ1T8Slo+2I=
    AllowedIPs = 10.1.2.2/32
    EOF'

    # Configure the permissions for the file too! Better safe than sorry...
    [vagrant@wg-server ~]$ chmod 0600 /etc/wireguard/wg0.conf

    # Time to copy the certificate to the client too!
    [vagrant@wg-client ~]$ sudo bash -c 'cat <<-EOF > /etc/wireguard/wg0.conf
    [Interface]
    PrivateKey = UA36Uq7UN0joXIXAPMaSaezyq6d9oKn6t9aACEDCpmI=
    Address = 10.1.2.2/24

    [Peer]
    Endpoint = 10.0.123.2:51820
    PublicKey = FqjHP1a0MFGrI6j3Xj7Zn2ffxPC6fLFc8ZJu6tHW52Y=
    PresharedKey = 8B+kRNDGnBVIm77tpVCt0D0RbBPWuzX2GJ1T8Slo+2I=
    AllowedIPs = 0.0.0.0/0
    EOF'

    # And set permissions once again
    [vagrant@wg-client ~]$ chmod 0600 /etc/wireguard/wg0.conf

## Bringing the VPN up
With everything ready, our VPN is just a command away (okay, two, one on each host :grimacing:) from working!

We'll use `wg-quick` to bring the interfaces up. Given the certificates have been saved to `/etc/wireguard/wg0.conf` on both machines the command will be exactly the same:

    # Bringing the VPN up on the server
    [vagrant@wg-server ~]$ sudo wg-quick up wg0
    [#] ip link add wg0 type wireguard
    [#] wg setconf wg0 /dev/fd/63
    [#] ip -4 address add 10.1.2.1/24 dev wg0
    [#] ip link set mtu 1420 up dev wg0

    # And now on the client
    [vagrant@wg-client ~]$ sudo wg-quick up wg0
    [#] ip link add wg0 type wireguard
    [#] wg setconf wg0 /dev/fd/63
    [#] ip -4 address add 10.1.2.2/24 dev wg0
    [#] ip link set mtu 1420 up dev wg0
    [#] wg set wg0 fwmark 51820
    [#] ip -4 route add 0.0.0.0/0 dev wg0 table 51820
    [#] ip -4 rule add not fwmark 51820 table 51820
    [#] ip -4 rule add table main suppress_prefixlength 0
    [#] sysctl -q net.ipv4.conf.all.src_valid_mark=1
    [#] nft -f /dev/fd/63

We can now use `wg` to check the VPN's state on each machine:

    [vagrant@wg-server ~]$ sudo wg
    interface: wg0
        public key: FqjHP1a0MFGrI6j3Xj7Zn2ffxPC6fLFc8ZJu6tHW52Y=
        private key: (hidden)
        listening port: 51820

    peer: OkCW9JriehL1JWjQ8tS1DVEPs4ZscuJd5MafOezWWkE=
        preshared key: (hidden)
        endpoint: 10.0.123.3:55912
        allowed ips: 10.1.2.2/32
        latest handshake: 40 seconds ago
        transfer: 17.29 KiB received, 16.86 KiB sent

    [vagrant@wg-client ~]$ sudo wg
    interface: wg0
        public key: OkCW9JriehL1JWjQ8tS1DVEPs4ZscuJd5MafOezWWkE=
        private key: (hidden)
        listening port: 55912
        fwmark: 0xca6c

    peer: FqjHP1a0MFGrI6j3Xj7Zn2ffxPC6fLFc8ZJu6tHW52Y=
        preshared key: (hidden)
        endpoint: 10.0.123.2:51820
        allowed ips: 0.0.0.0/0
        latest handshake: 43 seconds ago
        transfer: 16.86 KiB received, 23.80 KiB sent

As you might've guessed, you can use `wg-quick down wg0` on any machine to dismantle the VPN. Way to go! Time for a pat in the back :clap:

## Testing connectivity
Once stuff is up and running we can test out the connectivity between the machines by running the following command:

    # Pinging the client from the server
    [vagrant@wg-server ~]$ ping -c 3 10.1.2.2
    PING 10.1.2.2 (10.1.2.2) 56(84) bytes of data.
    64 bytes from 10.1.2.2: icmp_seq=1 ttl=64 time=0.942 ms
    64 bytes from 10.1.2.2: icmp_seq=2 ttl=64 time=0.875 ms
    64 bytes from 10.1.2.2: icmp_seq=3 ttl=64 time=0.874 ms

    --- 10.1.2.2 ping statistics ---
    3 packets transmitted, 3 received, 0% packet loss, time 2045ms
    rtt min/avg/max/mdev = 0.874/0.897/0.942/0.031 ms

    # Pinging the client from the server
    [vagrant@wg-client ~]$ ping -c 3 10.1.2.1
    PING 10.1.2.1 (10.1.2.1) 56(84) bytes of data.
    64 bytes from 10.1.2.1: icmp_seq=1 ttl=64 time=0.901 ms
    64 bytes from 10.1.2.1: icmp_seq=2 ttl=64 time=1.30 ms
    64 bytes from 10.1.2.1: icmp_seq=3 ttl=64 time=0.852 ms

    --- 10.1.2.1 ping statistics ---
    3 packets transmitted, 3 received, 0% packet loss, time 2007ms
    rtt min/avg/max/mdev = 0.852/1.017/1.298/0.199 ms

That's it! We have connectivity between both machines!

## We made it!
Well, that was quite a ride! You can now follow the same procedure we used for the client to add as many (well, you can only add `252` other machines) new clients as you want and communicate among them as if they all belonged to a private net wit addresses in the `10.1.2.0/24` range.

We plan on writing another article extending this one where we show how you can leverage `iptables` rules and such to filter traffic based on its origin and some other goodies. Before that, you should however feel comfortable with all the ground we've covered to fully grasp new and more interesting concepts.

---

If you have any comments, questions or suggestions, feel free to drop me an email!

Thanks for your time! Hope you found this useful :smile_cat:
