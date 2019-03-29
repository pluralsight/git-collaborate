const archiver = require('archiver')
const fs = require('fs-extra')

const { getPackageSrcDir, getPackageZipDir, osNames, removePackageSrc } = require('./package-helper')

function zipPackage(targetOS) {
  const zippedDir = getPackageZipDir(targetOS)
  const sourceDir = getPackageSrcDir(targetOS)

  const srcCodeExists = fs.existsSync(sourceDir)
  if (!srcCodeExists)
    throw new Error('npm run build:packages must be run before zipping!')

  const zippedPackage = fs.createWriteStream(zippedDir)
  const zip = archiver('zip', { zlib: { level: 9 } })

  zippedPackage.on('close', () => {
    console.log(`${targetOS} package:`, zip.pointer() + ' total bytes')
    console.log(`Compression has completed for git-switch-${targetOS}.zip and the output file descriptor has closed.`)
    console.log(`Removing unzipped build:`, sourceDir)
    removePackageSrc(targetOS)
    console.log(`Finished zipping git-switch-${targetOS}.zip`)
  })

  zip.on('error', (err) => { throw err })
  zip.pipe(zippedPackage)
  zip.directory(sourceDir, false)
  zip.finalize()
}

function execute() {
  console.log('Starting zip of all OS packages...')

  zipPackage(osNames.macos)
  zipPackage(osNames.linux)
  zipPackage(osNames.windows)
}

execute()
