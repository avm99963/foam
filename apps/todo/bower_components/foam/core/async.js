/**
 * @license
 * Copyright 2013 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// TODO: time-travelling debugger, ala:
//    "Debugging Standard ML Without Reverse Engineering"

/** Adapt a synchronous method into a psedo-afunc. **/
Function.prototype.abind = function(self) {
  return function(ret) { this.apply(self, arguments); ret(); }.bind(this);
};

/** NOP afunc. **/
function anop(ret) { ret && ret(undefined); }


/** afunc log. **/
function alog() {
  var args = arguments;
  return function (ret) {
    console.log.apply(console, args);
    ret && ret.apply(this, [].shift.call(arguments));
  };
}

/** console.profile an afunc. **/
function aprofile(afunc) {
  return function(ret) {
     var a = argsToArray(arguments);
     console.profile();
     var ret2 = function () {
        console.profileEnd();
        ret && ret(arguments);
     };
     aapply_(afunc, ret2, a);
  };
}


/** Create an afunc which always returns the supplied constant value. **/
function aconstant(v) { return function(ret) { ret && ret(v); }; }


/** Execute the supplied afunc N times. **/
function arepeat(n, afunc) {
  if ( ! n ) return anop;
  return function(ret) {
    var a = argsToArray(arguments);
    a.splice(1, 0, 0, n); // insert (0, n) after 'ret' argument
    var next = atramp(function() {
      if ( a[1] == n-1 ) { a[0] = ret; afunc.apply(this, a); return; };
      afunc.apply(this, a);
      a[1]++;
    });

    a[0] = next;
    next.apply(this, a);
  };
}


/** Execute the supplied afunc on each element of an array. */
function aforEach(arr, afunc) {
  // TODO: implement
}


/** Execute the supplied afunc until cond() returns false. */
function awhile(cond, afunc) {
  return function(ret) {
    var a = argsToArray(arguments);

    var g = function() {
      if ( ! cond() ) { ret.apply(undefined, arguments); return; }
      afunc.apply(this, a);
    };

    a[0] = g;
    g.apply(this, a);
  };
}


/** Execute the supplied afunc if cond. */
function aif(cond, afunc) {
  return function(ret) {
    if ( cond ) {
       afunc.apply(this, arguments);
    } else {
       ret();
    }
  };
}


/** Time an afunc. **/
var atime = (function() {
  // Add a unique suffix to timer names in case multiple instances
  // of the same timing are active at once.
  var id = 1;
  var activeOps = {};
  return function (str, afunc, opt_endCallback, opt_startCallback) {
    return function(ret) {
      var name = str;
      if ( activeOps[str] ) {
         name += '-' + id++;
         activeOps[str]++;
      } else {
         activeOps[str] = 1;
      }
      var start = performance.now();
      if ( opt_startCallback ) opt_startCallback(name);
      if ( ! opt_endCallback ) console.time(name);
      var a = arguments;
      var args = [function() {
        activeOps[str]--;
        var end = performance.now();
        if ( opt_endCallback ) opt_endCallback(name, end - start);
        else console.timeEnd(name);
        ret && ret.apply(this, [].shift.call(a));
      }];
      for ( var i = 1 ; i < a.length ; i++ ) args[i] = a[i];
      afunc.apply(this, args);
    };
  };
})();


/** Time an afunc and record its time as a metric. **/
var ametric = atime;

/** Sleep for the specified delay. **/
function asleep(ms) {
  return function(ret) {
    window.setTimeout(ret, ms);
  };
}

var ayield = asleep.bind(null, 0);


/** Create a future value. **/
function afuture() {
  var set     = false;
  var values  = undefined;
  var waiters = [];

  return {
    set: function() {
      if ( set ) {
        console.log('ERROR: redundant set on future');
        return;
      }
      values = arguments;
      set = true;
      for (var i = 0 ; i < waiters.length; i++) {
        waiters[i].apply(null, values);
      }
      waiters = undefined;
    },

    get: function(ret) {
      if ( set ) { ret.apply(null, values); return; }
      waiters.push(ret);
    }
  };
};


