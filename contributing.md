# Contributing

## Requirements

[Node.js](https://nodejs.org/en/download/) version 15 or later is required.

## Workflow

First clone:

```sh
git clone https://github.com/fregante/GhostText
cd GhostText
npm install
```

When working on the extension or checking out branches, use this to have it constantly build your changes:

```sh
# Build once
npm run build

# or listen to file changes and automatically rebuild
npm run watch
```

Then load or reload it into the browser to see the changes.

## Loading into the browser

The built extension will be in the `distribution` folder.

- [Load it manually in Chrome](https://www.smashingmagazine.com/2017/04/browser-extension-edge-chrome-firefox-opera-brave-vivaldi/#google-chrome-opera-vivaldi)
- [Load it manually in Firefox](https://www.smashingmagazine.com/2017/04/browser-extension-edge-chrome-firefox-opera-brave-vivaldi/#mozilla-firefox)

Or use [web-ext](https://github.com/mozilla/web-ext) to load it automatically and watch for updates:

```sh
# Install tool globally
npm install -g web-ext
```

```sh
# Run extension in Chrome
web-ext run --target=chromium
```

```sh
# Run extension in Firefox
web-ext run
```
