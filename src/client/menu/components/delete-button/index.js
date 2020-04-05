import { func } from 'prop-types'
import React from 'react'

import { BinIcon } from '../../icons'

import css from './index.css'

export function DeleteButton({ onClick }) {
  return (
    <div className={css.container} onClick={onClick}>
      <BinIcon />
    </div>
  )
}

DeleteButton.propTypes = {
  onClick: func.isRequired
}
