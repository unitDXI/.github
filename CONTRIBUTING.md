# Contributing to Unit 511 (DXI)

Thank you for helping. This guide is the default for every public repository in the `unitDXI` organisation. A repository may add its own `CONTRIBUTING.md` with extra detail.

Everyone who takes part agrees to the [Code of Conduct](CODE_OF_CONDUCT.md).

## The curriculum site

The source of the curriculum site, [unitdxi.fairytale.ai](https://unitdxi.fairytale.ai/), is maintained in a private repository. You can still shape it:

| You want to… | Do this |
|:--|:--|
| Report a factual error or unclear explanation | [Open a *Content error* issue](https://github.com/unitDXI/.github/issues/new/choose) and quote the page URL and the passage |
| Report a broken link or a page that doesn't work | Open a *Broken link or site bug* issue |
| Write or review a lesson | Open a *Lesson proposal* issue first, so we can agree on scope before you write |
| Ask a question or share an idea | Start a [discussion](https://github.com/orgs/unitDXI/discussions) |
| Report a security problem with the site | **Don't open an issue.** Follow the [security policy](SECURITY.md) |

Maintainers turn accepted reports and proposals into site changes. Lesson authors are credited on the lesson page and in the release notes.

### What a good lesson proposal includes

- The course (for example `511-101`) or track (for example *Python*) and the lesson from its syllabus.
- Three learning objectives, each starting with a verb.
- The worked example you plan to use, and the exercise that adds to the course artifact.
- Confirmation that every example runs for free on public tools, with no paid API keys.

## Public tool and notebook repositories

Repositories such as notebooks, starter projects and tools accept pull requests.

1. **Open an issue first** for anything bigger than a typo, so effort isn't wasted.
2. **Fork, branch and keep changes focused**: one change per pull request.
3. **Explain what and why** in the pull request description, and how you tested it.
4. **Sign off your commits** (`git commit -s`) to confirm you have the right to contribute the work under the repository's licence.

## Content standards

These apply to every contribution, in every repository.

1. **Free and public.** Examples must run on free, public tools, with no paid API keys. Hosted services can appear only as optional asides.
2. **Vendor-neutral.** When you name a product or model, name at least one alternative.
3. **Accurate.** Link primary sources. Anything likely to change, such as model names, context sizes, prices and API limits, gets an "as of *Month Year*" note.
4. **Tested.** Run every code sample and show its real output. Pin third-party versions.
5. **Nothing internal.** Never describe Fairytale.ai internal systems, tools, APIs or plans.

## Licences

- **Lessons and other written content**, including the code samples in lessons: [CC BY-NC 4.0](LICENSE-CONTENT). Non-commercial reuse with credit.
- **The curriculum site's own code** (HTML, CSS, JavaScript, templates and tooling): proprietary, all rights reserved.
- **Code in public tool and notebook repositories**, and this landing page's code: [MIT](LICENSE), unless a repository says otherwise.

By contributing, you agree that your contribution is licensed under the same terms as the material you contribute to: CC BY-NC 4.0 for lesson content, and the repository's licence for code. Contributions that end up in the curriculum site's own code stay all rights reserved, and you grant Fairytale.ai the right to use them. Sign off your commits (`git commit -s`) to confirm you have the right to contribute the work.
