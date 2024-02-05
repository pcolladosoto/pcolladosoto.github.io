---
title: "Capturing traffic remotely with WireShark"
tags: ["networking", "WireShark", "captures"]
date: "2023-10-05"
summary: "Sometimes running `tcpdump` and then `scp` is a bit much: let's just open WireShark instead!"
aside:
  toc: false
---

# Live remote traffic captures
Leveraging FIFOs, we can capture live traffic on a machine:

    wireshark -k -i <(ssh infieri2020.ft.uam.es tcpdump -i lo -w -)

# References:
- Original post: https://www.howtoforge.com/wireshark-remote-capturing
- WireShark manpage: https://linux.die.net/man/1/wireshark
- Process substitution: https://www.gnu.org/software/bash/manual/html_node/Process-Substitution.html
