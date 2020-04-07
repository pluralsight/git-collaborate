const USER_CHANNELS = {
  GET_ALL_USERS: 'get-all-users',
  USERS_UPDATED: 'users-updated',
  ROTATE_ACTIVE_USERS: 'rotate-active-users',
  TOGGLE_USER_ACTIVE: 'toggle-user-active',
  ADD_USER: 'add-user',
  UPDATE_USER: 'update-user',
  REMOVE_USER: 'remove-user'
}

const APPLICATION_CHANNELS = {
  QUIT_APPLICATION: 'quit-application'
}

const GIT_CHANNELS = {
  GET_ALL_REPOS: 'get-all-repos',
  REPOS_UPDATED: 'repos-updated',
  ADD_REPO: 'add-repo',
  REMOVE_REPO: 'remove-repo'
}

export default {
  ...APPLICATION_CHANNELS,
  ...USER_CHANNELS,
  ...GIT_CHANNELS
}
