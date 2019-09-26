/* eslint-disable no-console */

const consoleLog = (func, args) => {
  if (!global.logToConsoleDisabled) {
    func.apply(console, args)
  }
}

export const info = (...args) => consoleLog(console.log, args)
export const error = (...args) => consoleLog(console.error, args)

/* eslint-enable no-console */
