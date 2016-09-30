# <img src="https://raw.githubusercontent.com/GhostText/GhostText/master/promo/gt_banner.png" height="60" alt="GhostText">

[![Version published on Chrome Web Store](https://img.shields.io/chrome-web-store/v/godiecgffnchndlihlpaajjcplehddca.svg)](https://chrome.google.com/webstore/detail/sublimetextarea/godiecgffnchndlihlpaajjcplehddca)
[![travis build](https://travis-ci.org/GhostText/GhostText.svg?branch=master)](https://travis-ci.org/GhostText/GhostText)

## Installation

Follow the [instructions on the main README.md](https://github.com/GhostText/GhostText/#installation)

## Installation of the development version

### Setup

Run this in the project root (outside the folder `browser`):

```sh
npm install
npm run build
# or this:
npm run watch
```

### On Chrome

1. Clone **GhostText** on your computer with `git clone https://github.com/GhostText/GhostText.git`
2. Visit `chrome://extensions/` in Chrome
3. Enable the **Developer mode** in the upper-right corner
4. Use the "Load unpacked extension…" button on the left
5. Select the folder `browser` inside your newly cloned project

### On Firefox

1. Clone **GhostText** on your computer with `git clone https://github.com/GhostText/GhostText.git`
2. Visit `about:debugging#addons` in Firefox
3. Click on **Load Temporary Add-on**
4. Select the file `browser/manifest.json` inside your newly cloned project
