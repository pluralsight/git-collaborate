import CSSModules from 'react-css-modules'
import React from 'react'

import AddButton from './components/add-button'
import Button from './components/button'
import EditButton from './components/edit-button/index'
import css from './index.css'
import * as gitService from '../services/git'
import * as userService from '../services/user'

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
    this.setState({ users: userService.get() })
  }

  handleGitUserChanges = async () => {
    const { author, committer } = gitService.getAuthorAndCommitter(userService.get())

    await gitService.setAuthor(author.name, author.email)
    await gitService.setCommitter(committer.name, committer.email)
  }
  handleRotateUsers = async () => {
    const updatedUsers = userService.rotate()
    this.setState({ users: updatedUsers })
    await this.handleGitUserChanges()
  }
  handleUserClick = user => async () => {
    const users = userService.toggleActive(user.email)
    this.setState({ users })
    await this.handleGitUserChanges()
  }
  handleAddUser = async newUser => {
    const users = userService.add(newUser)
    this.setState({ users })
    await this.handleGitUserChanges()
  }
  handleEditUser = async user => {
    const users = userService.update(user)
    this.setState({ users })
    await this.handleGitUserChanges()
  }
  handleClearActiveUsers = async () => {
    const users = userService.clearActive()
    this.setState({ users })
    await this.handleGitUserChanges()
  }

  renderUser = (user, index) => {
    const role = user.active
      ? index === 0 ? 'Author' : 'Committer'
      : ''
    return (
      <li styleName="user" key={user.email}>
        <div>
          <input type="checkbox" styleName="active" checked={user.active} onChange={this.handleUserClick(user)} />
        </div>
        <div styleName="user-info">
          <div styleName="name">{user.name}</div>
          {role && <div styleName="role">{role}</div>}
        </div>
        <div>
          <EditButton onEditUser={this.handleEditUser} user={user} />
        </div>
      </li>
    )
  }
  render() {
    const activeUsers = this.state.users.filter(u => u.active)
    const inactiveUsers = this.state.users.filter(u => !u.active)
    return (
      <div styleName="container">
        <div styleName="header">
          <svg xmlns="http://www.w3.org/2000/svg" fill="#FFFFFF" height="36" viewBox="0 0 1792 1792" width="36"><path d="M595 1514q0-100-165-100-158 0-158 104 0 101 172 101 151 0 151-105zm-59-755q0-61-30-102t-89-41q-124 0-124 145 0 135 124 135 119 0 119-137zm269-324v202q-36 12-79 22 16 43 16 84 0 127-73 216.5t-197 112.5q-40 8-59.5 27t-19.5 58q0 31 22.5 51.5t58 32 78.5 22 86 25.5 78.5 37.5 58 64 22.5 98.5q0 304-363 304-69 0-130-12.5t-116-41-87.5-82-32.5-127.5q0-165 182-225v-4q-67-41-67-126 0-109 63-137v-4q-72-24-119.5-108.5t-47.5-165.5q0-139 95-231.5t235-92.5q96 0 178 47 98 0 218-47zm318 881h-222q4-45 4-134v-609q0-94-4-128h222q-4 33-4 124v613q0 89 4 134zm601-222v196q-71 39-174 39-62 0-107-20t-70-50-39.5-78-18.5-92-4-103v-351h2v-4q-7 0-19-1t-18-1q-21 0-59 6v-190h96v-76q0-54-6-89h227q-6 41-6 165h171v190q-15 0-43.5-2t-42.5-2h-85v365q0 131 87 131 61 0 109-33zm-576-947q0 58-39 101.5t-96 43.5q-58 0-98-43.5t-40-101.5q0-59 39.5-103t98.5-44q58 0 96.5 44.5t38.5 102.5z" /></svg>
          <span styleName="header-title">switch</span>
        </div>
        <div styleName="content">
          <div styleName="users-list-header">
            <span>Active</span>
            <div styleName="buttons">
              <Button onClick={this.handleRotateUsers}>
                <svg styleName="button-icon" fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z" /><path d="M0 0h24v24H0z" fill="none" /></svg>
              </Button>
              <Button onClick={this.handleClearActiveUsers}>
                <svg styleName="button-icon" fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /><path d="M0 0h24v24H0z" fill="none" /></svg>
              </Button>
            </div>
          </div>
          <ul styleName="users-list">
            {activeUsers.map(this.renderUser)}
          </ul>
          <div styleName="users-list-header">Inactive</div>
          <ul styleName="users-list">
            {inactiveUsers.map(this.renderUser)}
          </ul>
        </div>
        <AddButton onAddUser={this.handleAddUser} />

        <div styleName="footer" />
      </div>
    )
  }
}
