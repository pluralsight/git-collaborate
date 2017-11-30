import React from 'react'
import CSSModules from 'react-css-modules'

import { bool, func, shape, string } from 'prop-types'

import Button from '../../../components/button'
import UserForm from '../user-form'

import css from './index.css'

const userType = shape({
  id: string.isRequired,
  name: string.isRequired,
  email: string.isRequired,
  rsaKeyPath: string
})

@CSSModules(css)
export default class EditButton extends React.Component {
  static propTypes = {
    onEditUser: func.isRequired,
    onClose: func.isRequired,
    user: userType.isRequired
  }
  constructor(props) {
    super(props)
    this.state = { showEditForm: false }
  }

  toggleForm = () => {
    this.setState({ showEditForm: !this.state.showEditForm })
  }

  handleFieldChange = e => {
    const { id, value } = e.target
    this.setState({ [id]: value })
  }

  handleEditUser = user => {
    this.toggleForm()
    this.props.onEditUser(user)
  }
  handleClose = () => {
    this.toggleForm()
    this.props.onClose()
  }

  render() {
    const { user } = this.props

    if (!this.state.showEditForm)
      return <Button onClick={this.toggleForm}>Edit</Button>

    return (
      <UserForm
        user={user}
        onConfirm={this.handleEditUser}
        onClose={this.handleClose}
        confirmLabel="Update user"
        isOpen={this.state.showEditForm} />
    )
  }
}
