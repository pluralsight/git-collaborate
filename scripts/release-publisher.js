const execSync = require('child_process').execSync

const RELEASE_URL = 'https://github.com/pluralsight/git-switch-electron/releases'
const HUB_DOCS_URL = 'https://github.com/github/hub'
const RELEASE_DIR = './out'

function executeCmd(command, errMessage) {
  try {
    execSync(command)
  } catch (err) {
    console.log(errMessage)
    console.log('Error:', err)
    process.exit(1)
  }
}

function getVersion() {
  const version = process.argv[2]
  if (!version) {
    console.log('Must provide a valid version before publishing.')
    process.exit(1)
  }

  return version
}

function verifyHubInstallation() {
  console.log('Verifying hub install...')

  const failureMessage = 'Sorry. We were unable to verify that hub is installed.'
    .concat(`\nPlease make sure you have hub installed before running this script. For more information visit:`)
    .concat(`\n${HUB_DOCS_URL}`)

  executeCmd('hub version', failureMessage)
}

function createHubRelease() {
  const version = getVersion()
  console.log(`Generating a new release at ${RELEASE_URL}...`)
  const publishCmd = `hub release create -a ${RELEASE_DIR} -m "${version}" ${version}`

  const failureMessage = `Unable to publish release to ${RELEASE_URL}`
    .concat('\nThis is likely because you are not on master branch.')
    .concat('\nPlease ensure that your changes get merged into master before releasing.')

  executeCmd(publishCmd, failureMessage)
}

function publishPackages() {
  verifyHubInstallation()
  createHubRelease()
}

function execute() {
  publishPackages()
}

execute()
