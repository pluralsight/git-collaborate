import CSSModules from 'react-css-modules'
import React from 'react'

import css from './menu.css'
import AddButton from './components/add-button'
import * as userService from './services/user'

@CSSModules(css)
export default class Menu extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      currentCommitter: '',
      users: [],
      showAddForm: false
    }
  }

  componentDidMount() {
    this.setState({users: userService.get()})
  }

  handleUserClick = user => async () => {
    const updatedUser = { ...user, active: !user.active }
    userService.update(updatedUser)

    this.setState({
      users: this.state.users.map(u => u.email === user.email
        ? updatedUser
        : u
      )
    })
  }

  handleAddUser = newUser => {
    userService.add(newUser)
    const updatedUsers = userService.get()
    this.setState({ users: updatedUsers })
  }

  renderUser = user => {
    return (
      <li styleName="user" onClick={this.handleUserClick(user)} key={user.email}>
        <input type="checkbox" checked={user.active} readOnly />
        <span styleName="name">{user.name}</span>
      </li>
    )
  }

  render() {
    return (
      <div styleName="container">
        <div styleName="header">
          Current committer: {this.state.currentCommitter}
        </div>

        <div styleName="content">
          <ul styleName="users-list">
            {this.state.users.map(this.renderUser)}
          </ul>
        </div>
        <AddButton onAddUser={this.handleAddUser} />

        <div styleName="footer" />
      </div>
    )
  }
}
