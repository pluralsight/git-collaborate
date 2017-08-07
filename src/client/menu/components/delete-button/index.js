import React from 'react'
import CssModules from 'react-css-modules'

import { func, string } from 'prop-types'

import { BinIcon } from '../../icons'
import css from './index.css'

@CssModules(css)
export default class RemoveButton extends React.Component {
  static propTypes = {
    onRemove: func.isRequired,
    userToRemove: string.isRequired
  }

  handleOnRemove = () => this.props.onRemove(this.props.userToRemove)

  render() {
    return <div styleName="container"><BinIcon onClick={this.handleOnRemove} /></div>
  }
}
