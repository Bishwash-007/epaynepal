const noop = () => undefined;

export const createLogger = ({ level = 'info' } = {}) => {
  const levels = ['error', 'warn', 'info', 'debug'];
  const threshold = levels.indexOf(level);

  const shouldLog = (targetLevel) => levels.indexOf(targetLevel) <= threshold;

  return {
    error: shouldLog('error') ? console.error.bind(console, '[NepalPay]') : noop,
    warn: shouldLog('warn') ? console.warn.bind(console, '[NepalPay]') : noop,
    info: shouldLog('info') ? console.log.bind(console, '[NepalPay]') : noop,
    debug: shouldLog('debug') ? console.debug.bind(console, '[NepalPay]') : noop
  };
};
