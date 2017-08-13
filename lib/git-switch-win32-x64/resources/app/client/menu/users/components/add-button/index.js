import React from 'react'
import CSSModules from 'react-css-modules'

import { func } from 'prop-types'

import Button from '../../../components/button'
import UserForm from '../user-form'

import css from './index.css'

@CSSModules(css)
export default class AddButton extends React.Component {
  static propTypes = {
    onAddUser: func.isRequired
  }
  constructor(props) {
    super(props)
    this.state = { showAddForm: false }
  }

  toggleForm = () => {
    this.setState({ showAddForm: !this.state.showAddForm })
  }

  handleFieldChange = e => {
    const { id, value } = e.target
    this.setState({ [id]: value })
  }

  handleAddUser = user => {
    this.toggleForm()
    this.props.onAddUser(user)
  }

  render() {
    if (!this.state.showAddForm)
      return (
        <div styleName="container">
          <Button onClick={this.toggleForm}>Add user</Button>
        </div>
      )

    return (
      <UserForm
        onConfirm={this.handleAddUser}
        onClose={this.toggleForm}
        confirmLabel="Add user"
        isOpen={this.state.showAddForm} />
    )
  }
}
