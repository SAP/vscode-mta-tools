## Open Development

All work on VS Code MTA tools happens directly on GitHub.
Both core team members and external contributors send pull requests which go through the same review process.

## Branch Organization

We will do our best to keep the master branch in a good shape, with tests passing at all times.
But in order to move fast, we will make API changes that your application might not be compatible with.
We recommend that you use the latest stable version of vscode-mta-tools extension.

If you send a pull request, please do it against the `master` branch.
We maintain stable branches for major versions separately but we don’t accept pull requests to them directly.
Instead, we cherry-pick non-breaking changes from master to the latest stable major version.

## Semantic Versioning

VS Code MTA tools follows semantic versioning.
We release patch versions for bug-fixes, minor versions for new features, and major versions for any breaking changes.
When we make breaking changes, we also introduce deprecation warnings in a minor version
so that our users learn about the upcoming changes and migrate their code in advance.
Every significant change will be documented in the changelog file.

## Sending a Pull Request

The team is monitoring for pull requests. We will review your pull request and either merge it,
request changes to it, or close it with an explanation.

## Before submitting a pull request, please make sure the following is done:

1. Fork the repository and create your branch from master.
2. Run `npm install` in the repository root.
3. If you’ve fixed a bug or added code make sure the code is tested.
4. Run `npm run compile` to ensure all code compiles.
5. Run `npm run test` to ensure all tests pass.

### Committing Changes

This project uses the [Angular Preset](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit-message-format)
of the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) standard.

Use `git cz` to guide you through creating conforming commit messages.

- requires [commitizen](https://github.com/commitizen/cz-cli#installing-the-command-line-tool) to be installed.

### Formatting.

[Prettier](https://prettier.io/) is used to ensure consistent code formatting in this repository.
This is normally transparent as it automatically activated in a pre-commit hook using [lint-staged](https://github.com/okonet/lint-staged).
However this does mean that dev flows that do not use a full dev env (e.g editing directly on github)
may result in voter failures due to formatting errors.

### Release Process

Releases are currently only "implemented" as git/github tags.

- `npm run version:suggest` --> prints next suggested version version (using commit messages history).
- Run the [`npm version [patch|minor|major]`](https://docs.npmjs.com/cli/version)
  command using the suggested version from above
- `git push`
- `git push --tags`
