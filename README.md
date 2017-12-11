# <img src="https://raw.githubusercontent.com/GhostText/GhostText/master/promo/gt_banner.png" height="60" alt="GhostText">

<img src="promo/demo.gif" alt="Demo screencast" align="right"> 

Use your text editor to write in your browser. Everything you type in the editor will be instantly updated in the browser (and vice versa).

**Notice: GhostText generally works but it has some bugs across the various implementations. If you use it regularly please consider contributing/bugfixing your editor's GhostText plugin.**

## Installation

1. Install your editor extension:
    + [**Sublime Text** extension](https://sublime.wbond.net/packages/GhostText) - [Repo](https://github.com/GhostText/GhostText-for-SublimeText)
    + [**Atom** package](https://github.com/GhostText/GhostText-for-Atom)
    + [**VS Code** extension](https://marketplace.visualstudio.com/items?itemName=tokoph.ghosttext) - [Repo](https://github.com/jtokoph/ghosttext-vscode) (Third party)
    + [**Vim** script](https://github.com/falstro/ghost-text-vim) (Third party)
    + [**Neovim** plugin](https://github.com/raghur/vim-ghost) (Third party)
    + [**Emacs** package](https://melpa.org/#/atomic-chrome) - [Repo](https://github.com/alpha22jp/atomic-chrome) (Third party)
    + [**Acme** client](https://github.com/fhs/Ghost) (Third party)
2. Install your browser extension:
    + [**Chrome** extension](https://chrome.google.com/webstore/detail/ghosttext/godiecgffnchndlihlpaajjcplehddca)
    + [**Firefox** add-on](https://addons.mozilla.org/en-US/firefox/addon/ghosttext/)
    + Opera - Use [this](https://addons.opera.com/en/extensions/details/download-chrome-extension-9/) to install the Chrome extension.

## Website support 

* `<textarea>` elements
* [`contentEditable`](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Content_Editable) areas: like in Gmail
* [CodeMirror](http://codemirror.net/) editors: used on CodePen, JSFiddle, JS Bin, …
* [Ace](http://ace.c9.io/) editor: used on Tumblr, …

## Usage

1. Open your editor
2. Sublime Text automatically starts the GhostText server, but in some editors you’ll need to run the "Enable GhostText" command. Refer to your editor's GhostText extension readme.
3. In the browser, click the **GhostText** button in the browser’s toolbar to start the connection for the current tab.
4. If there's more than one field, you may be asked to select which field to synchronize. Click inside it to start.

### Keyboard shortcuts

In Chrome, you can use a keyboard shortcut to enable GhostText instead of clicking the button. You can [change it or disable it.](http://lifehacker.com/add-custom-keyboard-shortcuts-to-chrome-extensions-for-1595322121)

Firefox [doesn’t support them yet.](https://github.com/GhostText/GhostText/issues/113)

<table>
  <tr>
    <th>OS</th>
    <th>Shortcut</th>
  </tr>
  <tr>
    <td>Chrome on Windows</td>
    <td><kbd>ctrl</kbd> + <kbd>shift</kbd> + <kbd>K</kbd></td>
  </tr>
  <tr>
    <td>Chrome on Linux</td>
    <td><kbd>ctrl</kbd> + <kbd>shift</kbd> + <kbd>H</kbd></td>
  </tr>
  <tr>
    <td>Chrome on Mac</td>
    <td><kbd>cmd</kbd> + <kbd>shift</kbd> + <kbd>K</kbd></td>
  </tr>
</table>

## License

MIT © [Federico Brigante](http://twitter.com/bfred_it), Guido Krömer