function aapply_(f, ret, args) {
  args.unshift(ret);
  f.apply(this, args);
}


/**
 * A Binary Semaphore which only allows the delegate function to be
 * executed by a single thread of execution at once.
 * Like Java's synchronized blocks.
 * @param opt_lock an empty map {} to be used as a lock
 *                 sharable across multiple asynchronized instances
 **/
function asynchronized(f, opt_lock) {
  var lock = opt_lock || {};
  if ( ! lock.q ) { lock.q = []; lock.active = false; }

  // Decorate 'ret' to check for blocked continuations.
  function onExit(ret) {
    return function() {
      var next = lock.q.shift();

      if ( next ) {
        setTimeout(next, 0);
      } else {
        lock.active = false;
      }

      ret();
    };
  }

  return function(ret) {
    // Semaphore is in use, so just queue f for execution when the current
    // continuation exits.
    if ( lock.active ) {
       lock.q.push(function() { f(onExit(ret)); });
       return;
    }

    lock.active = true;

    f(onExit(ret));
  };
}


/**
 * Execute an optional timeout function and abort the continuation
 * of the delegate function, if it doesn't finish in the specified
 * time.
 **/
// Could be generalized into an afirst() combinator which allows
// for the execution of multiple streams but only the first to finish
// gets to continue.
function atimeout(delay, f, opt_timeoutF) {
  return function(ret) {
    var timedOut  = false;
    var completed = false;
    setTimeout(function() {
      if ( completed ) return;
      timedOut = true;
      console.log('timeout');
      opt_timeoutF && opt_timeoutF();
    }, delay);

    f(aseq(
      function(ret) {
        if ( ! timedOut ) completed = true;
        if ( completed ) ret();
      }, ret));
  };
}


/** Memoize an async function. **/
function amemo(f) {
  var memoized = false;
  var values;
  var waiters;

  return function(ret) {
    if ( memoized ) { ret.apply(null, values); return; }

    var first = ! waiters;

    if ( first ) waiters = [];

    waiters.push(ret);

    if ( first ) {
      f(function() {
        values = arguments;
        for (var i = 0 ; i < waiters.length; i++) {
          waiters[i] && waiters[i].apply(null, values);
        }
        f = undefined;
        memoized = true;
        waiters = undefined;
      });
    }
  };
}

/**
 * Decorates an afunc to merge all calls to one active execution of the
 * delegate.
 * Similar to asynchronized, but doesn't queue up a number of calls
 * to the delegate.
 */
function amerged(f) {
  var waiters;

  return function(ret) {
    var first = ! waiters;

    if ( first ) {
      waiters = [];
      var args = argsToArray(arguments);
    }

    waiters.push(ret);

    if ( first ) {
      args[0] = function() {
        var calls = waiters;
        waiters = undefined;
        for (var i = 0 ; i < calls.length; i++) {
          calls[i] && calls[i].apply(null, arguments);
        }
      }

      f.apply(null, args);
    }
  };
}


/** Async Compose (like Function.prototype.O, but for async functions **/
Function.prototype.ao = function(f2) {
  var f1 = this;
  return function(ret) {
    var args = argsToArray(arguments);
    args[0] = f1.bind(this, ret);
    f2.apply(this, args);
  };
};

Function.prototype.aseq = function(f2) {
  return f2.ao(this);
};


/** Compose a variable number of async functions. **/
function ao(/* ... afuncs */) {
  var ret = arguments[arguments.length-1];

  for ( var i = 0 ; i < arguments.length-1 ; i++ ) {
    ret = arguments[i].ao(ret);
  }

  return ret;
}


/** Compose a variable number of async functions. **/
function aseq(/* ... afuncs */) {
  var f = arguments[arguments.length-1];

  for ( var i = arguments.length-2 ; i >= 0 ; i-- ) {
    f = arguments[i].aseq(f);
  }

  return f;
}


/**
 * Create a function which executes several afunc's in parallel and passes
 * their joined return values to an optional afunc.
 *
 * Usage: apar(f1,f2,f3)(opt_afunc, opt_args)
 * @param opt_afunc called with joined results after all afuncs finish
 * @param opt_args passed to all afuncs
 **/
function apar(/* ... afuncs */) {
  var aargs = [];
  var count = 0;
  var fs = arguments;

  return function(ret /* opt_args */) {
    if ( fs.length == 0 ) {
      ret && ret();
      return;
    }
    var opt_args = Array.prototype.splice.call(arguments, 1);
    var join = function (i) {
      aargs[i] = Array.prototype.splice.call(arguments, 1);
      if ( ++count == fs.length ) {
        var a = [];
        for ( var j = 0 ; j < fs.length ; j++ )
          for ( var k = 0 ; k < aargs[j].length ; k++ )
            a.push(aargs[j][k]);
        ret && ret.apply(null, a);
      }
    };

    for ( var i = 0 ; i < fs.length ; i++ )
      fs[i].apply(null, [join.bind(null, i)].concat(opt_args));
  };
}

/** Convert the supplied afunc into a trampolined-afunc. **/
var atramp = (function() {
   var active = false;
   var jobs = [];

   return function(afunc) {
      return function() {
         jobs.push([afunc, arguments]);
         if ( ! active ) {
if ( jobs.length > 1 ) debugger;
           active = true;
           var job;
           // Take responsibility for bouncing
           while ( (job = jobs.pop()) != null ) {
             job[0].apply(this, job[1]);
           }
           active = false;
         }
      };
   };
})();

/** Execute the supplied afunc concurrently n times. **/
function arepeatpar(n, afunc) {
  return function(ret /* opt_args */) {
    var aargs = [];
    var count = 0;

    var opt_args = Array.prototype.splice.call(arguments, 1);
    var join = function (i) {
      // aargs[i] = Array.prototype.splice.call(arguments, 1);
      if ( ++count == n ) {
        var a = [];
        /*
        for ( var j = 0 ; j < n ; j++ )
          for ( var k = 0 ; k < aargs[j].length ; k++ )
            a.push(aargs[j][k]);
         */
        ret && ret.apply(null, a);
      }
    };

    for ( var i = 0 ; i < n ; i++ ) {
      afunc.apply(null, [join.bind(null, i)].concat([i, n]).concat(opt_args));
    }
  };
}

function axhr(url, opt_op, opt_params) {
  var op = opt_op || "GET";
  var params = opt_params || [];

  return function(ret) {
    var xhr = new XMLHttpRequest();
    xhr.open(op, url);
    xhr.asend(function(json) { ret(JSON.parse(json)); }, params && params.join('&'));
  };
}

var __JSONP_CALLBACKS__ = {};
var wrapJsonpCallback = (function() {
  var nextID = 0;

  return function(ret, opt_nonce) {
    var id = 'c' + (nextID++);
    if ( opt_nonce ) id += Math.floor(Math.random() * 0xffffff).toString(16);

    var cb = __JSONP_CALLBACKS__[id] = function(data) {
      delete __JSONP_CALLBACKS__[id];

      // console.log('JSONP Callback', id, data);

      ret && ret.call(this, data);
    };
    cb.id = id;

    return cb;
  };
})();

// Note: this doesn't work for packaged-apps
var ajsonp = function(url, params) {
  return function(ret) {
    var cb = wrapJsonpCallback(ret);

    var script = document.createElement('script');
    script.src = url + '?callback=__JSONP_CALLBACKS__.' + cb.id + (params ? '&' + params.join('&') : '');
    script.onload = function() {
      document.body.removeChild(this);
    };
    document.body.appendChild(script);
  };
};

function futurefn(future) {
  return function() {
    var args = arguments;
    future.get(function(f) {
      f.apply(undefined, args);
    });
  };
}
