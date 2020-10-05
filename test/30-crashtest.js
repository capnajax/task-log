'use strict';

/**
 *  Runthrough test
 *  Exercise the functionality of `TaskLog` to ensure there are no crashes
 */

const TaskLog = require('../TaskLog');
//const expect = require('chai').expect;

describe('Crash test', function() {
  let taskLog1, taskLog2;

  it ('runs through all the basic functions without crashing', function(done) {
    taskLog1 = new TaskLog('crashtest1');
    taskLog2 = new TaskLog('crashtest2');

    let i = 0;
    for (let message = 0; message < 3; message++) {
      for (let stream of ['out', 'err']) {
        for (let log of [taskLog1, taskLog2]) {
          let idxString = `00${++i}`;
          console.log(log);
          log.out('hi');
          log[stream](
              `${idxString.substr(idxString.length-2)} ` +
              `message ${message} on stream ${stream}`);
        }
      }
    }

    let combinedLog = TaskLog.combine(taskLog1, taskLog2);
    console.log({combinedLog})
    for (let log of [taskLog1, taskLog2, combinedLog]) {
      console.log('Logging', log.module);
      log.toString();
      log.toString('err');
      log.toString('trace');
      log.toString({stream: 'err'});
      log.toString({level: 'trace'});
      log.toString({level: 4});
      log.toString(4);
      log.toString(() => {return true;});
    }
  
    done();
  });

});
