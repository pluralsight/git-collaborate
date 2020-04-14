import { remote } from 'electron'
import { func } from 'prop-types'
import React from 'react'

import { Button } from '../'
import { GitIcon } from '../../icons'

import css from './index.css'

export function About(props) {
  const { onClose } = props

  return (
    <div className={css.container}>
      <div className={css.appTitle}>
        <GitIcon className={css.appIcon} />switch
      </div>
      <div className={css.version}>
        v{remote.app.getVersion()}
      </div>
      <Button onClick={onClose} type={Button.types.confirm}>Close</Button>
    </div>
  )
}

About.propTypes = {
  onClose: func.isRequired
}
