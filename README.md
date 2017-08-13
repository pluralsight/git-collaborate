# Git Switch Electron
Cross-platform electron app for managing git users while pair/mob programming


## Installation
* Please choose the package for your OS:
    * [MacOS](https://github.com/pluralsight/git-switch-electron/tree/master/lib/git-switch-darwin-x64)
    * [Linux](https://github.com/pluralsight/git-switch-electron/tree/master/lib/git-switch-linux-x64)
    * [Windows](https://github.com/pluralsight/git-switch-electron/tree/master/lib/git-switch-win32-x64)
* You should see a new tray item with a git icon.
* That's all there is to it! Enjoy.

## Usage
```
$: npm run start:dev
```
* Will start the electron app with the chrome devtools open by default
```
$: npm run build:packages
```
* Will run `electron-packager` scripts for all 3 platforms. This should build working desktop applications for MacOS, Linux, and Windows.
* `npm run build:packages` will run in a pre-commit hook, so you are guaranteed successful OS builds on every commit; pre-commit hook will fail otherwise.

#### Building Windows apps from non-Windows platforms:
Building an Electron app for the Windows target platform requires editing the Electron.exe file.
Currently, Electron Packager uses node-rcedit to accomplish this.
A Windows executable is bundled in that Node package and needs to be run in order for this functionality to work, so on non-Windows host platforms, [Wine 1.6](https://www.winehq.org/) or later needs to be installed.
* On MacOS, we recommend you install wine via `homebrew`
    * `$: brew cask install xquartz` _(wine dependency)_
    * `$: brew install wine`
* [Directions for Linux](hhttps://www.winehq.org/download)
* Windows users shouldn't need to do any additional work.

