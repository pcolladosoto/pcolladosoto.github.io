# My personal site
Hi! Welcome to the inside of my personal website: it's not that bad is it? It's just a bit of MarkDown assembled with Hugo!

The site's deployment has been automated and is taken care of by a GitHub Action that's been lifted verbatim from Hugo's doc.
That basically means nothing needs to be done ofr pushing changes aside from following the usual git workflow.

## Checking changes locally
However, we'd rather spot errors and/or typos before pushing changes: that's where Hugo comes to the rescue! We can just
run the following to serve a fresh copy (refreshed with every file change actually) with a local HTTP server:

    $ hugo server

We can also check building works as expected even though having `hugo server` work is more than enough proof...

    $ hugo build

These two commands allow us to push stuff we know looks good!

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
