# Git Switch
Cross-platform electron app for managing git users while pair/mob programming

## Installation
* You will find deployables for each of the 3 major platforms [here](https://github.com/pluralsight/git-switch-electron/releases).
* Install git-switch for your platform and run it.
* You should see a new tray item with the git-switch icon.
* Enjoy!

## Development
To run git-switch from source, run the following command:
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

An `/out` directory will be created containing the zipped deployables for Linux, MacOS, and Windows.

### **Mac Users**
* Only mac users may publish a release of the MacOS package.
* The MacOS package must be signed with the appropriate `Pluralsight Developer Certificate` stored on the user's MacOS keychain.
* To obtain said certificate please speak with one of the package maintainers.
* Building an Electron app for the Windows target platform requires [Wine 1.6](https://www.winehq.org/) or later to be installed.
* We recommend you install `wine` via [homebrew](https://brew.sh/):
```
brew cask install xquartz
brew install wine
```

### **Linux Users**
* Your release will _**not**_ include a zipped package for macOS.
* The MacOS package must be signed with the appropriate `Pluralsight Developer Certificate` stored on the users MacOS keychain.
* Building an Electron app for the Windows target platform requires [Wine 1.6](https://www.winehq.org/) or later to be installed.
* Directions for installing `wine` on Linux can be found [here](https://www.winehq.org/download)

### **Windows Users**
* Your release will _**not**_ include a zipped package for MacOS.
* The MacOS package must be signed with the appropriate `Pluralsight Developer Certificate` stored on the users MacOS keychain.

### Publishing a Release

There are two options for publishing a release:

#### Manual Publish:
Once a new release has been generated locally, you can drag the zipped `./out` packages onto the [Create Release Page](https://github.com/pluralsight/git-switch-electron/releases/new) in github.

#### Publish via CLI
You can publish releases programatically by installing [hub](https://github.com/github/hub) _(github's cross platform cli tool)_ by running:
```
npm run release:publish 0.0.1 (insert semver release version)
```
This will trigger the `hub release` command.
