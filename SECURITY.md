# Security policy

This repository holds the source of olaheavy.dev, the personal site of Sunkanmi Olawuwo.

## Reporting a vulnerability

Please report security issues **privately** using GitHub's private vulnerability reporting: open the repository's **Security** tab and choose **Report a vulnerability**. Don't open a public issue for a security problem.

Include what you found, how to reproduce it, and its likely impact. You'll get an acknowledgement as soon as practical.

## Scope

- Code, workflows and configuration in this repository.
- The live site at olaheavy.dev, including its admin area and assistant endpoint.
- Secrets or personal data accidentally committed here.

Third-party services and packages are out of scope; report those to their maintainers.

## What's in place

Secret scanning with push protection, Dependabot security updates and alerts, required pull requests and status checks on `main`, GitHub Actions pinned to exact commits and checked by actionlint and zizmor, and dependency review on every pull request. See `docs/decisions/0013-quality-gate.md`.
