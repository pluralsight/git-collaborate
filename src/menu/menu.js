import CSSModules from 'react-css-modules'
import React from 'react'

import css from './menu.css'
import AddButton from './components/add-button'
import EditButton from './components/edit-button/index'
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

  handleEditUser = user => {
    userService.update(user)
    const updatedUsers = userService.get()
    this.setState({ users: updatedUsers })
  }

  renderUser = user => {
    return (
      <li styleName="user" key={user.email}>
        <div>
          <input type="checkbox" styleName="active" checked={user.active} onChange={this.handleUserClick(user)} />
          <span styleName="name">{user.name}</span>
        </div>
        <EditButton onEditUser={this.handleEditUser} user={user} />
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
