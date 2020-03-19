import { func } from 'prop-types'
import React from 'react'

import { BinIcon } from '../../icons'

import css from './index.css'

export default function DeleteButton(props) {
  return (
    <div className={css.container} onClick={props.onClick}>
      <BinIcon />
    </div>
  )
}

DeleteButton.propTypes = {
  onClick: func.isRequired
}
