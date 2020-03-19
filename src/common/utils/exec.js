import proc from 'child_process'

export function execute(command, options = {}) {
  return proc.execSync(command, options)
}
