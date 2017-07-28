import React from 'react'
import CSSModules from 'react-css-modules'

import { func } from 'react-proptypes'

import css from './index.css'

@CSSModules(css)
export default class AddButton extends React.Component {
  static propTypes = {
    onAddUser: func.isRequired
  }
  constructor(props) {
    super(props)
    this.state = {
      showForm: false,
      name: null,
      email: null,
      rsaKeyPath: null
    }
  }

  toggleForm = () => {
    this.setState({ showForm: !this.state.showForm })
  }

  handleFieldChange = e => {
    const { id, value } = e.target
    this.setState({ [id]: value })
  }

  handleAddUser = () => {
    const { name, email, rsaKeyPath } = this.state
    this.toggleForm()
    this.props.onAddUser({ name, email, rsaKeyPath })
  }

  renderForm() {
    return (
      <div styleName={this.state.showForm ? 'add-form' : 'add-form-hidden'}>
        <div styleName="add-user">
          <input id="name" styleName="add-user-field" placeholder="Name" onChange={this.handleFieldChange} />
          <input id="email" styleName="add-user-field" placeholder="Email" onChange={this.handleFieldChange} />
          <input id="rsaKeyPath" styleName="add-user-field" placeholder="RSA Key Path" onChange={this.handleFieldChange} />
        </div>
        <button styleName="add-user-button" onClick={this.handleAddUser}>Add user</button>
      </div>
    )
  }

  render() {
    return (
      <div styleName="container">
        <span styleName={this.state.showForm ? 'add-button-hidden' : 'add-button'} onClick={this.toggleForm}>Add</span>
        {this.renderForm()}
      </div>
    )
  }
}
