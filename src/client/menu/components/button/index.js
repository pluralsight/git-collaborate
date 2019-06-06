import React from 'react'

import { bool, func, node, oneOf } from 'prop-types'

import css from './index.css'

const TYPES = {
  default: 'default',
  confirm: 'confirm'
}

export default class Button extends React.Component {
  static propTypes = {
    onClick: func.isRequired,
    children: node.isRequired,
    disabled: bool,
    type: oneOf(Object.keys(TYPES))
  }
  static defaultProps = {
    type: 'default'
  }

  render() {
    return (
      <button
        className={this.props.type === TYPES.confirm ? css.confirm : css.default}
        disabled={this.props.disabled}
        onClick={this.props.onClick}>
        {this.props.children}
      </button>
    )
  }
}

Button.types = TYPES
