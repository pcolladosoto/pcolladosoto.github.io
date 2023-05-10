---
title: "Cross Compiling stuff with Docker"
tags: ["cross-compilation", "docker"]
date: "2021-11-14"
---

# Do we really have to compile stuff in the 21st century?
Short answer: yes. Long answer: it really depends on the context you develop programs in, but chances are you'll end up running into compilation at some point...

Old school programming languages like `C` and `C++` are *compiled languages*, that is, their source files (`*.c` and `*.cpp`, respectively) must be *compiled* (and probably *linked* and whatnot) into an executable that can later be executed. We are by no means experts on the topic of compilation (we still cry from time to time when working with `Makefile`s), so if you want to read up more on compilation we believe [CS Fundamentals](https://www.cs-fundamentals.com/c-programming/how-to-compile-c-program-using-gcc) to be a good starting point. It uses the `gcc` toolchain as an example to walk you through the process through which source files become executables, so it's easy to follow along! However, we might consider writing our own entry on compilation, so stay tuned!

In any case, the main takeaway is that when we deal with compiled languages, we need to *compile* source code into an executable. In doing so, we usually leverage a *compiler* and a *linker*. What's more, we can (very broadly) classify generated executables in two categories:

- [*Dynamic Executables*](https://en.wikipedia.org/wiki/Library_(computing)#Shared_libraries): Some of the executable's dependencies (such as external libraries) **are not** included in the executable itself. Let's say it *knows* where to find these dependencies somewhere on the system it's running on. The catch is, the executable *might* run on a system where these requirements are not met, thus rendering it useless on said platform... The main advantage of this approach is that the binaries we execute are smaller and that shared code is reused by various programs.

- [*Static Executables*](https://en.wikipedia.org/wiki/Static_library): These contain **everything** they need to run: no external dependencies required. These binaries will be a bit larger than their counterparts, but they will run no matter the environment they're in. That's why we favour these when targeting embedded systems if we can spare the extra storage.

We believe it's also important to note that modern languages such as `go` and `rust` are also compiled: don't think compilation is just a blast form the past! The following sections will deal with *cross-compilation*: the process of compiling stuff on a machine with a given architecture for a machine running a different one. What's more, we'll carry out this compilation within *Docker* containers so that the process is platform agnostic. Aren't containers cool?

## Our example program: WireGuard
[*WireGuard*](https://www.wireguard.com) is a *L3 VPN* implementation we have commonly found incredibly useful. We'll write an entry explaining how to get it up and running along with some ideas of what you can do with it, in case you'd be interested on that... The thing is, there was nothing like a packaged version of *WireGuard* or anything of that nature for the embedded system we wanted to run things on. That's why we had to compile everything from source. In this occasion, we will try to *cross-compile* everything from a machine running *macOS*. The need for *cross-compilation* arises because, even though the machine does have a full kernel running just above the hardware, it does lack a lot of the tools and facilities one could expect on a normal desktop computer. Thus, we decided to compile all the necessary tools as [*static binaries*](https://en.wikipedia.org/wiki/Static_library) so that we didn't depend on libraries we would likely be missing on the embedded device.

This will give you a taste of what the process is like and the good thing is we will have to work with two different languages: `C` and `go`. You can find a nice discussion on *cross-compilation* [here](https://jensd.be/1126/linux/cross-compiling-for-arm-or-aarch64-on-debian-or-ubuntu). We encourage you not to mistake the forest for the trees: the discussion that follows **is not** only applicable to the compilation of *WireGuard*. Even though some steps are very tied to it (like the modification of the `Makefile`), always remember that adapting the process to any program would only be a matter of pulling the necessary requirements and following that program's compilation instructions, nothing more.

### What we need to compile
We can regard *WireGuard* as the superposition of a couple of tools:

- *WireGuard*: This would be the *L3 VPN* implementation. On *linux*-based systems *WireGuard* is intended to run as a kernel module. In other words, *WireGuard* runs **within** the kernel, not above it on the so called 'user land'. This provides a 'tight' integration with *linux* itself, as well as a better performance when compared to other alternatives such as *OpenVPN*.

- *wg*: Most of us interact with *WireGuard VPN*s through the [`wg(8)`](https://git.zx2c4.com/wireguard-tools/about/src/man/wg.8) tool. This is what we could regard as a 'configuration client' that communicates with the implementation and alters or monitors its state. Even though not strictly needed, we really consider having access to `wg` a must in order to make our life that much easier.

### Our target
As previously stated, we will try to compile *WireGuard* for it to run on an embedded system running a full-fledged *linux 4.14.78* kernel with a *Freescale i.MX6 UltraLite* CPU. This CPU leverages the *armv7l* architecture which, in turn, works with a *32-bit* instruction set.

The above can be summarized into:

- Target kernel: *linux 4.14.78*.
- Target architecture: *armv7l* (*32 bit*).

This information is crucial: it characterizes the target system we want to generate executables for! With all that out of the way, let's get down to business!

#### Compiling the VPN implementation
Even though *WireGuard* is intended to run as a *linux* module, we were not brave enough to cross-compile a kernel module (however, we intend to do that at some point :information_desk_person:). That is why we decided to leverage *WireGuard*'s *Go* implementation: [`wireguard-go`](https://git.zx2c4.com/wireguard-go/about/). Given *Go*'s principles and the fact that it's a compiled language it's fairly easy to leverage a binary on other platforms. By default, binaries produced by *Go* are *static*. What's more, we can easily *cross-compile Go* code through the use of a couple of environment variables. Please note that you'll need to have *Go* installed in order to compile the code. You can see how to do it [here](https://golang.org/doc/install).

1. `GOOS`: Controls the kernel to build against. Possible values are `linux` for *linux*-based systems, `darwin` for *macOS* and `windows` for *Windows* systems.

2. `GOARCH`: Controls the architecture to build against. Possible values are `836`, `amd64`, `arm`, `arm64`...

All possible combinations can be derived from the output provided by:

    go tool dist list -json

Given the specifications of our target system, we have chosen values `linux` and `arm` for `GOOS` and `GOARCH`, respectively.

As specified on the `wireguard-go` repository, one just needs to run the following commands to build the *static* `wireguard-go` binary. Notice we have interleaved the definition of both environment variables:

    # Clone the wireguard-go repo
    git clone https://git.zx2c4.com/wireguard-go

    # Move into that directory
    cd wireguard-go

    # Define variables for cross-compilation
    export GOOS=linux
    export GOARCH=arm

    # Compile the code
    make

The previous instructions will generate the `wireguard-go` binary which is a *static* binary implementing the *VPN implementation*. Once that's ready, we just need to move the binary somewhere within the `PATH` of the target system (like `/bin` for instance):

    scp wireguard-go <username>@<target-ip>:/bin

This will allow us to run the generated program by just typing `wireguard-go` on the target system. That wasn't too bad was it?

#### Compiling the wg utility
The `wg` utility source code can be found on the [`wireguard-tools`](https://git.zx2c4.com/wireguard-tools/about/) repository. Unlike in the previous case, we now have to deal with `C` code...

##### The need for Docker
We are working on *macOS* and we feel a lot more comfortable working on a *linux*-based distribution for these types of tasks. That's why we have decided to leverage *Docker*: we will spin up a *Ubuntu* container and install all necessary dependencies on to it to then carry out the compilation in it. The great things about this approach is are:

- The host system remains clean: we needn't worry about leaving behind unnecessary packages that will just bloat our installed package lists.
- The container is reproducible: we can follow these steps on any platform capable of running *docker*.
- We can easily share the setup with anybody who wants it: we can either provide the `Dockerfile` or just upload the resulting image to *Docker Hub*.

It's true that the best practice is to provide a `Dockefile` that can be leveraged to generate a *Docker image*. However, these `Dockerfile`s can sometimes get a bit 'magical' and people reading them might mistake the forest for the trees at some point... That's why we are providing the following instructions which anyone can use to turn a *vanilla* (i.e. stock) *Ubuntu docker image* into a *cross-compilation* station. Just be sure to run the following to start up a container running *Ubuntu*:

    docker run -it ubuntu bash

Once that is up and running (don't forget the `-it` flags or the container will just terminate), just run the following in order:

    # Get necessary tools:
        # curl: Client for transferring data with several protocols, including HTTP.
        # git: Git VCS for pulling code repositories.
        # vim: Terminal text editor in case we need to perform some minor tweaks.
        # libelf-dev: Development files for libelf.
            # libelf: Library for reading and writing ELF files.
        # build-essential: Collection of tools for building codes, such as gcc, make...
        # pkg-config: Manage compile and link flags.
        # gcc-arm-linux-gnueabi: C compiler for ARM architectures.
        # binutils-arm-linux-gnueabi: Binary utilities for ARM targets.
    root@container# apt update && apt install curl git vim libelf-dev build-essential pkg-config gcc-arm-linux-gnueabi binutils-arm-linux-gnueabi

    # Get the source code to compile
    root@container# git clone https://git.zx2c4.com/wireguard-tools.git

    # Navigate to the wireguard-tools directory
    root@container# cd wireguard-tools/src

Given compilation is controlled by a `Makefile`, we have decided to 'tweak' it a bit so that we generate a static binary. We can do so by adding the following line at the beginning of the file:

    vim# LDFLAGS = -static

We also need to alter the compiler we are to use. We commonly use `gcc`, but as we are cross-compiling the code for *ARM* platforms we need to leverage the `arm-linux-gnueabi-gcc` compiler we have just downloaded. We can instruct the `Makefile` to use said compiler by adding the following line at the beginning too:

    vim# CC = arm-linux-gnueabi-gcc

The thing is, if we run `make` to try and compile the code it **will fail**... The cause behind the error is we are using the `glibc` implementation by default and it **cannot** statically compile some functions such as `sockaddr()`, which `wg` relies on. So what can we do?

We settled on leveraging a different `C` implementation: [*Musl*](https://musl.libc.org). Instead of just pulling the code, we decided to get a release from [`musl.cc`](https://musl.cc/#binaries). We can pull the necessary release with:

    # Pull the necessary release:
        # arm-*: Musl C implementation for ARM targets.
        # *-cross: This is a cross compiler.
    root@container# curl -o musl.tar.gz https://musl.cc/arm-linux-musleabi-cross.tgz

    # Decompress the distribution and remove the compressed file
    root@container# tar -xvf musl.tar.gz && rm musl.tar.gz

    # Move the required compiler leveraging Musl to somewhere on the PATH (like /bin).
    root@container# cp -r arm-linux-musleabi-cross/ /bin

    # Update the PATH
    root@container# export PATH=$PATH:/bin/arm-linux-musleabi-cross/bin

Now that the compiler is available, we just need to change the compiler on the `Makefile` as defined by the `CC` variable:

    CC = arm-linux-musleabi-gcc

After all this changing around, the `Makefile` is pretty much like the original. We have just added the following as `line 40` and `line 41`, respectively:

    LDFLAGS = -static
    CC = arm-linux-musleabi-gcc

Now, we can issue `make` and everything should compile correctly. However, doing all this stuff every time we want to generate a binary is very tiresome. We'll now see how we can summarize a big chunk of the process with the help of a `Dockerfile`.

##### Summing it all up: the Dockerfile
The steps we followed above regarding the installation of dependencies for compilation can be taken care of with a `Dockerfile`. This allows us to use the `docker build` command to generate a *docker image* that's ready to be used. We just need to run the following from within the directory containing the `Dockerfile`:

    # Build the image. It will be named arm-cross-compiler
    docker build -t arm-cross-compiler .

The `Dockerfile` itself is:

```Dockerfile
FROM ubuntu

# Install the necessary dependencies and purge stuff afterwards
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y \
        curl \
        git \
        vim \
        libelf-dev \
        build-essential \
        pkg-config \
        gcc-arm-linux-gnueabi \
        binutils-arm-linux-gnueabi \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Pull Musl on a single instruction to create a layer
RUN curl -o musl.tar.gz https://musl.cc/arm-linux-musleabi-cross.tgz \
    && tar -xvf musl.tar.gz \
    && rm musl.tar.gz

# Install Musl
RUN cp -r arm-linux-musleabi-cross /bin

# Update PATH
ENV PATH="${PATH}:/bin/arm-linux-musleabi-cross/bin"
```

Once that's built, we can just carry out the same as above with:
   docker run -it --rm arm-cross-compiler

    # Now we just need to pull the code...
    root@container# git clone https://git.zx2c4.com/wireguard-tools.git

    # Navigate into it
    root@container# cd wireguard-tools/src

    # Add the lines specified above!
    root@container# vim Makefile

    # And compile! This will generate `wg` on the current directory.
    root@container# make

Now, if you run `make` again you should be greeted by a statically compiled `wg` file that can be leveraged on any system! On top of that, we will also copy the `wireguard-tools/src/wg-quick/linux.bash` script, as it allows us to comfortably control *WireGuard* on the target system. We can pull that file from within the container with [`docker cp`](https://docs.docker.com/engine/reference/commandline/cp/) if we didn't pass a volume to it.

We just need to move these two files somewhere within the `PATH` on the target system like with the *VPN implementation*:

    # Copy the wg tool implementation to the target system
    scp wg <username>@<target-ip>:/bin

    # Make the script executable
    chmod +x src/wg-quick/linux.bash

    # And copy it to the target machine
    scp src/wg-quick/linux.bash <username>@<target-ip>:/bin/wg-quick

With that, we would have the `wg` utility up and running on the target system!

### Setting up WireGuard on the target system
We just need to move the generated certificate file for the target system to `/etc/wireguard` so that it can be detected by `wg-quick`. Assuming said file is `wg0.conf` we just need to run:

    # Note prompt '$' denotes the local system and '>' the remote one.

    # Log into the remote system
    $ ssh <username>@<target-ip>

    # Make the /etc/wireguard directory
    > mkdir -p /etc/wireguard

    # And move the configuration there
    $ scp wg0.conf <username>@<target-ip>:/wtc/wireguard

With that, we should be able to run `wg-quick up wg0.conf` from within the remote system and we should see an interface output similar to:

    > ip link
    1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN mode DEFAULT group default qlen 1000
        link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP mode DEFAULT group default qlen 1000
        link/ether f8:dc:7a:3a:a0:be brd ff:ff:ff:ff:ff:ff
    3: sit0@NONE: <NOARP> mtu 1480 qdisc noop state DOWN mode DEFAULT group default qlen 1000
        link/sit 0.0.0.0 brd 0.0.0.0
    4: wlan0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP mode DEFAULT group default qlen 1000
        link/ether 00:25:ca:33:80:b3 brd ff:ff:ff:ff:ff:ff
    5: wg0: <POINTOPOINT,MULTICAST,NOARP,UP,LOWER_UP> mtu 1420 qdisc pfifo_fast state UNKNOWN mode DEFAULT group default qlen 500
        link/none

That implies that everything is working fine! We have both a `wg0` interface and the `sit0` one. This hints that the implementation relies on a some kind of *IPv4/IPv4* tunnel...

## Extending the above
When working with the target embedded system we got in touch with the manufacturer to try and get some custom built libraries for the machine. These would allow us to interact with the system's hardware so that we could incorporate the data it generated into our own programs. The manufacturer provided both the original `C++` libraries as well as bindings for `go`, the language we are developing our software in. The thing is, this also called for some cross-compilation with a brand-new twist. Given the structure of the bindings, we had to make the `go` code interact with the `C++` one through the [`cgo`](https://pkg.go.dev/cmd/cgo) package.

Just like before, we decided to write a `Dockerfile` that would allow us to carry all the process out within a container. We now need to compile `go` code form **within the container**, which added a new step to the `Dockerfile`: we need to install `go` and all its tools (such as the compiler). We also had to load the original `C++` libraries into the container and then tell `go` where to find them. After a lot of trial and error we finally came up with the following:

```dockerfile
FROM ubuntu:20.04

# Get APT dependencies:
    # curl: Allows us to download the Go distribution
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y \
        curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Get Go
RUN curl -o go.tar.gz https://dl.google.com/go/go1.17.3.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go.tar.gz && \
    rm -rf go.tar.gz

# Pull the cross compiler in
COPY ./toolchain/gcc-arm-9.2-2019.12-x86_64-arm-none-linux-gnueabihf /bin/gcc-arm-toolchain

# Get the header files and the compiled library too
COPY ./toolchain/manufacturer_provided_files/lib /usr/lib/emod
COPY ./toolchain/manufacturer_provided_files/include /usr/include/emod

# Update the path so as to include Go
ENV PATH="/usr/local/go/bin:${PATH}"

# Update compilation vars for GO:
    # Target architecture to compile against
    ENV GOARCH="arm"

    # Target OS to compile against
    ENV GOOS="linux"

    # Enable Go's interation with pure C code
    ENV CGO_ENABLED="1"

    # Tell Go which compiler to use for C code (i.e. the gcc ARM cross-compiler we loaded before)
    ENV CC="/bin/gcc-arm-toolchain/bin/arm-none-linux-gnueabihf-gcc"

    # Tell the C compiler where to look for headers (i.e. *.hpp and *.h files).
    ENV CGO_CFLAGS="-I/usr/include/emod/"

    # tell the C compiler where to look for libraries (i.e. *.a files)
    ENV CGO_LDFLAGS="-L/usr/lib/emod/"
```

In order to leverage the above, we need to run the following command from a directory whose contents resemble:

```
.
|
+ ---   Dockerfile
+ --- + toolchain/
      |
      + --- manufacturer_provided_files/
      + --- gcc-arm-9.2-2019.12-x86_64-arm-none-linux-gnueabihf/
```

The contents of the toolchain directory are:

- *GNU Toolchain for the ARM Cortex-A Family*: This directory contains the `C++` compiler we point `go` to through the `CC` environment variable. It will be in charge of compiling the `C++` code the `go` bindings depend on. It can be downloaded [here](https://developer.arm.com/-/media/Files/downloads/gnu-a/9.2-2019.12/binrel/gcc-arm-9.2-2019.12-x86_64-arm-none-linux-gnueabihf.tar.xz?revision=fed31ee5-2ed7-40c8-9e0e-474299a3c4ac&hash=C54244E4E3875AACABA1DFB301ACA805). You can also browse the different toolchains [here](https://developer.arm.com/tools-and-software/open-source-software/developer-tools/gnu-toolchain/gnu-a/downloads/9-2-2019-12). Once downloaded, you will have to decompress them with `tar -xzf gcc-arm-9.2-2019.12-x86_64-arm-none-linux-gnueabihf.tar.xz`. The resulting directory is what needs to be stored under the `toolchain/` directory.

- *Original Manufacturer Libs*: These are, as the name implies, provided by the manufacturer. You'll also need to decompress them (probably with `tar -xzf <filename>` too) and place them under the `toolchain/` directory as well.

Finally, we can `cd` into the directory outlined above and run:

    docker build -t cc-embedded .

This will generate the `cc-embedded` *docker image* that can be run with:

    docker run --rm -it cc-embedded bash

Note the `--rm` flag will remove the container once we close the session (so as to keep our *docker* daemon tidy) and the `-it` flags will keep `STDIN` attached and allocate a pseudo-`TTY`, respectively. This prevent the container from staring and closing, which would be the case if we did not interact with the provided shell interactively. We also recommend mounting code we want to compile into the container with the help of [volumes](https://docs.docker.com/storage/volumes/).

For instance, if we pull the examples from [bitbucket.org:pickdata-fw/emod_controller_binding_go](https://bitbucket.org/pickdata-fw/emod_controller_binding_go/src/master/), we can mount the examples into the container (assuming the repository is `cloned` as `go_bindings_repo`) with:

    docker run --rm -it -v /path/to/go_bindings_repo:/repo cc-embedded bash

The above would expose the repository within the container on the `/repo` directory. Once within it, we can just `cd` into an example and run:

    # Create a module for the example
    go mod init example/foo

    # Get the module's requirements
    go mod tidy

    # And build it!
    go build

As all the environment variables have been specified at the time of the image's creation, we can really simplify the building process! What's more, as the repository is mounted as a volume, the build process will generate the executable within our host's directory, no need to run `docker cp` anymore :sunglasses:

All in all, given these general ideas we believe it is feasible to adapt this process to any project you might be working on!

---

If you have any comments, questions or suggestions, feel free to drop me an email!

Thanks for your time! Hope you found this useful :smile_cat:
