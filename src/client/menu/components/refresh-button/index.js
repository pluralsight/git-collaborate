import { func } from 'prop-types'
import React from 'react'

import { RotateIcon } from '../../icons'

import css from './index.css'

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
      <div className={css.container} title="Re-initialize git hooks" onClick={this.handleClick}>
        <RotateIcon className={`${css.refreshIcon}${this.state.wasClicked ? ` ${css.refreshIconSpin}` : ''}`} />
      </div>
    )
  }
}
