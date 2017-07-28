import React from 'react'
import CSSModules from 'react-css-modules'

import { bool, func, shape, string } from 'react-proptypes'

import css from './index.css'

const userType = shape({
  name: string.isRequired,
  email: string.isRequired,
  rsaKeyPath: string.isRequired,
  active: bool
})

@CSSModules(css)
export default class UserForm extends React.Component {
  static propTypes = {
    user: userType,
    onConfirm: func.isRequired,
    onClose: func.isRequired,
    confirmLabel: string.isRequired,
    isOpen: bool.isRequired
  }
  constructor(props) {
    super(props)
    this.state = {
      name: null,
      email: null,
      rsaKeyPath: null
    }
  }

  handleFieldChange = e => {
    const { id, value } = e.target
    this.setState({ [id]: value })
  }

  onSubmit = () => {
    const { user } = this.props

    this.props.onConfirm({
      name: this.state.name || user.name,
      email: this.state.email || user.email,
      rsaKeyPath: this.state.rsaKeyPath || user.rsaKeyPath,
      active: user ? user.active : false
    })
  }

  render() {
    const { confirmLabel, onClose, isOpen, user } = this.props
    const defaultName = user ? user.name : ''
    const defaultEmail = user ? user.email : ''
    const defaultRsaKeypath = user ? user.rsaKeyPath : ''

    return (
      <div styleName={isOpen ? 'form' : 'form-hidden'}>
        <div styleName="field-container">
          <input
            id="name"
            styleName="field"
            defaultValue={defaultName}
            placeholder="Name"
            onChange={this.handleFieldChange} />
          <input
            id="email"
            styleName="field"
            defaultValue={defaultEmail}
            placeholder="Email"
            onChange={this.handleFieldChange} />
          <input
            id="rsaKeyPath"
            styleName="field"
            defaultValue={defaultRsaKeypath}
            placeholder="RSA Key Path"
            onChange={this.handleFieldChange} />
        </div>
        <div styleName="button-section">
          <button styleName="confirm-button" onClick={this.onSubmit}>{confirmLabel}</button>
          <button styleName="close-button" onClick={onClose}>Close</button>
        </div>
      </div>
    )
  }
}
