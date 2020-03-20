const fs = require('fs')
const path = require('path')

const PACKAGE_BASE_NAME = 'git-switch'
const MAC_OS_PLATFORM = 'Darwin'
const osNames = {
  macos: 'macos',
  linux: 'linux',
  windows: 'windows'
}

const packageNames = {
  [osNames.macos]: `${PACKAGE_BASE_NAME}-darwin-x64`,
  [osNames.linux]: `${PACKAGE_BASE_NAME}-linux-x64`,
  [osNames.windows]: `${PACKAGE_BASE_NAME}-win32-x64`
}

function removePackageSrc(targetOS) {
  const sourceDir = getPackageSrcDir(targetOS)
  fs.unlinkSync(sourceDir)
}

function getPackageSrcDir(targetOS) {
  return path.join(__dirname, '..', 'out', packageNames[targetOS])
}

function getPackageZipDir(targetOS) {
  return path.join(__dirname, '..', 'out', `${PACKAGE_BASE_NAME}-${targetOS}.zip`)
}

module.exports = {
  getPackageSrcDir,
  getPackageZipDir,
  MAC_OS_PLATFORM,
  osNames,
  removePackageSrc
}
