import React from 'react'

import { bool, func, node, oneOf } from 'prop-types'

import css from './index.css'

const TYPES = {
  confirm: 'confirm',
  default: 'default'
}

export function Button(props) {
  return (
    <button
      className={props.type === TYPES.confirm ? css.confirm : css.default}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  )
}

Button.propTypes = {
  children: node.isRequired,
  disabled: bool,
  onClick: func.isRequired,
  type: oneOf(Object.keys(TYPES))
}

Button.defaultProps = {
  type: 'default'
}

Button.types = TYPES
