import CSSModules from 'react-css-modules'
import React from 'react'

import { bool, func, node, oneOf, string } from 'prop-types'

import css from './index.css'

const TYPES = {
  default: 'default',
  confirm: 'confirm'
}

@CSSModules(css)
export default class Button extends React.Component {
  static propTypes = {
    onClick: func.isRequired,
    children: node.isRequired,
    disabled: bool,
    type: oneOf(Object.keys(TYPES)),
    className: string
  }
  static defaultProps = {
    type: 'default'
  }

  render() {
    return (
      <button
        className={this.props.className}
        disabled={this.props.disabled}
        onClick={this.props.onClick}
        styleName={`button-${this.props.type}`}>{this.props.children}</button>
    )
  }
}

Button.types = TYPES
