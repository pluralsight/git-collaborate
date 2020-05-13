import axios from 'axios'

import { logger } from '.'

export const getLatestVersion = async () => {
  const latestReleaseUrl = 'https://api.github.com/repos/pluralsight/git-switch-electron/releases/latest'

  let version = null

  try {
    const response = await axios.get(latestReleaseUrl)
    version = (response && response.data && response.data.name) || null
  } catch (err) {
    const { message } = (err.response && err.response.data) || err
    logger.error('Could not fetch latest release', message)
  }

  return version
}
