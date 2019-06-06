import { remote } from 'electron'
import { bool, func, shape, string } from 'prop-types'
import React from 'react'

import Button from '../../../components/button'

import css from './index.css'

const userType = shape({
  name: string.isRequired,
  email: string.isRequired,
  rsaKeyPath: string,
  active: bool
})

export default class UserForm extends React.Component {
  static propTypes = {
    user: userType,
    onConfirm: func.isRequired,
    onChange: func.isRequired,
    onClose: func.isRequired
  }

  constructor(props) {
    super(props)
    this.state = {
      isSelectingRsaKey: false
    }
  }

  componentDidUpdate(lastProps) {
    if (this.props.user && lastProps.user !== this.props.user && !this.props.user.name) {
      this.nameInput.focus()
    }
  }

  setNameInput = el => {
    this.nameInput = el
  }

  isValid = () => {
    const { user } = this.props
    return user && user.name && user.email && !this.state.isSelectingRsaKey
  }

  handleFieldChange = e => {
    const { id, value } = e.target
    this.props.onChange({
      ...this.props.user,
      [id]: value
    })
  }
  handleAddRsaKey = () => {
    this.setState({ isSelectingRsaKey: true })
    remote.dialog.showOpenDialog({
      properties: ['openFile', 'showHiddenFiles', 'treatPackageAsDirectory']
    }, this.handleRsaKeySelected)
  }
  handleRsaKeySelected = paths => {
    this.setState({ isSelectingRsaKey: false })
    this.props.onChange({
      ...this.props.user,
      rsaKeyPath: (paths && paths[0]) || this.props.user.rsaKeyPath
    })
  }

  render() {
    const { onClose, onConfirm } = this.props
    const user = {
      name: '',
      email: '',
      rsaKeyPath: '',
      active: false,
      ...this.props.user
    }
    const confirmLabel = user.id ? 'Update user' : 'Add user'

    return (
      <div className={css.form}>
        <div className={css.fieldContainer}>
          <input
            id="name"
            className={css.field}
            value={user.name}
            placeholder="Name"
            onChange={this.handleFieldChange}
            ref={this.setNameInput} />
          <input
            id="email"
            className={css.field}
            value={user.email}
            placeholder="Email"
            onChange={this.handleFieldChange} />
          <div className={css.rsaFieldContainer}>
            <input
              id="rsaKeyPath"
              className={css.rsaField}
              value={user.rsaKeyPath}
              placeholder="Path to RSA key"
              onChange={this.handleFieldChange} />
            <Button
              className={css.browseButton}
              onClick={this.handleAddRsaKey}
              disabled={this.state.isSelectingRsaKey}>
              Browse
            </Button>
          </div>
        </div>
        <div className={css.buttonSection}>
          <Button type={Button.types.confirm} onClick={onConfirm} disabled={!this.isValid()}>{confirmLabel}</Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    )
  }
}
