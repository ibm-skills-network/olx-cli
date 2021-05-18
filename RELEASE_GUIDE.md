# Release Guide

The release process is manual. It has to be done on a maintainer's workstation locally.

Bump version and autoupdate `README.md`

```bash
npm version <new_version> -m "chore(release): %s"
```

Publish a new release on [NPM Registry](https://npmjs.com)

```bash
npm publish --access public [--tag canary] [--otp otp_code]
```
