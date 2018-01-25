const fs = require('fs-extra')
const path = require('path')

const packageRelease = {
  macos: 'git-switch-darwin-x64',
  linux: 'git-switch-linux-x64',
  windows: 'git-switch-win32-x64'
}

function removePackageSrc(os) {
  const sourceDir = getPackageSrcDir(os)
  fs.removeSync(sourceDir)
}

function getPackageSrcDir(os) {
  return path.join(__dirname, '..', '..', 'out', packageRelease[os])
}

function getPackageZipDir(os) {
  return path.join(__dirname, '..', '..', 'out', `git-switch-${os}.zip`)
}

module.exports = {
  getPackageSrcDir,
  getPackageZipDir,
  removePackageSrc,
  packageRelease
}
