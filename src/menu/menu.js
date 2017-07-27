import CSSModules from 'react-css-modules'
import React from 'react'

import css from './menu.css'

@CSSModules(css)
export default class Menu extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      currentCommitter: 'Bryce',
      users: [
        { name: 'Bryce', selected: true },
        { name: 'Bressain', selected: false },
        { name: 'James', selected: false },
        { name: 'Parker', selected: false },
        { name: 'Kaiden', selected: true },
      ]
    }
  }

  handleUserClick = user => () => {
    this.setState({
      users: this.state.users.map(u => u.name !== user.name
        ? u :
        { ...u, selected: !user.selected })
    })
  }

  renderUser = user => {
    return (
      <li styleName="user" onClick={this.handleUserClick(user)} key={user.name}>
        <input type="checkbox" checked={user.selected} readOnly/>
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
