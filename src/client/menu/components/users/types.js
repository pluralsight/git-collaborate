import { bool, shape, string } from 'prop-types'

export const userType = shape({
  id: string,
  active: bool,
  email: string.isRequired,
  name: string.isRequired,
  rsaKeyPath: string
})
