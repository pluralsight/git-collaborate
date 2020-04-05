import { func } from 'prop-types'
import React, { useState } from 'react'

import { RotateIcon } from '../../icons'

import css from './index.css'

export function RefreshButton({ onClick }) {
  const [wasClicked, setWasClicked] = useState(false)

  const handleClick = () => {
    setWasClicked(true)
    setTimeout(() => {
      setWasClicked(false)
    }, 1000)

    onClick()
  }

  return (
    <div className={css.container} title="Re-initialize git hooks" onClick={handleClick}>
      <RotateIcon className={`${css.refreshIcon}${wasClicked ? ` ${css.refreshIconSpin}` : ''}`} />
    </div>
  )
}

RefreshButton.propTypes = {
  onClick: func.isRequired
}
