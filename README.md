# Git Switch Electron
Cross-platform electron app for managing git users while pair/mob programming


## Installation
* Please choose the package for your platform:
    * [MacOS](https://github.com/pluralsight/git-switch-electron/tree/master/releases/git-switch-macos.zip)
    * [Linux](https://github.com/pluralsight/git-switch-electron/tree/master/releases/git-switch-linux.zip)
    * [Windows](https://github.com/pluralsight/git-switch-electron/tree/master/releases/git-switch-windows.zip)
* You should see a new tray item with a git icon.
* That's all there is to it! Enjoy.

## Usage
```
$: npm run start:dev
```
* Will start the electron app with the chrome devtools open by default

## Creating a New Release
* We rely on `electron-packager` to build our application for all 3 major platforms.
```
$: npm run create:release
```
* Will generate new zipped desktop packages in the `/releases` directory for Linux, MacOS and Windows.
#### Generating a Windows Release from Non-Windows Platforms:
Building an Electron app for the Windows target platform requires editing the Electron.exe file.
Currently, Electron Packager uses node-rcedit to accomplish this.
A Windows executable is bundled in that Node package and needs to be run in order for this functionality to work, so on non-Windows host platforms, [Wine 1.6](https://www.winehq.org/) or later needs to be installed.
* On MacOS, we recommend you install wine via `homebrew`
    * `$: brew cask install xquartz` _(wine dependency)_
    * `$: brew install wine`
* [Directions for Linux](hhttps://www.winehq.org/download)
* Windows users shouldn't need to do any additional work.

