---
title: "Controlling access through a WireGuard VPN"
tags: ["networking", "wireguard", "vpn", "iptables", "access-control"]
date: "2022-03-13"
---

# Why would we want to control access to a machine?
In an ideal world, we wouldn't need to protect our own machines: nobody would try to break into them in the first place.

The truth, however, is that we **should** always control who can access our servers and computers when we expose them publicly. Let's take a look at a common scenario.

## Securing SSH
When setting up servers we usually leave port 22 open: that's where the SSH daemon (i.e. `sshd`) listens on for incoming connections. Even though it's true we could run the daemon on a different port, we'll always be leaving a 'door' allowing access into our machines.

Most system administrators will disable password-based logins through SSH and will instead rely on asymmetric keys for authentication. This is what platforms such as GitHub and GitLab encourage and it almost always proves to be much more comfortable than having to type passwords over and over again.

Even though this key-based access is fairly secure, we can take an additional step towards hardening the SSH daemon: we can only allow certain IP addresses through. The question is: how can we allow someone behind a residential Internet connection access our server reliably? When home routers are rebooted, they are usually assigned a different IP address within a pool allocated to our *Internet Service Provider* (ISP). This means that if we let, say `1.2.3.4` through things will only work as long as that address stays the same. What if our cat trips over the router and unplugs the cable and we are assigned `1.2.3.4` when we bring it up again? Should we be constantly changing the allowed IP list?

Well, in theory we could do that, but it's something rather cumbersome. What's more, this way of doing things won't scale if we need to manage a large number of clients. So... what can we do?

In order to solve this problem in a 'flexible' manner we'll leverage a WireGuard-based VPN. Be sure to check [our previous article](2022-03-12-wg-vpn-setup.md) on how to set up a WireGuard VPN before moving along!

## Setting things up
Like in the previous article, we'll leverage [Vagrant](https://www.vagrantup.com) to set up 3 virtual machines running Fedora 35. You can just paste the following into a file named `Vagrantfile` and run `vagrant up` within that same directory.

```ruby
Vagrant.configure("2") do |config|
    config.vm.box = "generic/fedora35"

    # We'll disable `firewalld` on the machines to prevent interferences in our setup
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

  config.vm.define "wg-client-a" do |wga|
    wga.vm.hostname = 'wg-client-a'
    wga.vm.network :private_network, ip: "10.0.123.3"
  end

  config.vm.define "wg-client-b" do |wgb|
    wgb.vm.hostname = 'wg-client-b'
    wgb.vm.network :private_network, ip: "10.0.123.4"
  end
end
```

When everything's up and running we'll have something like the following:

      10.0.123.2                                        10.0.123.3
    + --------- +                                     + ----------- +
    | wg-server |                                     | wg-client-a |
    + --------- +                                     + ----------- +
          |                                                  |
          |             + -------------------- +             |
          + ----------> | 10.0.123.0/24 Subnet | <---------- +
          |             + -------------------- +             |
          |                                                  |
    + ----------- +                                   + ------------ +
    | wg-client-b |                                   | Host Machine |
    + ----------- +                                   + ------------ +
      10.0.123.4                                         10.0.123.1

With that out of the way we now need to set up the entire WireGuard VPN. The good news is you just need to follow the steps laid out in our previous article (the one we linked above). On top of the client and the server configuration you'll also need to generate a third certificate for `wg-client-b` whose assigned IP address we assume to be `10.1.2.3`. Once that is set up, the network topology from the VPN's point of view will look something like this:

      10.1.2.1                                         10.1.2.2
    + --------- +                                   + ----------- +
    | wg-server |                                   | wg-client-a |
    + --------- +                                   + ----------- +
          |                                                |
          |             + -------------------- +           |
          + ----------> | 10.1.2.0/24 Subnet | <---------- +
          |             + -------------------- +
          |
    + ----------- +
    | wg-client-b |
    + ----------- +
       10.1.2.3

