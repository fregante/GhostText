# <img src="https://raw.githubusercontent.com/fregante/GhostText/main/promo/gt_banner.png" height="60" alt="GhostText">

<img src="promo/demo.gif" alt="Demo screencast" align="right">

Use your text editor to write in your browser. Everything you type in the editor will be instantly updated in the browser (and vice versa).

**Notice: GhostText generally works but it has some bugs across the various implementations. If you use it regularly please consider contributing/bugfixing your editor's GhostText plugin.**

## Installation

1. Install your editor extension:

	- [**Sublime Text**](https://sublime.wbond.net/packages/GhostText) ([Repo](https://github.com/GhostText/GhostText-for-SublimeText))
	- [**Atom**](https://github.com/GhostText/GhostText-for-Atom)
	- [**VS Code**](https://marketplace.visualstudio.com/items?itemName=tokoph.ghosttext) ([Repo](https://github.com/jtokoph/ghosttext-vscode)) (Third party)
	- [**Emacs**](https://melpa.org/#/atomic-chrome) ([Repo](https://github.com/alpha22jp/atomic-chrome)) (Third party)
	- [**Acme**](https://github.com/fhs/Ghost) (Third party)
	- [**Vim**](https://github.com/raghur/vim-ghost) (Third party)
	- [**Neovim**](https://github.com/subnut/nvim-ghost.nvim) (Third party)

2. Install your browser extension:

	[link-chrome]: https://chrome.google.com/webstore/detail/refined-github/godiecgffnchndlihlpaajjcplehddca 'Version published on Chrome Web Store'
	[link-firefox]: https://addons.mozilla.org/en-US/firefox/addon/ghosttext/ 'Version published on Mozilla Add-ons'
	[link-safari]: https://apps.apple.com/app/ghosttext/id1552641506 'Version published on the Mac App Store'

	[<img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/chrome/chrome_128x128.png" width="48" alt="Chrome" valign="middle">][link-chrome] [<img valign="middle" src="https://img.shields.io/chrome-web-store/v/godiecgffnchndlihlpaajjcplehddca.svg?label=%20">][link-chrome] also compatible with [<img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/edge/edge_48x48.png" width="24" alt="Edge" valign="middle">][link-chrome] [<img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/opera/opera_48x48.png" width="24" alt="Opera" valign="middle">][link-chrome]

	[<img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/firefox/firefox_128x128.png" width="48" alt="Firefox" valign="middle">][link-firefox] [<img valign="middle" src="https://img.shields.io/amo/v/ghosttext.svg?label=%20">][link-firefox]

	[<img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/safari/safari_128x128.png" width="48" alt="Safari" valign="middle">][link-safari] [<img valign="middle" src="https://img.shields.io/itunes/v/1552641506.svg?label=%20">][link-safari]

	[<img src="https://raw.githubusercontent.com/iamcal/emoji-data/08ec822c38e0b7a6fea0b92a9c42e02b6ba24a84/img-apple-160/1f99a.png" width="48" valign="middle">](https://github.com/sponsors/fregante) _If you love GhostText, consider [sponsoring or hiring](https://github.com/sponsors/fregante) the maintainer [@fregante](https://twitter.com/fregante)_

## Usage

1. Open your editor
2. Click the **GhostText** button in the browser’s toolbar
3. Click inside the desired field (if there’s more than one)

Notice: in some editors you’ll need to run the _Enable GhostText_ command after step 1. Refer to your editor’s GhostText extension readme. Sublime Text does this automatically.

## How it works

GhostText is split in two parts:

- a HTTP and WebSocket server in the text editor
- a client in the browser

When you activate GhostText by clicking the button, the browser will try contacting the server in the text editor (at the port specified in the options) and open a WebSocket connection. Every change will be transmitted to the other side. Each side can close the socket and the session will be over.

## Troubleshooting

You can verify whether it works by visiting the [testing page](https://ghosttext.github.io/GhostText/demo/).

### No supported fields found

GhostText supports the following types of fields:

- `<textarea>` elements
- [`contentEditable`](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Content_Editable) areas: like in Gmail
- [CodeMirror](http://codemirror.net/) editors: used on CodePen, JSFiddle, JS Bin, …
- [Ace](http://ace.c9.io/) editor: used on AWS, Khan Academy, Wikipedia, …

If the website you activate it on doesn't have any of the above, it's not compatible.

### Unable to connect to the editor

Ensure that:

- Your editor is open
- Its GhostText extension is installed
- The GhostText server is running (in most editor extensions this is opened automatically)
- The server port matches (it's 4001 by default, it can be changed in the options)
- There are no other servers using the port

If it still doesn't work, try again in [Sublime Text](https://www.sublimetext.com), it's the main supported editor of GhostText.

## Keyboard shortcuts

You can use a keyboard shortcut instead of clicking the button. The shortcut can be changed or disabled,
[like this in Chrome](http://lifehacker.com/add-custom-keyboard-shortcuts-to-chrome-extensions-for-1595322121)
or
[like this in Firefox](https://support.mozilla.org/en-US/kb/manage-extension-shortcuts-firefox).

<table>
	<tr>
		<th>OS</th>
		<th>Shortcut</th>
	</tr>
	<tr>
		<td>Windows</td>
		<td><kbd>ctrl</kbd> + <kbd>shift</kbd> + <kbd>K</kbd></td>
	</tr>
	<tr>
		<td>Linux</td>
		<td><kbd>ctrl</kbd> + <kbd>shift</kbd> + <kbd>H</kbd></td>
	</tr>
	<tr>
		<td>Mac</td>
		<td><kbd>cmd</kbd> + <kbd>shift</kbd> + <kbd>K</kbd></td>
	</tr>
</table>

## License

MIT © [Federico Brigante](https://fregante.com)
