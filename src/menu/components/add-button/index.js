import React from 'react'
import CSSModules from 'react-css-modules'

import { func } from 'react-proptypes'

import css from './index.css'
import UserForm from '../user-form'

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
    return (
      <div styleName="container">
        <span styleName={this.state.showAddForm ? 'add-button-hidden' : 'add-button'} onClick={this.toggleForm}>Add</span>
        <UserForm
          onConfirm={this.handleAddUser}
          onClose={this.toggleForm}
          confirmLabel="Add user"
          isOpen={this.state.showAddForm} />
      </div>
    )
  }
}
