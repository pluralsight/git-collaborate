const consoleLog = (func, args) => {
  if (!global.logToConsoleDisabled) {
    func.apply(console, args)
  }
}

export const info = (...args) => consoleLog(console.info, args)
export const error = (...args) => consoleLog(console.error, args)
