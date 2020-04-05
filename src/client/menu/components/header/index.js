import React from 'react'

import { GitIcon, MenuIcon } from '../../icons'

import css from './index.css'

export function Header({ onMenuClick }) {
  return (
    <div className={css.header}>
      <GitIcon /><span className={css.headerTitle}>switch</span>
      <div className={css.menuButtonContainer}>
        <button className={css.menuButton} onClick={onMenuClick}><MenuIcon /></button>
      </div>
    </div>
  )
}
