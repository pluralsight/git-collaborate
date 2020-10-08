import { func } from 'prop-types'
import React from 'react'

import { BinIcon } from '../../icons'

import css from './index.css'

export function DeleteButton({ onClick }) {
  return (
    <button className={css.container} onClick={onClick}>
      <BinIcon className={css.icon} />
    </button>
  )
}

DeleteButton.propTypes = {
  onClick: func.isRequired
}