Once that's up you'll have to test connectivity across the machines. To do so just run the following commands:

    # Testing out wg-server <-> wg-client-a connectivity
    [vagrant@wg-server ~]$ ping -c 1 10.1.2.2
    PING 10.1.2.2 (10.1.2.2) 56(84) bytes of data.
    64 bytes from 10.1.2.2: icmp_seq=1 ttl=64 time=1.11 ms

    --- 10.1.2.2 ping statistics ---
    1 packets transmitted, 1 received, 0% packet loss, time 0ms
    rtt min/avg/max/mdev = 1.108/1.108/1.108/0.000 ms

    # Testing out wg-server <-> wg-client-b connectivity
    [vagrant@wg-server ~]$ ping -c 1 10.1.2.3
    PING 10.1.2.3 (10.1.2.3) 56(84) bytes of data.
    64 bytes from 10.1.2.3: icmp_seq=1 ttl=64 time=1.69 ms

    --- 10.1.2.3 ping statistics ---
    1 packets transmitted, 1 received, 0% packet loss, time 0ms
    rtt min/avg/max/mdev = 1.691/1.691/1.691/0.000 ms

    # Testing out wg-client-a <-> wg-client-b connectivity
    [vagrant@wg-client-a ~]$ ping -c 1 10.1.2.3
    PING 10.1.2.3 (10.1.2.3) 56(84) bytes of data.
    64 bytes from 10.1.2.3: icmp_seq=1 ttl=63 time=1.95 ms

    --- 10.1.2.3 ping statistics ---
    1 packets transmitted, 1 received, 0% packet loss, time 0ms
    rtt min/avg/max/mdev = 1.954/1.954/1.954/0.000 ms

Now, what path are these ICMP messages (that is, the `ping`s) following? We can use `traceroute` for that. You'll need to run `sudo dnf install traceroute` before proceeding as it's not packed on the stock images we're running. What's more, you'll need to momentarily turn the VPN off for now: otherwise you won't be able to contact the Internet on the clients. We'll get into that later.

Using `traceroute` on the first client (i.e. `wg-client-a`) we find that `wg-server` and `wg-client-a` are a single hop (i.e. jump) away, but instead there are two hops between `wg-client-a` and `wg-client-b`:

    [vagrant@wg-client-a ~]$ traceroute 10.1.2.1
    traceroute to 10.1.2.1 (10.1.2.1), 30 hops max, 60 byte packets
      1  10.1.2.1 (10.1.2.1)  1.910 ms  1.911 ms  1.882 ms
    [vagrant@wg-client-a ~]$ traceroute 10.1.2.3
    traceroute to 10.1.2.3 (10.1.2.3), 30 hops max, 60 byte packets
      1  10.1.2.1 (10.1.2.1)  1.128 ms  1.325 ms  1.312 ms
      2  10.1.2.3 (10.1.2.3)  2.764 ms  2.809 ms  2.842 ms

This tells us how connections work within the VPN: every client communicates through the server. Having this 'central' point of communication allows us to tightly control traffic by filtering it on the server itself.

We can also go a totally different way to try and control who can access what: as WireGuard manifests itself as a network interface, we can only allow traffic coming in through that interface to reach the services we want to control.

We'll begin by tacking a look at the first approach and then move on to the second one.

## NATting connections through the server
Remember we couldn't reach the Internet when enabling the VPN on the clients? We can solve that by NATting connections though the server.

