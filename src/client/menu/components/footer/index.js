import React from 'react'

import { Button } from '../'

import css from './index.css'

export function Footer({ onAddUserClick }) {
  return (
    <div className={css.footer}>
      <Button onClick={onAddUserClick}>Add user</Button>
    </div>
  )
}
