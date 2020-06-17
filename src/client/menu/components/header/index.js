import React from 'react'

import { GitIcon, MenuIcon } from '../../icons'

import css from './index.css'

export function Header({ onMenuClick }) {
  return (
    <div className={css.header}>
      <div className={css.title}><GitIcon className={css.icon} />collab</div>
      <div className={css.menuButtonContainer}>
        <button className={css.menuButton} onClick={onMenuClick}><MenuIcon /></button>
      </div>
    </div>
  )
}
