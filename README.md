# ![GhostText for Sublime Text](https://raw.githubusercontent.com/Cacodaimon/GhostText-for-Chrome/master/images/logo_banner-for-sublimetext.png)
Use Sublime Text to write in your browser (only Google Chrome for now)

## Usage

In Chrome, when you're in a page with a plain-text field (`<textarea>`), click the GhostText button in the upper-right corner to open up Sublime Text. Everything you type in the editor will be instantly updated in the browser (and vice versa).

[![Video of how it works](http://img.youtube.com/vi/e0aLFPtYPZI/maxresdefault.jpg)](http://youtu.be/e0aLFPtYPZI)


## Installation

Install the [Sublime Text package](https://sublime.wbond.net/packages/ChromeTextArea) and the [Chrome extension](https://chrome.google.com/webstore/detail/sublimetextarea/godiecgffnchndlihlpaajjcplehddca) and you're ready to go!

[![Chrome extension](https://developer.chrome.com/webstore/images/ChromeWebStore_BadgeWBorder_v2_206x58.png)](https://chrome.google.com/webstore/detail/sublimetextarea/godiecgffnchndlihlpaajjcplehddca)

It's suggested to install a Markdown syntax like those included in [MarkdownEditing](https://sublime.wbond.net/packages/MarkdownEditing). Once installed, open GhostText's user settings (Preferences > Package Settings > GhostText > Settings - User) and paste this in:
```json
{
    "default_syntax": "Packages/MarkdownEditing/Markdown.tmLanguage"
}
```

## Learn more

* [Video of how it works (to be updated)](http://www.youtube.com/watch?v=e0aLFPtYPZI&feature=share)
* [Article about its inner workings](http://cacodaemon.de/index.php?id=59)

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
