'use strict';

const _ = require('lodash');

const LEVEL = {
    fatal: {pri: 0, tag: '[FATAL]'},
    error: {pri: 1, tag: '[ERROR]'},
    warning: {pri: 2, tag: '[ Warn]'},
    info: {pri: 3, tag: '[ info]'},
    debug: {pri: 4, tag: '[debug]'},
    trace: {pri: 5, tag: '[trace]'}
  };
const LEVEL_VALUE = (() => {
    let values = [];
    for (let i in LEVEL) {
      values[LEVEL[i].pri] = i;
    }
    return values;
  })();

const STREAM = {
    err: 'err',
    out: 'out'
  };

function levelIsLoggable(level, minimum) {
  console.log('levelIsLoggable:', {level, minimum});
  return (LEVEL[minimum].pri >= LEVEL[level].pri);
}

function normalizeLevel(level) {
  let result = null;
  if (_.isNil(level)) {
    result = 'info';
  } else if (_.isNumber(level)) {
    result = LEVEL_VALUE[level];
  } else if (_.isString(level)) {
    result = _.has(LEVEL, level) ? level : null;
  } else if (_.isObject(level) && _.has(level, 'pri')) {
    result = LEVEL_VALUE[level.pri]
  }
  if (_.isNil(result)) {
    throw new Error(`ProgressLog: unknown level: "${level}"`)
  }
  console.log('normalizeLevel', level, result)
  return result;
}

class TaskLog {

  messages = [];

  constructor(module) {
    this.module = module;
  }

  static combine(log1, ...logn) {
    let result = new TaskLog(null);
    for (let log of arguments) {
      result.messages = result.messages.concat(log.messages);
    }
    result.messages = _.sortBy(result.messages, 'date');
    return result;
  }

  err(message, level) {
    this.messages.push(_.extend(
      { stream: STREAM.err },
      this.normalize(message, level || 'error')));
  };

  out(message, level) {
    this.messages.push(_.extend(
      { stream: STREAM.out },
      this.normalize(message, level || 'info' )));
  }

  normalize(message, level) {
    let result = {
      time: Date.now(),
      module: this.module,
      level: normalizeLevel(level)
    };
    if (_.isString('string')) {
      result.message = message;
    } else {
      result.message = message.toString();
    }
    return result;
  }

  toString(filter) {
    const writeMsg = function writeMsg(entry, type) {
      let date = entry.date ? entry.date.toISOString() : '--unknown-date-and-time-';
      result += `${date} ${entry.tag} ${entry.module} * ${entry.message}\n`;
    }

    let result = '';

    // normalize the filter. After this, a filter will be a hash or
    // a function
    (() => {
      console.log('normalizing filter', filter);
      if (_.isNil(filter)) {
        // Do nothing. There's no filter
      } else if (_.isFunction(filter)) {
        // Do nothing. The function is the filter
      } else if (_.isString(filter)) {
        if (_.has(LEVEL, filter)) {
          console.log('LEVEL has filter for', filter);
          filter = {level: filter};
        } else if (_.has(STREAM, filter)) {
          console.log('STREAM has filter for', filter);
          filter = {stream: filter};
        } else {
          throw new Error(`ProgressLog.toString(): Invalid filter "${filter}"`);
        }
      } else if (_.isInteger(filter)) {
        console.log('filter is an integer');
        let level = LEVEL_VALUE[filter];
        console.log({filter, level});
        if (_.isNil(filter)) {
          throw new Error(`ProgressLog.toString(): Invalid filter "${filter}"`);
        } else {
          filter = {level: level};
        }
      } else if (_.isObject(filter)) {
        if (_.has(filter, 'level')) {
          if (_.isString(filter.level) && !_.has(LEVEL, filter.level) ||
              _.isNumber(filter.level) && !_.has(LEVEL_VALUE, filter.level)) {
            throw new Error(`ProgressLog.toString(): Invalid filter "${filter}"`);
          } else if (_.isNumber(filter.level)) {
            filter.level = LEVEL_VALUE[filter.level]
          } else if (!_.isString(filter.level)) {
            console.log({filter})
            throw new Error(`ProgressLog.toString(): Invalid filter "${filter}"`);
          }
        }
        if (_.has(filter, 'stream')) {
          if (!_.has(STREAM, filter.stream)) {
            throw new Error(`ProgressLog.toString(): Invalid filter "${filter}"`);
          }
        }
        // Do nothing. Assume the object is a valid filter object
      }
    })();

    for (let message of this.messages) {
      let printable = true;
      if (filter) {
        if (_.isFunction(filter)) {
          printable = filter(message);
        } else {
          printable = true;
          if (_.has(filter, 'level')) {
            console.log({message});
            if (!levelIsLoggable(message.level, filter.level)) {
              printable = false;
            }
          }
          if (_.has(filter, 'stream')) {
            if (message.stream === filter.stream) {
              printable = false;
            }
          }
        }
      }

      // printability determined.
      printable && writeMsg(message);
    }
    return result;
  }
}

TaskLog.LEVEL = LEVEL;
TaskLog.STREAM = STREAM;

module.exports = TaskLog;



