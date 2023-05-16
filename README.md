# My personal site

## Hook installation
We've written a hook to make sure the site is built whenever a commit is made.

We can install it in all sorts of fancy ways, but the easiest thing to do is just:

    $ cp build-hook .git/hooks/pre-commit

Piece of cake!

## Working with the synth submodule
Given the synthesizer reachable at [pcolladosoto.github.io](https://pcolladosoto.github.io/synth/) is complex
enough to justify it living in its own repository, we decided to give *Git Submodules* a try.

These submodules are a nifty `git` feature letting us **embed** a repository into another one whilst preventing
their histories getting intertwined. You can read more on them on the [Git Book](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
and you can also refer to [this](https://github.blog/2016-02-01-working-with-submodules/) super-helpful blog entry.

The idea is these submodules are defined on `.gitmodules` and they are treated somewhat like regular directories. Internally
they just behave like **references** to particular *commits* on remote repositories though: this way we can keep everything
in sync.

### Adding a new submodule
Adding our `synth` submodule was as easy as running:

    $ git submodule add https://github.com/pcolladosoto/synth.git docs/synth

Bear in mind we **must** use the read-only `https` address for cloning the repo. If we were to use the more common `ssh` URI
GitHub pages wouldn't be able to serve the contents as explained on the [doc](https://docs.github.com/en/pages/getting-started-with-github-pages/using-submodules-with-github-pages).

New `git` versions (we're running `v2.40.0`) will 'unpack' submodules on their own. On older installs one might need
to do that explicitly with:

    $ git submodule update --init --recursive

In any case, after running the first command we will find a newly populated `.gitmodules` which we **must** keep in version
control.

That's pretty much all there's to it for now. Bear in mind these submodules introduce slight changes in the usual
workflow. The good news is we won't be adding a ton of stuff, so things will pretty much sit idle.