### WHat as NAT again?
[NAT](https://en.wikipedia.org/wiki/Network_address_translation), or *Network Address Translation*, is a technique allowing us to map an IP address to another one by modifying the Network and transport level headers. This is very frequently used on residential networks: within the network machines are assigned private IP addresses which are not routable in the public Internet. When packets traverse the router, the original private source IP address is overwritten with the router's public one and the source port number is also altered. In this way, the router NATting connections maps incoming port numbers to a destination `IP:PORT` tuple.

This is by no means an extensive explanation of what NAT is, but the main idea is that if we implement a NAT on the VPN server everybody outside the NAT will 'think' it's the server itself who's initiating these connections. What's the upside then? Well, we'll only need to allow the server's IP address through the firewall on the machines we want to protect no matter how many clients we are really managing. We won't have to bother with the client's IP addresses. Neat right?

### Enter iptables
We can think of [`iptables(8)`](https://linux.die.net/man/8/iptables) as a firewall running within Linux machines. On top of being a traditional firewall, we can also implement a NAT with a single command:

    # Let's break it down:
        # -t nat: Instead of the filter table we'll use the NAT table.
        # -A POSTROUTING: We'll add a rule on the POSTROUTING chain.
        # -s 10.1.2.0/24: This rule applies to packages whose source is the `10.1.2.0/24` subnet (that is, the VPN).
        # ! -o wg0: We'll only NAT packages egressing through interfaces other than the VPN's (i.e. `wg0`).
        # -m comment --comment wg-internet-nat: We'll add a comment to the rule to know what it's for.
        # -j MASQUERADE: And we'll apply the MASQUERADE target, that is, we'll NAT the packages.
    [vagrant@wg-server ~]$ sudo iptables -t nat -A POSTROUTING -i wg0 ! -o wg0 -m comment --comment wg-internet-nat -j MASQUERADE

    # Let's check the rule
    [vagrant@wg-server ~]$ sudo iptables -t nat -vL
    Chain PREROUTING (policy ACCEPT 0 packets, 0 bytes)
    pkts bytes target     prot opt in     out     source               destination

    Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
    pkts bytes target     prot opt in     out     source               destination

    Chain OUTPUT (policy ACCEPT 0 packets, 0 bytes)
    pkts bytes target     prot opt in     out     source               destination

    Chain POSTROUTING (policy ACCEPT 0 packets, 0 bytes)
    pkts bytes target     prot opt in     out     source               destination
        2   152 MASQUERADE  all  --  any    !wg0    10.1.2.0/24          anywhere             /* wg-internet-nat */

Once that's instantiated you'll notice how you can connect to the Internet from the clients even when the VPN is up. Time to apply rules to filter traffic on the clients!

#### Quality of life improvements
Unless you take specific action to do so, `iptables` rules are ephemeral: they'll be deleted when the machine is rebooted. The good thing is we can leverage `wg-quick` to do this automatically when the VPN is brought up on the server. You just need to add these two lines on the `[Interface]` block, before defining the first `[Peer]`:

    PostUp = iptables -t nat -A POSTROUTING -i wg0 ! -o wg0 -m comment --comment wg-internet-nat -j MASQUERADE
    PostDown = iptables -t nat -D POSTROUTING -i wg0 ! -o wg0 -m comment --comment wg-internet-nat -j MASQUERADE

You can include any command in the `PostUp` and `PostDown` parameters and you can include as many as you want: they'll be executed in order. This allows for quite come flexibility when working with WireGuard.

## Filtering traffic based on the source IP address
We have just seen how we can NAT to make others think we're issuing connections from the server when in reality they'r initiated on a VPN client. Let's put that to good use.

### Setting up a small server
The NetCat ([`nc(1)`](https://linux.die.net/man/1/nc)) tool allows us to spin up a simple TCP server with a single command. We'll bring it up on the second client. Note you'll have to run `sudo dnf install nc` on both wireguard clients! Let's to it:

    # This brings up a TCP server on port 1234 on the second client
    [vagrant@wg-client-b ~]$ nc -l 1234

    # We can send a message from the first client and close the connection after sending it with:
    [vagrant@wg-client-a ~]$ echo "Hello there!" | nc -N 10.0.123.4 1234

    # This will show the "Hello there!" message on `wg-client-b`'s prompt:
    [vagrant@wg-client-b ~]$ nc -l 1234
    Hello there!

Let's add a rule on `wg-client-b` to limit who can access that server:

    # Let's break it down:
        # iptables -A INPUT: We'll add a rule on the filter table (i.e. the regular one).
        # ! -s 10.0.123.2: This rule applies to source addresses other than 10.0.123.2.
        # -p tcp: This rule applies to segments using TCP at the transport layer.
        # --dport 1234: This rule applies to segments addresses to port 124.
        # -j DROP: This rule will DROP packets matching it.
    [vagrant@wg-client-b ~]$ sudo iptables -A INPUT ! -s 10.0.123.2 -p tcp --dport 1234 -j DROP

    # Let's take a look at the result:
    [vagrant@wg-client-b ~]$ sudo iptables -nvL
    Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
    pkts bytes target     prot opt in     out     source               destination
        0     0 DROP       tcp  --  *      *      !10.0.123.2           0.0.0.0/0            tcp dpt:1234

    Chain FORWARD (policy ACCEPT 0 packets, 0 bytes)
    pkts bytes target     prot opt in     out     source               destination

    Chain OUTPUT (policy ACCEPT 0 packets, 0 bytes)
    pkts bytes target     prot opt in     out     source               destination

Try to disable the VPN on `wg-client-a` and then run the same `nc` command. Be sure to bring the server up with `nc -l 1234` on `wg-client-b` again!

    [vagrant@wg-client-a ~]$ sudo wg-quick down wg0
    [#] ip -4 rule delete table 51820
    [#] ip -4 rule delete table main suppress_prefixlength 0
    [#] ip link delete dev wg0
    [#] nft -f /dev/fd/63

    # This command will 'hang': quit it with CTRL + C (i.e. ^C).
    [vagrant@wg-client-a ~]$ echo "Hello there!" | nc -N 10.0.123.4 1234

Aha! Looks like we cannot communicate with the server anymore! If we take a look at the rule we instantiated on `wg-client-b` we'll see it's packet counter go up (this means it's been applied to 3 packets in our case):

    [vagrant@wg-client-b ~]$ sudo iptables -nvL
    Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
    pkts bytes target     prot opt in     out     source               destination
        3   180 DROP       tcp  --  *      *      !10.0.123.2           0.0.0.0/0            tcp dpt:1234

    Chain FORWARD (policy ACCEPT 0 packets, 0 bytes)
    pkts bytes target     prot opt in     out     source               destination

    Chain OUTPUT (policy ACCEPT 0 packets, 0 bytes)
    pkts bytes target     prot opt in     out     source               destination

If you enable the VPN again you'd normally see traffic going through again. There's a small caveat however and it has to do with all the machines belonging to the `10.0.123.0/24` subnet.

#### Faking things a bit
THe problem is given the routes present on `wg-client-a` (you can check them with `ip r`), packets addresses to `10.0.123.4` **will not** be routed through the VPN. We need to force them through the `wg0` interface so that they are NATted on the server. This limitation arises from the use of a 'model' to showcase these configurations: this shouldn't be a real issue on a real life scenario.

The route itself can be added with the following command. As packets are routed based on the longest matching prefix rule it will take precedence over the `10.0.123.0/24` rule that's already present.

    [vagrant@wg-client-a ~]$ sudo ip r add 10.0.123.4/32 dev wg0 proto kernel scope link src 10.1.2.2

With that, you should be able to issue the `echo "Hello there!" | nc -N 10.0.123.4 1234` command again, even with the rule on `wg-client-b` still configured and it should all work!

Let's recap: we have configured the server to NAT packets through itself so that others see its address as the source even when it's clients who are really sending the packets. This allows us to filter traffic based on the server's public IP address instead on on the client's to control who gets access to what. Thus, clients using the VPN are allowed through these checks and those outside of it are not: we have effectively allowed VPN clients through!

Let's take a look at another approach!

## Filtering the traffic based on the incoming interface
Let's simplify things a bit with another approach. However, we need to set up a couple of things before.

### Cleaning up!
Before continuing we need to clean up after us:

    # Let's stop NATting stuff on the server
    [vagrant@wg-server ~]$ sudo iptables -t nat -D POSTROUTING -s 10.1.2.0/24 ! -o wg0 -m comment --comment wg-internet-nat -j MASQUERADE

    # Let's clean up the routes on the first client
    [vagrant@wg-client-a ~]$ sudo ip r del 10.0.123.4/32 dev wg0 proto kernel scope link src 10.1.2.2

    # And let's clean up the firewall on the other client
    [vagrant@wg-client-b ~]$ sudo iptables -D INPUT ! -s 10.0.123.2 -p tcp --dport 1234 -j DROP

We can now move on to setting up things a bit differently.

### The 'golden' rule
We can filter traffic on the second client (i.e. `wg-client-b`) based on the incoming interface:

    # Let's break it down:
        # iptables -A INPUT: We'll add a rule on the filter table (i.e. the regular one).
        # ! -i wg0: This rule applies to packets coming in through interfaces other than the VPN's (i.e. `wg0`).
        # -p tcp: This rule applies to segments using TCP at the transport layer.
        # --dport 1234: This rule applies to segments addresses to port 124.
        # -j DROP: This rule will DROP packets matching it.
    [vagrant@wg-client-b ~]$ sudo iptables -A INPUT ! -i wg0 -p tcp --dport 1234 -j DROP

This is basically saying: "only packets belonging to the VPN can reach port 1234 over TCP". This is exactly what we want!

## So... which one is best?
As with many other things, there's no 'best' option. If we leverage NAT techniques we see how the target machine (i.e. the one whose access we're controlling) **does not need to belong to the VPN**. That is, we needn't issue a certificate for it. This stems from the idea behind all this: we're just taking advantage of the server's public IP which isn't really part of the VPN deployment itself. The target machine doesn't need to be aware of the VPN supporting all this; it just thinks its always the server the one who's connecting to its processes.

On the other hand, if we filter traffic based on the incoming interface we **need to issue a certificate for the target machine**. This incurs in some overhead if we are to protect a large set of machines, but the overall structure and rules are much simpler.

So... what to choose really depends on your needs and, really, what you feel more comfortable with.

## Summing up
Well, that was a lot of information! We have discussed how to control access to machines by leveraging a WireGuard-based VPN and we have also got more comfortable with WireGuard in the process. This is one of the reasons why we consider WireGuard to be super cool!

---

If you have any comments, questions or suggestions, feel free to drop me an email!

Thanks for your time! Hope you found this useful :smile_cat:
