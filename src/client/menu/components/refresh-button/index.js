import { bool, func } from 'prop-types'
import React, { useState } from 'react'

import { RotateIcon } from '../../icons'

import css from './index.css'

export function RefreshButton({ disabled, onClick }) {
  const [wasClicked, setWasClicked] = useState(false)

  const handleClick = () => {
    setWasClicked(true)
    setTimeout(() => {
      setWasClicked(false)
    }, 1000)

    onClick()
  }

  return (
    <button className={css.container} disabled={disabled} onClick={handleClick}>
      <RotateIcon className={`${css.icon}${disabled ? ` ${css.disabled}` : ''}${wasClicked ? ` ${css.iconSpin}` : ''}`} />
    </button>
  )
}

RefreshButton.propTypes = {
  disabled: bool,
  onClick: func.isRequired
}
