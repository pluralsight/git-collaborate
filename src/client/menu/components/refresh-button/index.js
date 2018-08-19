import React from 'react'
import CssModules from 'react-css-modules'
import { func } from 'prop-types'

import { RotateIcon } from '../../icons'

import css from './index.css'

@CssModules(css, { allowMultiple: true })
export default class RefreshButton extends React.Component {
  static propTypes = {
    onClick: func.isRequired
  }

  constructor(props) {
    super(props)
    this.state = {
      wasClicked: false
    }
  }

  handleClick = () => {
    this.setState(() => ({
      wasClicked: true
    }))
    setTimeout(() => {
      this.setState(() => ({
        wasClicked: false
      }))
    }, 1000)

    this.props.onClick()
  }

  render() {
    return (
      <div styleName="container" title="Re-initialize git hooks" onClick={this.handleClick}>
        <RotateIcon styleName={`refresh-icon${this.state.wasClicked ? ' refresh-icon-spin' : ''}`} />
      </div>
    )
  }
}
