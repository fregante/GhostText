# Contributing

## Requirements

[Node.js](https://nodejs.org/en/download/) version 15 or later is required.

## Workflow

First clone:

```sh
git clone https://github.com/GhostText/GhostText
cd GhostText
npm install
```

When working on the extension or checking out branches, use this to have it constantly build your changes:

```sh
npm run watch # Listen to file changes and automatically rebuild
```

Then load or reload it into the browser to see the changes.

## Loading into the browser

The built extension will be in the `distribution` folder.

- [Load it manually in Chrome](https://www.smashingmagazine.com/2017/04/browser-extension-edge-chrome-firefox-opera-brave-vivaldi/#google-chrome-opera-vivaldi)
- [Load it manually in Firefox](https://www.smashingmagazine.com/2017/04/browser-extension-edge-chrome-firefox-opera-brave-vivaldi/#mozilla-firefox).

Or use [web-ext](https://github.com/mozilla/web-ext) to load it automatically and watch for updates:

```sh
npm install -g web-ext
```

```sh
npx web-ext run --target=chromium # For Chrome
```

```sh
npx web-ext run # For Firefox
```
