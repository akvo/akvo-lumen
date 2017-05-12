# How to contribute

Thank you for deciding to help us! It is very much appreciated and we will do our very best to help you.

## Reporting bugs

If you find a bug in the source code or a mistake in the documentation, you can help us by
[submitting an issue to our GitHub repository](https://github.com/akvo/akvo-lumen/issues/new). Even better, you can also submit []a Pull Request](https://github.com/akvo/akvo-lumen/compare/) with a fix if you have one.

## Suggesting improvements
If you have something that you would like to see improved in Akvo Lumen, feel free to either [add an issue](https://github.com/akvo/akvo-lumen/issues/new) in the repository or get in contact with us by emailing lumen@akvo.org.

## Making Changes

* Make sure you have a [GitHub account](https://github.com/signup/free)
* Submit a ticket for your issue, assuming one does not already exist.
  * Clearly describe the issue including steps to reproduce when it is a bug.
  * Make sure you fill in the earliest version that you know has the issue.
* Fork the repository on GitHub
* Create a topic branch from where you want to base your work.
  * This is usually the `develop` branch.
  * To quickly create a topic branch based on develop; `git checkout -b
    fix/develop/my-contribution-name develop`. Do not work directly on the
    `develop` branch.
  * If you've already submitted an issue you should name the topic branch like this example `issue/498-flow-spelling`
* Make commits of logical units.
* Check for unnecessary whitespace with `git diff --check` before committing.
* Make sure your commit messages are written in a clear and understandable language.
* Your commit messages must have a reference to the issue number `e.g. [#issueNumber] Some nice explanation`
* Make sure you have added the necessary tests for your changes.
* Run _all_ the tests to assure nothing else was accidentally broken.

## Submitting Changes

* Sign the [Contributor License Agreement](https://docs.google.com/forms/d/e/1FAIpQLSdMJUjA_SxhXx9yRfxxC9syA0-VLlM4txAHp31cD-tTx8FjYA/viewform).
* Push your changes to a topic branch in your fork of the repository.
* Submit a [pull request](https://github.com/akvo/akvo-lumen/compare/) to the repository in the Akvo organization.
* The core team will have a look at Pull Requests on a regular basis and get back to you with requests for changes if needed.

## Where should I start? (Help wanted)

* [Simple problems](https://github.com/akvo/akvo-lumen/labels/simple) (for beginners)
* [Help wanted](https://github.com/akvo/akvo-lumen/labels/help-wanted)
* [Frontend](https://github.com/akvo/akvo-lumen/labels/frontend)

## Code of conduct
* Be nice.
* Give constructive feedback.
* Be prepare to gracefully accept constructive criticism.

## Coding rules
* We adhere to SOLID principles and try our best to do clean code.
* Include unit tests when you contribute fixes or new features. They help us guard against code rot and regressions.

## Additional Resources

* [Contributor License Agreement](https://www.dropbox.com/s/zgtvufaxgjxqd8f/akvo%20contributor%20agreement%20v1_4.pdf)
* [General GitHub documentation](https://help.github.com/)
* [GitHub pull request documentation](https://help.github.com/articles/creating-a-pull-request/)