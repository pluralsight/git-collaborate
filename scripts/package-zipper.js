const archiver = require('archiver')
const fs = require('fs-extra')
const path = require('path')

const OS_PACKAGE_BUILDS = {
  'macos': 'git-switch-darwin-x64',
  'linux': 'git-switch-linux-x64',
  'win32': 'git-switch-win32-x64'
}

const getOutputDir = (os) => path.join(__dirname, '../lib/', `git-switch-${os}.zip`)
const getSourceDir = (os) => path.join(__dirname, '../lib', OS_PACKAGE_BUILDS[os])

function removePackageSource(os) {
  const sourcePath = getSourceDir(os)
  if (!fs.existsSync(sourcePath))
    throw new Error(`Attempted to remove src code directory for ${os} before src code was zipped.`)
  console.log(`Removing unzipped build:`, sourcePath)
  fs.removeSync(sourcePath)
  console.log(`Finished zipping git-switch-${os}.zip`)
}

function zipPackage(os) {
  const outputDir = getOutputDir(os)
  const sourceDir = getSourceDir(os)

  if (!fs.existsSync(sourceDir))
    throw new Error('npm run build:packages must be run before zipping!')

  const output = fs.createWriteStream(outputDir)
  const zip = archiver('zip')

  output.on('close', () => {
    console.log(`${os} package:`, zip.pointer() + ' total bytes')
    console.log(`Compression has finalized for git-switch-${os}.zip and the output file descriptor has closed.`)
    removePackageSource(os)
  })

  zip.on('error', (err) => { throw err })
  zip.pipe(output)
  zip.directory(sourceDir, false)
  zip.finalize()
}

function execute() {
  zipPackage('macos')
  zipPackage('linux')
  zipPackage('win32')
}

console.log('Starting zip of all OS distributable packages...')
execute()
