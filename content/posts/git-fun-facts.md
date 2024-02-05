---
title: "Some fun Git facts I've come across"
tags: ["git", "fun-facts"]
date: "2023-05-15"
summary: "Git is an amazing tool that's so bit you sometimes run into quirks: I'm just writing them down!"
---

# Some fun Git facts I've come across
Even though I don't get to spend as much time with `git` as I would like, I still
manage to find some interesting and fun facts I had no idea existed in the first place.

Instead of jotting them down some place I would surely forget, I decided to collect them
here so that I know where to find them. I'm bound to run into them sometime in the future
at least...

So... Let the fun begin!

## Git external commands
Meddling with a repository's history is no task for the fain of heart. In the early days of
`git` one would usually resort to [`git-filter-branch`](https://git-scm.com/docs/git-filter-branch)
for everything more complex than a rebase.

The thing is, `git-filter-branch` was rather 'clunky' and 'sluggish' from the performance and
usability points of view. In order to address these issues and provide more features, the
[`git-filter-repo`](https://github.com/newren/git-filter-repo) tool was born.

This new tool is distributed as a single Python script: you just need to 'drop it' somewhere in
your `PATH` and you are good to go. What baffled me was that you can invoke this script not
only with `git-filter-repo`, but with `git filter-repo` (note the space) too. What goes going on?

It turns out `git` supports what it calls **external commands**. I had to dig all the way down to
the [`git-help`](https://git-scm.com/docs/git-help) manpage to find a reference to these commands
after seeing `filter-repo` listed on the output of `git help -a`. These commands are nothing
more than executables sitting somewhere on the `PATH` whose name begins with `git-`: how cool is that?

In order to test this theory we can just write an executable script and try to run it through `git`.
Time to get our hands dirty:

First of all, let's take a look at the script. We decided to write a Bash one-liner printing a message.
Note the [shebang](https://en.wikipedia.org/wiki/Shebang_(Unix)): we want to make sure it's `bash` running
the script.

```bash
#!/bin/bash

echo "Hello from Git!"
```

We'll store that on a file called `git-test` (we need to stick to the `git-` naming convention) and then
make it executable. We can leverage a bit of bash-fu and `cat` to make all the process a couple of lines
long. Note the `$` denotes our shell's *prompt*.

```shell
# We're using bash heredocs. Be sure to read up on them: they are super helpful.
$ cat > git-test <<-EOF
#!/bin/bash

echo "Hello from Git!"
EOF

# We need to make the file executable...
$ chmod +x git-test
```

Let's check everything's okay: we just need to run the executable and make sure the message is printed.

```shell
$ ./git-test
Hello from Git!
```
Next up we need to add out current directory to our `PATH`: that way `git` will pick up our command. We
can do that with a single line, but bear in mind these changes will be undone as soon as you open up a
new shell...

```shell
$ export PATH=$PATH:$(pwd)
```

And that's pretty much it all there's to it really! Time to check everything went as expected. We'll begin
by inspecting the output of `git help -a`. The final block should look something like:

```shell
$ git help -a
... snip ...
External commands
   test
```

That's it! Our command is 'picked up' by `git` itself. Time to finish what we started:

```shell
$ git test
Hello from Git!
```

We did it! This is why commands such as `git-filter-repo` can be invoked directly through the `git` binary.
Now that's one less thing bouncing around in our head... Hope you found it interesting!
