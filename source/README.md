# <img src="https://raw.githubusercontent.com/GhostText/GhostText/master/promo/gt_banner.png" height="60" alt="GhostText">

[![Chrome version][badge-cws]][link-cws] [![Firefox version][badge-amo]][link-amo]

[badge-cws]: https://img.shields.io/chrome-web-store/v/godiecgffnchndlihlpaajjcplehddca.svg?label=for%20chrome
[badge-amo]: https://img.shields.io/amo/v/ghosttext.svg?label=for%20firefox
[link-cws]: https://chrome.google.com/webstore/detail/ghosttext/godiecgffnchndlihlpaajjcplehddca 'Version published on Chrome Web Store'
[link-amo]: https://addons.mozilla.org/en-US/firefox/addon/ghosttext/ 'Version published on Mozilla Add-ons'

## Installation

Follow the [instructions on the main README.md](https://github.com/GhostText/GhostText/#installation)

## Installation of the development version

### Setup

Run this in the project root:

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
5. Select the folder `distribution` inside your newly cloned project

### On Firefox

1. Clone **GhostText** on your computer with `git clone https://github.com/GhostText/GhostText.git`
2. Visit `about:debugging#addons` in Firefox
3. Click on **Load Temporary Add-on**
4. Select the file `distribution/manifest.json` inside your newly cloned project
