import { remote, shell } from 'electron'
import { func } from 'prop-types'
import React, { useEffect, useState } from 'react'

import { Button } from '../'
import * as api from '../../../api'
import { GitIcon } from '../../icons'

import css from './index.css'

export function About(props) {
  const { onClose } = props
  const [isUpgradeAvailable, setIsUpgradeAvailable] = useState(false)

  const appVersion = remote.app.getVersion()

  useEffect(() => {
    const latestVersion = api.getLatestVersion()
    if (latestVersion && latestVersion !== appVersion) {
      setIsUpgradeAvailable(true)
    }
  }, [])

  const handleGetLatestClicked = () => {
    shell.openExternal('https://github.com/pluralsight/git-collaborate/releases')
  }

  return (
    <div className={css.container}>
      <div className={css.appTitle}>
        <GitIcon className={css.appIcon} />collab
      </div>
      <div className={css.version}>
        v{appVersion}
      </div>
      {isUpgradeAvailable && (
        <Button className={css.updateButton} onClick={handleGetLatestClicked}>
          Get latest version
        </Button>
      )}
      <Button onClick={onClose} type={Button.types.confirm}>Close</Button>
    </div>
  )
}

About.propTypes = {
  onClose: func.isRequired
}
