# ![GhostText for Sublime Text](https://raw.githubusercontent.com/Cacodaimon/GhostText-for-Chrome/master/promo/gt_banner-for-sublimetext.png)
Use Sublime Text to write in your browser. Everything you type in the editor will be instantly updated in the browser (and vice versa).

[![Video of how it works](http://img.youtube.com/vi/e0aLFPtYPZI/maxresdefault.jpg)](http://youtu.be/e0aLFPtYPZI)

## Support 

GhostText is only compatible with Sublime Text and Google Chrome for now, but more extensions are on the way. [You can contribute.](https://github.com/Cacodaimon/GhostText-for-SublimeText/issues/3)

Currently **the only supported field is `<textarea>`,** but [we're working to support more](https://github.com/Cacodaimon/GhostText-for-Chrome/issues/26), like ACE editor and CodeMirror.

## Usage

### Open the connection

In Chrome, click the GhostText button in the upper-right corner to open up Sublime Text.

If there is more than one supported field in the current page and you haven't *focused* any of them already, you will be prompted to click on a field to open the connection.

### Close the connection

The connection will be closed when:
* The webpage changes or is reloaded
* The tab or window is closed (either in the browser or in the editor)
* The used field is removed from the document

## Installation

Install the [Sublime Text package](https://sublime.wbond.net/packages/GhostText) and the [Chrome extension](https://chrome.google.com/webstore/detail/sublimetextarea/godiecgffnchndlihlpaajjcplehddca) and you're ready to go!

[![Chrome extension](https://developer.chrome.com/webstore/images/ChromeWebStore_BadgeWBorder_v2_206x58.png)](https://chrome.google.com/webstore/detail/sublimetextarea/godiecgffnchndlihlpaajjcplehddca)

It's suggested to install a GitHub-Flavored Markdown syntax like the one included in [MarkdownEditing](https://sublime.wbond.net/packages/MarkdownEditing).

If you are using Linux installing [wmctrl](http://tomas.styblo.name/wmctrl/) lets GhostText focus your Sublime Text window on a new connection.

On Windows you should consider installing [nircmd](http://www.nirsoft.net/utils/nircmd.html) in the windows dir, for archiving the same window focus behavior described above.


## Complementary repos

* [GhostText for Chrome](https://github.com/Cacodaimon/GhostText-for-Chrome)
* [GhostText for Firefox](https://github.com/Cacodaimon/GhostText-for-Firefox) (prototype)

## Learn more

* [Video of how it works](http://www.youtube.com/watch?v=e0aLFPtYPZI&feature=share)
* [Article about the initial proof of concept](http://cacodaemon.de/index.php?id=59)

## Development version

To try the latest version, follow these istructions:

**Without Git:** Download the latest source from [GitHub](https://github.com/Cacodaimon/GhostText-for-SublimeText) and copy the GhostText folder to your Sublime Text "Packages" directory.

**With Git:** Clone the repository in your Sublime Text "Packages" directory:

    git clone https://github.com/Cacodaimon/GhostText-for-SublimeText.git


The "Packages" directory is located at:

* OS X:

        ~/Library/Application Support/Sublime Text 3/Packages/

* Linux:

        ~/.config/sublime-text-3/Packages/

* Windows:

        %APPDATA%/Sublime Text 3/Packages/
