import CSSModules from 'react-css-modules'
import React from 'react'
import { func, node } from 'react-proptypes'

import css from './index.css'

@CSSModules(css)
export default class Button extends React.Component {
  static propTypes = {
    onClick: func.isRequired,
    children: node.isRequired
  }

  render() {
    return (
      <button onClick={this.props.onClick} styleName="button">{this.props.children}</button>
    )
  }
}
