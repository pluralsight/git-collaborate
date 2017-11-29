# Git Switch
Cross-platform electron app for managing git users while pair/mob programming

## Installation
* You will find deployables for each of the 3 major platforms [here](https://github.com/pluralsight/git-switch-electron/releases).
* Install git-switch for your platform and run it.
* You should see a new tray item with the git-switch icon.
* Enjoy!

## Development
To run git-swtich from source, run the following command:
```
npm run start
```

To launch the electron app with the chrome dev tools open by default, simply run:
```
npm run start:dev
```

## Creating & Publishing a Release

### Creating a Release
The following command utilizes `electron-packager` to build the application for all 3 major platforms.
```
npm run release:create
```

A `/releases` directory will be created containing the zipped deployables for Linux, MacOS, and Windows.

### Publishing a Release

There are two options for publishing a release

#### Manual Publish:
    * Once a new release has been generated locally, you can drag the zipped `./releases` packages onto the [Create Release Page](https://github.com/pluralsight/git-switch-electron/releases/new) in github.
#### Publish via CLI
* You can publish releases programatically by installing [hub](https://github.com/github/hub) _(github's cross platform cli tool)_
* Run `npm run release:publish 0.0.1 (insert semver release version)` which will trigger the `hub release` command.

### Creating Windows release from MacOS & Linux
Building an Electron app for the Windows target platform requires editing the `Electron.exe`.
Currently, `electron-packager` uses `node-rcedit` to accomplish this.
A Windows executable is bundled into the `node-rcedit` package and needs to be run in order for this functionality to work, so on non-Windows hosts [Wine 1.6](https://www.winehq.org/) or later needs to be installed.

On MacOS, we recommend you install `wine` via [homebrew](https://brew.sh/):
```
brew cask install xquartz
brew install wine
```

Directions for installing `wine` on Linux can be found [here](hhttps://www.winehq.org/download)

_No additional steps are required for packaging the Windows deployable on a Windows host machine._
