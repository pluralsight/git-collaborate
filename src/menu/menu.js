import CSSModules from 'react-css-modules'
import React from 'react'

import * as gitService from './services/git'
import css from './menu.css'
import * as userService from './services/user'

@CSSModules(css)
export default class Menu extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      currentCommitter: '',
      users: []
    }
  }

  componentDidMount() {
    this.setState({
      users: userService.getUsers()
    })
  }

  handleUserClick = user => async () => {
    const updatedUser = { ...user, active: !user.active }
    userService.updateUser(updatedUser)

    this.setState({
      users: this.state.users.map(u => u.email === user.email
        ? updatedUser
        : u
      )
    })
  }

  renderUser = user => {
    return (
      <li styleName="user" onClick={this.handleUserClick(user)} key={user.email}>
        <input type="checkbox" checked={user.active} readOnly/>
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

        <div styleName="footer" />
      </div>
    )
  }
}
