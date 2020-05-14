import React from 'react'

import { bool, func, node, oneOf, string } from 'prop-types'

import css from './index.css'

const TYPES = {
  confirm: 'confirm',
  default: 'default'
}

export function Button(props) {
  const { children, className, disabled, onClick, type } = props

  return (
    <button
      className={`${className || ''}${type === TYPES.confirm ? ` ${css.confirm}` : ` ${css.default}`}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

Button.propTypes = {
  children: node.isRequired,
  className: string,
  disabled: bool,
  onClick: func.isRequired,
  type: oneOf(Object.keys(TYPES))
}

Button.defaultProps = {
  type: 'default'
}

Button.types = TYPES
