import React from 'react'
import CSSModules from 'react-css-modules'

import { func, shape, string } from 'react-proptypes'

import css from './index.css'
import UserForm from '../user-form'

const userType = shape({
  name: string.isRequired,
  email: string.isRequired,
  rsaKeyPath: string.isRequired
})

@CSSModules(css)
export default class EditButton extends React.Component {
  static propTypes = {
    onEditUser: func.isRequired,
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

  render() {
    const { user } = this.props
    return (
      <div styleName="container">
        <span styleName={this.state.showEditForm ? 'edit-button-hidden' : 'edit-button'} onClick={this.toggleForm}>Edit</span>
        <UserForm
          user={user}
          onConfirm={this.handleEditUser}
          onClose={this.toggleForm}
          confirmLabel="Update user"
          isOpen={this.state.showEditForm} />
      </div>
    )
  }
}
