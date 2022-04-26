---
title: Persistently modifying an operating system image
tags: fdisk mount partitions RaspberryPi bash
aside:
  toc: false
---

# Why would we want to do this?
I personally love Raspberry Pis: they are super versatile and I'm always thinking of new ways to use them.

Instead of hooking up a keyboard and mouse to them I'm used to deploying them [headlessly](https://www.raspberrypi.com/documentation/computers/configuration.html#setting-up-a-headless-raspberry-pi): I just plug them in and have them connect my home network so that I can interact with them over SSH. This however poses some difficulties:

- How can I configure a static IP address beforehand? (I could use [mDNS](https://en.wikipedia.org/wiki/Multicast_DNS), but I'm not really a fan :sweat_smile:)
- How can I enable SSH on the first boot?
- How can I configure the hostname before the first boot to avoid collisions with other RPis?
- How can I have the Pi connect to my WiFi network if I'm not using Ethernet?

These are all points we should take care of if we really seek a 'plug-n-play' workflow.

Now, when you 'burn' your operating system image (we'll assume it's [Raspberry Pi OS Lite](https://www.raspberrypi.com/software/operating-systems/)) to an SD card you'll notice it gets mounted as two separate partitions on your machine provided you're **not** using Windows. If you dig a bit around the `rootfs` partition you'll probably find some very familiar files and directories such as `/home/pi`, `/etc` and so on. This partition is going to be the Pi's main disk! Actually, `rootfs` gets mounted on `/` as seen on `/etc/fstab`:

    proc                  /proc           proc    defaults          0       0
    PARTUUID=7d5a2870-01  /boot           vfat    defaults,flush    0       2
    PARTUUID=7d5a2870-02  /               ext4    defaults,noatime  0       1

Well, it's actually a bit hard to 'see' it given we should take a look at the partition UUIDs and such but you get the point :sweat_smile:

The bottom line is we can modify these files and we'll in turn be modifying the contents of the RPi's HDD. If we know what we need to modify we can 'just do it' (pun intended) before booting up the Pi for the first time!

Now, imagine we need to headlessly boot not one but 10 machines: do we have to burn 10 SD cards with the stock image and then modify each of them manually? It's true parameters such as IP addresses and hostnames need to be provided to each machine individually, but the same's not true for WiFi network information for instance. The good thing is that, of course, we can avoid having to repeat the process over and over again. Isn't that what tech is for? :wink:

Please bear in mind that the following discussion only applies to Linux-based systems. We have chosen to use Fedora35, but you should be good to go with Ubuntu and Debian too!

## Mounting the image as a loopback device
In order to modify the operating system image we are to burn into SDs we'll mount it as a `loop` device. A [`loop(4)`](https://man7.org/linux/man-pages/man4/loop.4.html) device allows to expose a file as if it were a regular block device (such as an HDD). Wording can get a bit messy on manual pages, so you are good to go with the idea that a loop device let's you 'mount' an image. Thanks to this facility offered by Linux we can work with the image's contents without burning it to an SD card and then mounting it: we can skip the first step altogether!


### Inspecting the image
Before mounting the image as a loop device we need to know what it's contents really are: in other words, we need some information on the image's structure (in terms of partitions) so that we know what to mount and where to find it. We can take a look at that with the [`fdisk(8)`](https://man7.org/linux/man-pages/man8/fdisk.8.html) utility.

We have obtained the image we're to work with from [here](https://downloads.raspberrypi.org/raspios_lite_armhf/images/raspios_lite_armhf-2022-04-07/2022-04-04-raspios-bullseye-armhf-lite.img.xz). Given it's been compressed with [`xz(1)`](https://linux.die.net/man/1/xz) we need to decompress it first:

    # We have to decompress the image. Note `xz` decompresses the image in-place (i.e. it overwrites the compressed image).
    [collado@hoth ~]$ xz -d 2022-04-04-raspios-bullseye-armhf-lite.img.xz

    # We can now inspect the image with `fdisk`. Option `-l` lists the partition tables.
    [collado@hoth ~]$ fdisk -l 2022-04-04-raspios-bullseye-armhf-lite.img
    Disk 2022-04-04-raspios-bullseye-armhf-lite.img: 1.88 GiB, 2017460224 bytes, 3940352 sectors
    Units: sectors of 1 * 512 = 512 bytes
    Sector size (logical/physical): 512 bytes / 512 bytes
    I/O size (minimum/optimal): 512 bytes / 512 bytes
    Disklabel type: dos
    Disk identifier: 0x7d5a2870

    Device                                      Boot  Start     End Sectors  Size Id Type
    2022-04-04-raspios-bullseye-armhf-lite.img1        8192  532479  524288  256M  c W95 FAT32 (LBA)
    2022-04-04-raspios-bullseye-armhf-lite.img2      532480 3940351 3407872  1.6G 83 Linux

We can see how the size of each sector is `512 B` and where each of the partitions begins in terms of sectors. The `*.img1` partition corresponds to the `boot` partition we mentioned above and (you guessed it), the `*.img2` partition corresponds to `rootfs`.

Now that we know the *offset* (i.e. the starting point) and *size* of the partitions we can use [`mount(8)`](https://www.man7.org/linux/man-pages/man8/mount.8.html) to mount them right away!

### Creating the mountpoint
We'll first of all make a temporary directory to mount stuff on. We'll call it `tmp_mnt` (now, that's original):

    # Let's create the directory
    mkdir tmp_mount

### A note on math with bash
We should also take a brief look into *arithmetic evaluation* on the shell. That terms is just fancy for computing stuff, that is, adding and multiplying numbers and so on within the shell. On [`bash(1)`](https://www.man7.org/linux/man-pages/man1/bash.1.html) this can be done with double parenthesis:

    # This will fail horribly: the shell will try to execute a command named `3`
    [collado@hoth ~]$ 3 + 4
    -bash: 3: command not found

    # Let's use arithmetic expressions
        # As you'll notice, this shows nothing! This will just emit
        # a return code of `0` if the result is not 0 and `1` otherwise.
        # You can check that with `echo $?` right after execution!
    [collado@hoth ~]$ (( 3 + 4 ))

    # What we need are arithmetic expansions which do substitute the value.
        # This will try to execute `7` though
    [collado@hoth ~]$ $(( 3 + 4 ))
    -bash: 7: command not found

    # We just need to explicitly print the value and we're good
    [collado@hoth ~]$ echo $(( 3 + 4 ))
    7

So why all this? Well, we can just use this nifty feature when we call `mount`. Notice we need to express the offset in *bytes*, so we'll need to multiply the sector size for the image (i.e. `512 B`) times the sector offset to locate each partition's beginning. Now, instead of using pen and paper we can just explicitly pass everything to the command, which also makes it much easier to understand.

### Time to mount it!
So, with all that we find the next generic mount command for our purposes. Note we need to use `sudo` so be allowed to mount stuff!

    # The options  and arguments are:
        # -t: The filesystem type we're mounting. Each partition has a different one.
        # -o: These are the options passed to mount:
            # loop: We'll mount the image as a loop device.
            # offset: The offset (in bytes) where a partition starts.
        # img_file: The operating system image we are to mount.
        # target_directory: The directory on which to mount it.
    sudo mount -t <fs_type> -o loop,offset=$((<sector_size * <start_sector>)) <img_file> <target_directory>

The key option of the above is the `offset` option that tells mount where to start looking for the filesystem to mount. Notice the first partition's offset is **not** `0` but `8192` sectors! The file system type is determined by in the `Type` column in `fdisk -l`'s output and the target directory would be the `tmp_mount/` we just created. With the above in mind we can then run:

    # Mount the boot partition.
        # The FAT32 filesystem corresponds to the vfat type as seen in mount's manpage (i.e. man mount).
    sudo mount -t vfat -o loop,offset=$((512 * 8192)) 2022-04-04-raspios-bullseye-armhf-lite.img tmp_mount

    # Mount the rootfs partition.
        # The Linux filesystem corresponds to the ext4 type as seen in mount's manpage (i.e. man mount).
    sudo mount -t ext4 -o loop,offset=$((512 * 532480)) 2022-04-04-raspios-bullseye-armhf-lite.img tmp_mount

We can then check that `ls tmp_mount` does indeed show the contents of those partitions!

[collado@hoth ~]$ ls tmp_mount/
bin  boot  dev  etc  home  lib  lost+found  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var

Now we are free to alter this filesystem at will to suit or needs. We might write another article explaining the changes we would need to do to achieve a truly headless RPi setup.

Do bear in mind that both partitions **cannot** be mounted at the same time! We should either unmount one first or just create another directory.

### All good things come to an end: unmounting the image
Unmounting a partition is a matter of calling [`umount(8)`](https://man7.org/linux/man-pages/man8/umount.8.html). We can always call [`sync(1)`](https://man7.org/linux/man-pages/man1/sync.1.html) to flush the caches beforehand:

    # Flush cached writes and unmount the image.
        # Note the argument to `umount` is the directory on which we mounted the image.
    sync && umount tmp_mount

## We got there!
We did it! If you want to save some modifications you just have to make them effective and then unmount the image. After that, your `*.img` file will contain those changes no matter where you go. Isn't that cool?

---
If you have any comments, questions or suggestions, feel free to drop me an email!

Thanks for your time! Hope you found this useful :smile_cat:
