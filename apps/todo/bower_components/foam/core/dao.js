/**
 * @license
 * Copyright 2012 Google Inc. All Rights Reserved.
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

// ???: Is there any point in making this an Interface, or just a Concrete Model
FOAModel({
  model_: 'Interface',

  package: 'dao',
  name: 'FlowControl',
  description: 'DAO FLow Control.  Used to control select() behavior.',

  methods: [
    {
      name: 'stop'
    },
    {
      name: 'error',
      args: [
        { name: 'e', type: 'Object' }
      ]
    },
    {
      name: 'isStopped',
      description: 'Returns true iff this selection has been stopped.',
      returnType: 'Boolean'
    },
    {
      name: 'getError',
      description: 'Returns error passed to error(), or undefined if error() never called',
      returnType: 'Object'
    }
    /*
    // For future use.
    {
    name: 'advance',
    description: 'Advance selection to the specified key.',
    args: [
    { name: 'key', type: 'Object' },
    { name: 'inclusive', type: 'Object', optional: true, defaultValue: true },

    ]
    }*/
  ]
});


FOAModel({
  model_: 'Interface',

  package: 'dao',
  name: 'Sink',
  description: 'Data Sink',

  methods: [
    {
      name: 'put',
      description: 'Put (add) an object to the Sink.',
      args: [
        { name: 'obj', type: 'Object' },
        { name: 'sink', type: 'Sink' }
      ]
    },
    {
      name: 'remove',
      description: 'Remove a single object.',
      args: [
        { name: 'obj', type: 'Object' },
        { name: 'sink', type: 'Sink' }
      ]
    },
    {
      name: 'error',
      description: 'Report an error.',
      args: [
        { name: 'obj', type: 'Object' }
      ]
    },
    {
      name: 'eof',
      description: 'Indicate that no more operations will be performed on the Sink.'
    }
  ]
});


FOAModel({
  model_: 'Interface',

  name: 'Predicate',
  description: 'A boolean Predicate.',

  methods: [
    {
      name: 'f',
      description: 'Find a single object, using either a Predicate or the primary-key.',
      returnType: 'Boolean',
      args: [
        { name: 'o', description: 'The object to be predicated.' }
      ]
    },
  ]
});


FOAModel({
  model_: 'Interface',

  name: 'Comparator',
  description: 'A strategy for comparing pairs of Objects.',

  methods: [
    {
      name: 'compare',
      description: 'Compare two objects, returning 0 if they are equal, > 0 if the first is larger, and < 0 if the second is.',
      returnType: 'Int',
      args: [
        { name: 'o1', description: 'The first object to be compared.' },
        { name: 'o2', description: 'The second object to be compared.' }
      ]
    },
  ]
});


// 'options': Map including 'query', 'order', and 'limit', all optional

FOAModel({
  model_: 'Interface',

  package: 'dao',
  name: 'DAO',
  description: 'Data Access Object',
  extends: ['Sink'],

  methods: [
    {
      name: 'find',
      description: 'Find a single object, using either a Predicate or the primary-key.',
      args: [
        { name: 'key', type: 'Predicate|Object' },
        { name: 'sink', type: 'Sink' }
      ]
    },
    {
      name: 'removeAll',
      description: 'Remove all (scoped) objects.',
      args: [
        { name: 'sink', type: 'Sink' },
        { name: 'options', type: 'Object', optional: true }
      ]
    },
    {
      name: 'select',
      description: 'Select all (scoped) objects.',
      args: [
        { name: 'sink', type: 'SinkI', optional: true, help: 'Defaults to [].' },
        { name: 'options', type: 'Object', optional: true }
      ]
    },
    {
      name: 'pipe',
      description: 'The equivalent of doing a select() followed by a listen().',
      args: [
        { name: 'sink', type: 'Sink' },
        { name: 'options', type: 'Object', optional: true }
      ]
    },
    {
      name: 'listen',
      description: 'Listen for future (scoped) updates to the DAO.',
      args: [
        { name: 'sink', type: 'Sink' },
        { name: 'options', type: 'Object', optional: true }
      ]
    },
    {
      name: 'unlisten',
      description: 'Remove a previously registered listener.',
      args: [
        { name: 'sink', type: 'Sink' }
      ]
    },
    {
      name: 'where',
      description: 'Return a DAO that will be filtered to the specified predicate.',
      returnValue: 'DAO',
      args: [
        { name: 'query', type: 'Predicate' }
      ]
    },
    {
      name: 'limit',
      description: 'Return a DAO that will limit future select()\'s to the specified number of results.',
      returnValue: 'DAO',
      args: [
        { name: 'count', type: 'Int' }
      ]
    },
    {
      name: 'skip',
      description: 'Return a DAO that will skip the specified number of objects from future select()\'s',
      returnValue: 'DAO',
      args: [
        { name: 'skip', type: 'Int' }
      ]
    },
    {
      name: 'orderBy',
      description: 'Return a DAO that will order future selection()\'s by the specified sort order.',
      returnValue: 'DAO',
      args: [
        {
          name: 'comparators',
          rest: true,
          type: 'Comparator',
          description: 'One or more comparators that specify the sort-order.'
        }
      ]
    }
    // Future: drop() - drop/remove the DAO
    //         cmd()  - handle extension operations
  ]
});


/** A DAO proxy that delays operations until the delegate is set in the future. **/
var FutureDAO = {
  create: function(/* future */ futureDelegate) {

    // This is kind-of-tricky.  We actually return an object whose proto is the future-proxy
    // code.  This is so that once the future-delegate is set, that we can rewrite the proto
    // to be that delegate.  This removes the future related code so that we no longer have
    // pay the overhead once the delegate has been set.

    function setupFuture(delegate) {
      if ( ret.__proto__ != delegate ) {
        for ( var i = 0 ; i < ret.__proto__.daoListeners_.length ; i++ ) {
          delegate.listen.apply(delegate, ret.__proto__.daoListeners_[i]);
        }
        ret.__proto__ = delegate;
      }
    }

    var ret = {
      __proto__: {
        // TODO: implement other DAO methods
        daoListeners_: [],

        select: function() {
          var a = arguments;
          var f = afuture();
          futureDelegate(function(delegate) {
            // This removes this code from the delegate-chain and replaces the real delegate.
            setupFuture(delegate);
            delegate.select.apply(delegate, a)(f.set);
          });
          return f.get;
        },
        pipe: function() {
          var a = arguments;
          futureDelegate(function(delegate) {
            // This removes this code from the delegate-chain and replaces the real delegate.
            setupFuture(delegate);
            delegate.pipe.apply(delegate, a);
          });
        },
        put: function() {
          var a = arguments;
          futureDelegate(function(delegate) {
            setupFuture(delegate);
            delegate.put.apply(delegate, a);
          });
        },
        find: function() {
          var a = arguments;
          futureDelegate(function(delegate) {
            setupFuture(delegate);
            delegate.find.apply(delegate, a);
          });
        },
        where: function(query) {
          if ( arguments.length > 1 ) query = CompoundComparator.apply(null, arguments);
          return filteredDAO(query, this);
        },
        limit: function(count) {
          return limitedDAO(count, this);
        },
        skip: function(skip) {
          return skipDAO(skip, this);
        },
        orderBy: function() {
          return orderedDAO(arguments.length == 1 ? arguments[0] : argsToArray(arguments), this);
        },
        listen: function(sink, options) {
          this.daoListeners_.push([sink, options]);
        },
        unlisten: function(sink) {
          for ( var i = 0 ; i < this.daoListeners_ ; i++ ) {
            if ( this.daoListeners_[i][0] === sink ) {
              this.daoListeners_.splice(i, 1);
              return;
            }
          }
          console.warn('phantom DAO unlisten: ', sink);
        }
      }};
    return ret;
  }
};


var CachingDAO = {

  create: function(cache, source) {
    var futureDelegate = afuture();

    //    console.time('CachingDAO-' + source.model.name);
    source.select(cache)(function() {
      //      console.timeEnd('CachingDAO-' + source.model.name);
      source.listen(cache);
      futureDelegate.set(cache);
    });

    return {
      __proto__: FutureDAO.create(futureDelegate.get),

      model: cache.model || source.model,
      put: function(obj, sink) { source.put(obj, sink); },
      remove: function(query, sink) { source.remove(query, sink); },
      removeAll: function(sink, options) {
        return source.removeAll(sink, options);
      }
    };
  }

};


var LoggingDAO = {

  create: function(/*[logger], delegate*/) {
    var logger, delegate;
    if ( arguments.length == 2 ) {
      logger = arguments[0];
      delegate = arguments[1];
    } else {
      logger = console.log.bind(console);
      delegate = arguments[0];
    }

    return {
      __proto__: delegate,

      put: function(obj, sink) {
        logger('put', obj);
        delegate.put(obj, sink);
      },
      remove: function(query, sink) {
        logger('remove', query);
        delegate.remove(query, sink);
      },
      select: function(sink, options) {
        logger('select', options || "");
        return delegate.select(sink, options);
      },
      removeAll: function(query, sink) {
        logger('removeAll', query);
        return delegate.remove(query, sink);
      }
    };
  }

};


var TimingDAO = {

  create: function(name, delegate) {
    // Used to distinguish between concurrent operations
    var id;
    var activeOps = {put: 0, remove:0, find: 0, select: 0};
    function start(op) {
      var str = name + '-' + op;
      var key = activeOps[op]++ ? str + '-' + (id++) : str;
      console.time(id);
      return [key, str, window.performance.now(), op];
    }
    function end(act) {
      activeOps[act[3]]--;
      id--;
      console.timeEnd(act[0]);
      console.log('Timing: ', act[1], ' ', (window.performance.now()-act[2]).toFixed(3), ' ms');
    }
    function endSink(act, sink) {
      return {
        put:    function() { end(act); sink && sink.put    && sink.put.apply(sink, arguments); },
        remove: function() { end(act); sink && sink.remove && sink.remove.apply(sink, arguments); },
        error:  function() { end(act); sink && sink.error  && sink.error.apply(sink, arguments); },
        eof:    function() { end(act); sink && sink.eof    && sink.eof.apply(sink, arguments); }
      };
    }
    return {
      __proto__: delegate,

      put: function(obj, sink) {
        var act = start('put');
        delegate.put(obj, endSink(act, sink));
      },
      remove: function(query, sink) {
        var act = start('remove');
        delegate.remove(query, endSink(act, sink));
      },
      find: function(key, sink) {
        var act = start('find');
        delegate.find(key, endSink(act, sink));
      },
      select: function(sink, options) {
        var act = start('select');
        var fut = afuture();
        delegate.select(sink, options)(function(s) {
          end(act);
          fut.set(s);
        });
        return fut.get;
      }
    };
  }

};


var ObjectToJSON = {
  __proto__: Visitor.create(),

  visitFunction: function(o) {
    return o.toString();
  },

  visitObject: function(o) {
    this.push({model_: o.model_.name});
    this.__proto__.visitObject.call(this, o);
    return this.pop();
  },
  visitProperty: function(o, prop) {
    this.top()[prop.name] = this.visit(o[prop.name]);
  },

  visitMap: function(o) {
    this.push({});
    Visitor.visitMap.call(this, o);
    return this.pop();
  },
  visitMapElement: function(key, value) { this.top()[key] = this.visit(value); },

  visitArray: function(o) {
    this.push([]);
    this.__proto__.visitArray.call(this, o);
    return this.pop();
  },
  visitArrayElement: function (arr, i) { this.top().push(this.visit(arr[i])); }
};


var JSONToObject = {
  __proto__: ObjectToJSON.create(),

  visitString: function(o) {
    try {
      return o.substr(0, 8) === 'function' ?
        eval('(' + o + ')') :
        o ;
    } catch (x) {
      console.log(x, o);
      return o;
    }
  },

  visitObject: function(o) {
    var model   = GLOBAL[o.model_];
    if ( ! model ) throw ('Unknown Model: ', o.model_);
    var obj     = model.create();

    //    o.forEach((function(value, key) {
    // Workaround for crbug.com/258522
    Object_forEach(o, (function(value, key) {
      if ( key !== 'model_' ) obj[key] = this.visit(value);
    }).bind(this));

    return obj;
  },

  // Substitute in-place
  visitArray: Visitor.visitArray,
  visitArrayElement: function (arr, i) { arr[i] = this.visit(arr[i]); }
};


FOAModel({
  name: 'AbstractDAO',

  methods: {

    update: function(expr) {
      return this.select(UPDATE(expr, this));
    },

    listen: function(sink, options) {
      sink = this.decorateSink_(sink, options, true);
      if ( ! this.daoListeners_ ) {
        Object.defineProperty(this, 'daoListeners_', {
          enumerable: false,
          value: []
        });
      }
      this.daoListeners_.push(sink);
    },

    pipe: function(sink, options) {
      sink = this.decorateSink_(sink, options, true);

      var fc   = this.createFlowControl_();
      var self = this;

      this.select({
        put: function() {
          sink.put && sink.put.apply(sink, arguments);
        },
        remove: function() {
          sink.remove && sink.remove.apply(sink, arguments);
        },
        error: function() {
          sink.error && sink.error.apply(sink, arguments);
        },
        eof: function() {
          if ( fc.stopped ) {
            sink.eof && sink.eof();
          } else {
            self.listen(sink, options);
          }
        }
      }, options, fc);
    },

    decorateSink_: function(sink, options, isListener, disableLimit) {
      if ( options ) {
        if ( ! disableLimit ) {
          if ( options.limit ) sink = limitedSink(options.limit, sink);
          if ( options.skip )  sink = skipSink(options.skip, sink);
        }

        if ( options.order && ! isListener ) {
          sink = orderedSink(options.order, sink);
        }

        if ( options.query ) {
          sink = predicatedSink(
            options.query.partialEval ?
              options.query.partialEval() :
              options.query,
            sink) ;
        }
      }

      return sink;
    },

    createFlowControl_: function() {
      return {
        stop: function() { this.stopped = true; },
        error: function(e) { this.errorEvt = e; }
      };
    },

    where: function(query) {
      return filteredDAO(query, this);
    },

    limit: function(count) {
      return limitedDAO(count, this);
    },

    skip: function(skip) {
      return skipDAO(skip, this);
    },

    orderBy: function() {
      return orderedDAO(arguments.length == 1 ?
                        arguments[0] :
                        argsToArray(arguments), this);
    },

    unlisten: function(sink) {
      var ls = this.daoListeners_;
      if ( ls ) {
        for ( var i = 0; i < ls.length ; i++ ) {
          if ( ls[i].$UID === sink.$UID ) {
            ls.splice(i, 1);
            return true;
          }
        }
        console.warn('Phantom DAO unlisten: ', this, sink);
      }
    },

    // Default removeAll: calls select() with the same options and
    // calls remove() for all returned values.
    removeAll: function(sink, options) {
      var self = this;
      var future = afuture();
      this.select({
        put: function(obj) {
          self.remove(obj, { remove: sink && sink.remove });
        }
      })(function() {
        sink && sink.eof();
        future.set();
      });
      return future.get;
    },

    /**
     * Notify all listeners of update to DAO.
     * @param fName the name of the method in the listeners to call.
     *        possible values: 'put', 'remove'
     **/
    notify_: function(fName, args) {
      if ( ! this.daoListeners_ ) return;
      for( var i = 0 ; i < this.daoListeners_.length ; i++ ) {
        var l = this.daoListeners_[i];
        var fn = l[fName];
        if ( fn ) {
          // Create flow-control object
          args[2] = {
            stop: (function(fn, l) {
              return function() { fn(l); };
            })(this.unlisten.bind(this), l),
            error: function(e) { /* Don't care. */ }
          };
          fn.apply(l, args);
        }
      }
    }
  }
});

FOAModel({
  name: 'ProxyDAO',

  extendsModel: 'AbstractDAO',

  properties: [
    {
      name: 'delegate',
      type: 'DAO',
      mode: "read-only",
      hidden: true,
      required: true,
      transient: true,
      postSet: function(oldDAO, newDAO) {
        this.model = newDAO.model;
        if ( this.daoListeners_ && this.daoListeners_.length ) {
          if ( oldDAO ) oldDAO.unlisten(this.relay());
          newDAO.listen(this.relay());
          this.notify_('put', []);
        }
      }
    }
  ],

  methods: {
    relay: function() {
      if ( ! this.relay_ ) {
        var self = this;

        this.relay_ = {
          put:    function() { self.notify_('put', arguments);    },
          remove: function() { self.notify_('remove', arguments); },
          toString: function() { return 'RELAY(' + this.$UID + ', ' + self.model_.name + ', ' + self.delegate + ')'; }
        };
      }

      return this.relay_;
    },

    put: function(value, sink) {
      this.delegate.put(value, sink);
    },

    remove: function(query, sink) {
      this.delegate.remove(query, sink);
    },

    removeAll: function() {
      return this.delegate.removeAll.apply(this.delegate, arguments);
    },

    find: function(key, sink) {
      this.delegate.find(key, sink);
    },

    select: function(sink, options) {
      return this.delegate.select(sink, options);
    },

    listen: function(sink, options) {
      // Adding first listener, so listen to delegate
      if ( ! this.daoListeners_ || ! this.daoListeners_.length ) {
        this.delegate.listen(this.relay());
      }

      this.SUPER(sink, options);
    },

    unlisten: function(sink) {
      this.SUPER(sink);

      // Remove last listener, so unlisten to delegate
      if ( ! this.daoListeners_ || ! this.daoListeners_.length ) {
        this.delegate.unlisten(this.relay());
      }
    }
  }
});

/**
 * Set a specified properties value with an auto-increment
 * sequence number on DAO.put() if the properties value
 * is set to the properties default value.
 */
FOAModel({
  name: 'SeqNoDAO',
  label: 'SeqNoDAO',

  extendsModel: 'ProxyDAO',

  properties: [
    {
      name: 'property',
      type: 'Property',
      required: true,
      hidden: true,
      defaultValueFn: function() { return this.delegate.model.ID; },
      transient: true
    },
    {
      model_: 'IntProperty',
      name: 'sequenceValue',
      defaultValue: 1
    }
  ],

  methods: {
    init: function() {
      this.SUPER();

      var future = afuture();
      this.WHEN_READY = future.get;

      // Scan all DAO values to find the
      this.delegate.select(MAX(this.property))(function(max) {
        if ( max.max ) this.sequenceValue = max.max + 1;
        future.set(true);
      }.bind(this));
    },
    put: function(obj, sink) {
      this.WHEN_READY(function() {
        var val = this.property.f(obj);

        if ( val == this.property.defaultValue ) {
          obj[this.property.name] = this.sequenceValue++;
        }

        this.delegate.put(obj, sink);
      }.bind(this));
    }
  }
});


/**
 * Provide Cascading Remove.
 * Remove dependent children from a secondary DAO when parent is
 * removed from the delegate DAO.
 */
FOAModel({
  name: 'CascadingRemoveDAO',
  label: 'SeqNoDAO', // TODO: Copy-paste error?

  extendsModel: 'ProxyDAO',

  properties: [
    {
      name: 'childDAO',
      type: 'DAO',
      mode: "read-only",
      hidden: true,
      required: true,
      transient: true
    },
    {
      name: 'property',
      type: 'Property',
      required: true,
      hidden: true,
      transient: true
    }
  ],

  methods: {
    remove: function(query, sink) {
      this.childDAO.where(EQ(this.property, query)).removeAll();
      this.delegate.remove(query, sink);
    },
    removeAll: function(sink, options) {
      return apar(
        this.childDAO.removeAll(null, options), // TODO: Sane?
        this.delegate.removeAll(sink, options)
      );
    }
  }
});


// TODO: filter notifications also
function filteredDAO(query, dao) {
  if ( query === TRUE ) return dao;

  return {
    __proto__: dao,
    select: function(sink, options) {
      return dao.select(sink, options ? {
        __proto__: options,
        query: options.query ?
          AND(query, options.query) :
          query
      } : {query: query});
    },
    removeAll: function(sink, options) {
      return dao.removeAll(sink, options ? {
        __proto__: options,
        query: options.query ?
          AND(query, options.query) :
          query
      } : {query: query});
    },
    listen: function(sink, options) {
      return dao.listen(sink, options ? {
        __proto__: options,
        query: options.query ?
          AND(query, options.query) :
          query
      } : {query: query});
    }

  };
}


function orderedDAO(comparator, dao) {
  //  comparator = toCompare(comparator);
  //  if ( comparator.compare ) comparator = comparator.compare.bind(comparator);

  return {
    __proto__: dao,
    select: function(sink, options) {
      if ( options ) {
        if ( ! options.order )
          options = { __proto__: options, order: comparator };
      } else {
        options = {order: comparator};
      }

      return dao.select(sink, options);
    }
  };
}


function limitedDAO(count, dao) {
  return {
    __proto__: dao,
    select: function(sink, options) {
      if ( options ) {
        if ( 'limit' in options ) {
          options = {
            __proto__: options,
            limit: Math.min(count, options.limit)
          };
        } else {
          options = { __proto__: options, limit: count };
        }
      }
      else {
        options = { limit: count };
      }

      return dao.select(sink, options);
    }
  };
}


function skipDAO(skip, dao) {
  return {
    __proto__: dao,
    select: function(sink, options) {
      if ( options ) {
        options = {
          __proto__: options,
          skip: skip
        };
      } else {
        options = { __proto__: options, skip: skip };
      }

      return dao.select(sink, options);
    }
  };
}


// Copy AbstractDAO methods in Array prototype

var pmap = {};
for ( var key in AbstractDAO.methods ) {
  pmap[AbstractDAO.methods[key].name] = AbstractDAO.methods[key].code;
}

defineProperties(Array.prototype, pmap);

defineProperties(Array.prototype, {
  // Clone this Array and remove 'v' (only 1 instance)
  // TODO: make faster by copying in one pass, without splicing
  deleteF: function(v) {
    var a = this.clone();
    for (var i = 0; i < a.length; i++) {
      if ( a[i] === v ) { a.splice(i, 1); break; }
    }
    return a;
  },
  // Remove 'v' from this array (only 1 instance removed)
  // return true iff the value was removed
  deleteI: function(v) {
    for (var i = 0; i < this.length; i++) {
      if ( this[i] === v ) { this.splice(i, 1); return true; }
    }
    return false;
  },
  // Clone this Array and remove first object where predicate 'p' returns true
  // TODO: make faster by copying in one pass, without splicing
  removeF: function(p) {
    var a = this.clone();
    for (var i = 0; i < a.length; i++) {
      if (p.f(a[i])) { a.splice(i, 1); break; }
    }
    return a;
  },
  // Remove first object in this array where predicate 'p' returns true
  removeI: function(p) {
    for (var i = 0; i < this.length; i++) {
      if (p.f(this[i])) { this.splice(i, 1); breeak; }
    }
    return this;
  },
  pushF: function(obj) {
    var a = this.clone();
    a.push(obj);
    return a;
  },
  clone: function() {
    return this.slice(0);
  },
  deepClone: function() {
    var a = this.slice(0);
    for ( var i = 0 ; i < a.length ; i++ ) {
      a[i] = a[i].deepClone();
    }
    return a;
  },
  put: function(obj, sink) {
    // With this block of code an [] is a real DAO
    // but is much slower for collecting results.
    /*
      for (var idx in this) {
      if (this[idx].id === obj.id) {
      this[idx] = obj;
      sink && sink.put && sink.put(obj);
      this.notify_('put', arguments);
      //        sink && sink.error && sink.error('put', obj, duplicate);
      return;
      }
      }
    */
    this.push(obj);
    this.notify_('put', arguments);
    sink && sink.put && sink.put(obj);
  },
  find: function(query, sink) {
    if ( query.f ) {
      for (var idx in this) {
        if ( query.f(this[idx]) ) {
          sink && sink.put && sink.put(this[idx]);
          return;
        }
      }
    } else {
      for (var idx in this) {
        if ( this[idx].id === query ) {
          sink && sink.put && sink.put(this[idx]);
          return;
        }
      }
    }
    sink && sink.error && sink.error('find', query);
  },
  // TODO: make this faster, should stop after finding first item.
  remove: function(query, sink) {
    var id = query.id ? query.id : query;
    this.removeAll({ remove: sink && sink.remove },
                   { query: { f: function(obj) { return obj.id ? obj.id === id : obj === id; } } });
  },
  removeAll: function(sink, options) {
    if (!options) options = {};
    if (!options.query) options.query = { f: function() { return true; } };

    for (var i = 0; i < this.length; i++) {
      var obj = this[i];
      if (options.query.f(obj)) {
        var rem = this.splice(i,1)[0];
        this.notify_('remove', [rem]);
        sink && sink.remove && sink.remove(rem);
        i--;
      }
    }
    sink && sink.eof && sink.eof();
    return anop();
  },
  select: function(sink, options) {
    sink = sink || [];
    var hasQuery = options && ( options.query || options.order );
    var originalsink = sink;
    sink = this.decorateSink_(sink, options, false, ! hasQuery);

    // Short-circuit COUNT.
    if ( sink.model_ === CountExpr ) {
      sink.count = this.length;
      return aconstant(originalsink);
    }

    var fc = this.createFlowControl_();
    var start = Math.max(0, hasQuery ? 0 : ( options && options.skip ) || 0);
    var end = hasQuery ?
      this.length :
      Math.min(this.length, start + ( ( options && options.limit ) || this.length));
    for ( var i = start ; i < end ; i++ ) {
      sink.put(this[i], null, fc);
      if ( fc.stopped ) break;
      if ( fc.errorEvt ) {
        sink.error && sink.error(fc.errorEvt);
        return aconstant(originalsink, fc.errorEvt);
      }
    }

    sink.eof && sink.eof();

    return aconstant(originalsink);
  }
});

function atxn(afunc) {
  return function(ret) {
    if ( GLOBAL.__TXN__ ) {
      afunc.apply(this, arguments);
    } else {
      GLOBAL.__TXN__ = {};
      var a = argsToArray(arguments);
      a[0] = function() {
        GLOBAL.__TXN__ = undefined;
        ret();
      };
      afunc.apply(this, a);
    }
  };
}

/* Usage:
 * var dao = IDBDAO.create({model: Issue});
 * var dao = IDBDAO.create({model: Issue, name: 'ImportantIssues'});
 *
 * TODO:
 * Optimization.  This DAO doesn't use an indexes in indexeddb yet, which
 * means for any query other than a single find/remove we iterate the entire
 * data store.  Obviously this will get slow if you store large amounts
 * of data in the database.
 */
FOAModel({
  extendsModel: 'AbstractDAO',

  name: 'IDBDAO',
  label: 'IndexedDB DAO',

  properties: [
    {
      name:  'model',
      label: 'Model',
      type:  'Model',
      required: true
    },
    {
      name:  'name',
      label: 'Store Name',
      type:  'String',
      defaultValueFn: function() {
        return this.model.plural;
      }
    },
    {
      model_: 'BooleanProperty',
      name: 'useSimpleSerialization',
      defaultValue: true
    }
  ],

  methods: {

    init: function() {
      this.SUPER();

      if ( this.useSimpleSerialization ) {
        this.serialize = this.SimpleSerialize;
        this.deserialize = this.SimpleDeserialize;
      } else {
        this.serialize = this.FOAMSerialize;
        this.deserialize = this.FOAMDeserialize;
      }

      this.withDB = amemo(this.openDB.bind(this));
    },

    FOAMDeserialize: function(json) {
      return JSONToObject.visitObject(json);
    },

    FOAMSerialize: function(obj) {
      return ObjectToJSON.visitObject(obj);
    },

    SimpleDeserialize: function(json) {
      return this.model.create(json);
    },

    SimpleSerialize: function(obj) {
      return obj.instance_;
    },

    openDB: function(cc) {
      var indexedDB = window.indexedDB ||
        window.webkitIndexedDB         ||
        window.mozIndexedDB;

      var request = indexedDB.open("FOAM:" + this.name, 1);

      request.onupgradeneeded = (function(e) {
        e.target.result.createObjectStore(this.name);
      }).bind(this);

      request.onsuccess = (function(e) {
        cc(e.target.result);
      }).bind(this);

      request.onerror = function (e) {
        console.log('************** failure', e);
      };
    },

    withStore: function(mode, fn) {
      if ( mode !== 'readwrite' ) return this.withStore_(mode, fn);

      var self = this;

      if ( ! this.q_ ) {
        var q = [fn];
        this.q_ = q;
        setTimeout(function() {
          self.withStore_(mode, function(store) {
            // console.log('q length: ', q.length);
            if ( self.q_ == q ) self.q_ = undefined;
            for ( var i = 0 ; i < q.length ; i++ ) q[i](store);
          });
        },0);
      } else {
        this.q_.push(fn);
        // Diminishing returns after 10000 per batch
        if ( this.q_.length == 10000 ) this.q_ = undefined;
      }
    },

    withStore_: function(mode, fn) {
      if ( GLOBAL.__TXN__ && GLOBAL.__TXN__.store ) {
        try {
          fn.call(this, __TXN__.store);
          return;
        } catch (x) {
          GLOBAL.__TXN__ = undefined;
        }
      }
      this.withDB((function (db) {
        var tx = db.transaction([this.name], mode);
        var os = tx.objectStore(this.name);
        if ( GLOBAL.__TXN__ ) GLOBAL.__TXN__.store = os;
        fn.call(this, os);
      }).bind(this));
    },

    put: function(value, sink) {
      var self = this;
      this.withStore("readwrite", function(store) {
        var request = store.put(self.serialize(value), value.id);

        request.transaction.addEventListener(
          'complete',
          function(e) {
            self.notify_('put', [value]);
            sink && sink.put && sink.put(value);
          });
        request.transaction.addEventListener(
          'error',
          function(e) {
            // TODO: Parse a better error mesage out of e
            sink && sink.error && sink.error('put', value);
          });
      });
    },

    find: function(key, sink) {
      if ( Expr.isInstance(key) ) {
        var found = false;
        this.limit(1).where(key).select({
          put: function() {
            found = true;
            sink.put.apply(sink, arguments);
          },
          eof: function() {
            found || sink.error('find', key);
          }
        });
        return;
      }

      var self = this;
      this.withStore("readonly", function(store) {
        var request = store.get(key);
        request.transaction.addEventListener(
          'complete',
          function() {
            if (!request.result) {
              sink && sink.error && sink.error('find', key);
              return;
            }
            var result = self.deserialize(request.result);
            sink && sink.put && sink.put(result);
          });
        request.onerror = function(e) {
          // TODO: Parse a better error out of e
          sink && sink.error && sink.error('find', key);
        };
      });
    },

    remove: function(obj, sink) {
      var self = this;
      this.withStore("readwrite", function(store) {
        var key = obj.id ? obj.id : obj;

        var getRequest = store.get(key);
        getRequest.onsuccess = function(e) {
          if (!getRequest.result) {
            sink && sink.error && sink.error('remove', obj);
            return;
          }
          var data = self.deserialize(getRequest.result);
          var delRequest = store.delete(key);
          delRequest.transaction.addEventListener('complete', function(e) {
            self.notify_('remove', [data]);
            sink && sink.remove && sink.remove(data);
          });

          delRequest.onerror = function(e) {
            sink && sink.error && sink.error('remove', e);
          };
        };
        getRequest.onerror = function(e) {
          sink && sink.error && sink.error('remove', e);
        };
        return;
      });
    },

    removeAll: function(sink, options) {
      var query = (options && options.query && options.query.partialEval()) ||
        { f: function() { return true; } };

      var future = afuture();
      var self = this;
      this.withStore('readwrite', function(store) {
        var request = store.openCursor();
        request.onsuccess = function(e) {
          var cursor = e.target.result;
          if (cursor) {
            var value = self.deserialize(cursor.value);
            if (query.f(value)) {
              var deleteReq = cursor.delete();
              deleteReq.transaction.addEventListener(
                'complete',
                function() {
                  self.notify_('remove', [value]);
                  sink && sink.remove && sink.remove(value);
                });
              deleteReq.onerror = function(e) {
                sink && sink.error && sink.error('remove', e);
              };
            }
            cursor.continue();
          } else {
            sink && sink.eof && sink.eof();
            future.set();
          }
        };
        request.onerror = function(e) {
          sink && sink.error && sink.error('remove', e);
        };
      });
      return future.get;
    },

    select: function(sink, options) {
      sink = sink || [];
      sink = this.decorateSink_(sink, options, false);

      var fc = this.createFlowControl_();
      var future = afuture();
      var self = this;

      this.withStore("readonly", function(store) {
        var request = store.openCursor();
        request.onsuccess = function(e) {
          var cursor = e.target.result;
          if ( fc.stopped ) return;
          if ( fc.errorEvt ) {
            sink.error && sink.error(fc.errorEvt);
            future.set(sink, fc.errorEvt);
            return;
          }

          if (!cursor) {
            sink.eof && sink.eof();
            future.set(sink);
            return;
          }

          var value = self.deserialize(cursor.value);
          sink.put(value);
          cursor.continue();
        };
        request.onerror = function(e) {
          sink.error && sink.error(e);
        };
      });

      return future.get;
    }
  },

  listeners: [
    {
      name: 'updated',
      code: function(evt) {
        console.log('updated: ', evt);
        this.publish('updated');
      }
    }
  ]

});


FOAModel({
  name: 'StorageDAO',

  extendsModel: 'MDAO',

  properties: [
    {
      name:  'name',
      label: 'Store Name',
      type:  'String',
      defaultValueFn: function() {
        return this.model.plural;
      }
    }
  ],

  methods: {
    init: function() {
      this.SUPER();

      var objs = localStorage.getItem(this.name);
      if ( objs ) JSONUtil.parse(objs).select(this);

      this.addRawIndex({
        execute: function() {},
        bulkLoad: function() {},
        toString: function() { return "StorageDAO Update"; },
        plan: function() {
          return { cost: Number.MAX_VALUE };
        },
        put: this.updated,
        remove: this.updated
      });
    }
  },

  listeners: [
    {
      name: 'updated',
      isMerged: 100,
      code: function() {
        this.select()(function(a) {
          localStorage.setItem(this.name, JSONUtil.compact.where(NOT_TRANSIENT).stringify(a));
        }.bind(this));
      }
    }
  ]
});


FOAModel({
  extendsModel: 'AbstractDAO',

  name: 'AbstractFileDAO',

  properties: [
    {
      name:  'model',
      type:  'Model',
      requred: true
    },
    {
      name:  'filename',
      label: 'Storage file name',
      type:  'String',
      defaultValueFn: function() {
        return this.model.plural;
      }
    },
    {
      name:  'type',
      label: 'Filesystem Type',
      type:  'String',
      view: {
        create: function() { return ChoiceView.create({choices: [
          'Persistent',
          'Temporary'
        ]});}
      },
      defaultValue: 'Persistent'
    }
  ],

  methods: {
    init: function() {
      this.SUPER();

      var self = this;

      var withEntry = amemo(aseq(
        function(ret) {
          window.webkitStorageInfo.requestQuota(
            self.type === 'Persistent' ? 1 : 0,
            1024 * 1024 * 200, // 200 MB should be fine.
            function() { ret(1024 * 1024 * 200); },
            console.error.bind(console));
        },
        function(ret, quota) {
          window.requestFileSystem(
            self.type === 'Persistent' ? 1 : 0,
            quota, /* expected size*/
            ret,
            console.error.bind(console));
        },
        function(ret, filesystem) {
          filesystem.root.getFile(
            self.filename,
            { create: true },
            ret,
            console.error.bind(console));
        }));


      this.withWriter = amemo(aseq(
        withEntry,
        function(ret, entry) {
          entry.createWriter(ret, console.error.bind(console));
        })),


      this.withStorage = amemo(aseq(
        withEntry,
        function(ret, entry) {
          entry.file(ret, console.error.bind(console));
        },
        function(ret, file) {
          var reader = new FileReader();
          var storage = {};

          reader.onerror = console.error.bind(console);
          reader.onloadend = function() {
            self.parseContents_(ret, reader.result, storage);
          };

          this.readFile_(reader, file);
        }));
    },

    put: function(obj, sink) {
      var self = this;
      this.withStorage(function(s) {
        s.put(obj, {
          __proto__: sink,
          put: function() {
            sink && sink.put && sink.put(obj);
            self.notify_('put', [obj]);
            self.update_('put', obj);
          }
        });
      });
    },

    find: function(key, sink) {
      this.withStorage(function(s) {
        s.find(key, sink);
      });
    },

    remove: function(obj, sink) {
      var self = this;
      this.withStorage(function(s) {
        s.remove(obj, {
          __proto__: sink,
          remove: function(obj) {
            self.__proto__.remove && self.__proto__.remove(obj);
            self.notify_('remove', [obj]);
            self.update_('remove', obj);
          }
        });
      });
    },

    removeAll: function(sink, options) {
      var self = this;
      var future = afuture();
      this.withStorage(function(s) {
        var fut = s.removeAll({
          __proto__: sink,
          remove: function(obj) {
            self.__proto__.remove && self.__proto__.remove(obj);
            self.notify_('remove', [obj]);
            self.update_('remove', obj);
          }
        }, options);
        fut(future.set);
      });
      return future.get;
    },

    select: function(sink, options) {
      this.withStorage(function(s) {
        s.select(sink, options);
      });
    }
  }
});


FOAModel({
  name: 'JSONFileDAO',
  extendsModel: 'AbstractFileDAO',

  label: 'JSON File DAO',

  properties: [
    {
      name:  'writeQueue',
      type:  'Array[String]',
      defaultValueFn: function() {
        return [];
      }
    }
  ],

  methods: {
    init: function() {
      this.SUPER();

      this.withWriter((function(writer) {
        writer.addEventListener(
          'writeend',
          (function(e) {
            this.writeOne_(e.target);
          }).bind(this));
      }).bind(this));
    },

    readFile_: function(reader, file) {
      reader.readAsText(file);
    },

    parseContents_: function(ret, contents, storage) {
      with (storage) { eval(contents); }
      ret(storage);
    },

    writeOne_: function(writer) {
      if ( writer.readyState == 1 ) return;
      if ( this.writeQueue.length == 0 ) return;

      writer.seek(writer.length);
      var queue = this.writeQueue;
      var blob = queue.shift();
      this.writeQueue = queue;
      writer.write(blob);
    },

    update_: function(mutation, obj) {
      var parts = [];

      if (mutation === 'put') {
        parts.push("put(" + JSONUtil.compact.stringify(obj) + ");\n");
      } else if (mutation === 'remove') {
        parts.push("remove(" + JSONUtil.compact.stringify(obj.id) + ");\n");
      }

      this.writeQueue = this.writeQueue.concat(new Blob(parts));

      this.withWriter((function(writer) {
        this.writeOne_(writer);
      }).bind(this));
    }
  }
});


FOAModel({
  name: 'KeyCollector',
  help: "A sink that collects the keys of the objects it's given.",

  properties: [
    {
      name: 'keys',
      type: 'Array',
      factory: function() { return []; }
    }
  ],

  methods: {
    put: function(value) {
      this.keys.push(value.id);
    },
    remove: function(value) {
      this.keys.remove(value.id);
    }
  }
});


FOAModel({
  name: 'WorkerDAO',
  extendsModel: 'AbstractDAO',

  properties: [
    {
      name: 'model',
      type: 'Model',
      required: true
    },
    {
      name: 'delegate',
      type: 'Worker',
      help: 'The web-worker to delegate all actions to.',
      factory: function() {
        var url = window.location.protocol +
          window.location.host +
          window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1);
        var workerscript = [
          "var url = '" + url + "';\n",
          "var a = importScripts;",
          "importScripts = function(scripts) { \nfor (var i = 0; i < arguments.length; i++) \na(url + arguments[i]); \n};\n",
          "try { importScripts('bootFOAMWorker.js'); } catch(e) { \n debugger; }\n",
          "WorkerDelegate.create({ dao: [] });\n"
        ];
        return new Worker(window.URL.createObjectURL(
          new Blob(workerscript, { type: "text/javascript" })));
      },
      postSet: function(oldVal, val) {
        if ( oldVal ) {
          oldVal.terminate();
        }
        val.addEventListener("message", this.onMessage);
      }
    },
    {
      name:  'requests_',
      type:  'Object',
      label: 'Requests',
      help:  'Map of pending requests to delegate.',
      factory: function() { return {}; }
    },
    {
      name:  'nextRequest_',
      type:  'Int',
      label: 'Next Request',
      help:  'Id of the next request to the delegate.',
      factory: function() { return 1; }
    },
    { // Consider making this a DAO.  Challenge is keeping in sync if this throws errors after delegate has completed something.
      name:  'storage_',
      type:  'Object',
      label: 'Storage',
      help:  'Local cache of the data in the delegate.',
      factory: function() { return {}; }
    }
  ],

  methods: {
    init: function() {
      this.SUPER();
      this.delegate.postMessage("");
    },
    destroy: function() {
      // Send a message to the delegate?
      this.delegate.terminate();
    },
    makeRequest_: function(method, params, callback, error) {
      var reqid = this.nextRequest_++;
      params = params ?
        ObjectToJSON.visit(params) :
        {};
      var message = {
        method: method,
        params: params,
        request: reqid
      };
      this.requests_[reqid] = {
        method: method,
        callback: callback,
        error: error
      };
      this.delegate.postMessage(message);
    },
    put: function(obj, sink) {
      this.makeRequest_(
        "put", obj,
        (function(response) {
          this.storage_[obj.id] = obj;
          this.notify_("put", [obj]);
          sink && sink.put && sink.put(obj);
        }).bind(this),
        sink && sink.error && sink.error.bind(sink));
    },
    remove: function(query, sink) {
      this.makeRequest_(
        "remove", query,
        (function(response) {
          for ( var i = 0, key = response.keys[i]; key; i++) {
            var obj = this.storage_[key];
            delete this.storage_[key];
            sink && sink.remove && sink.remove(obj);
          }
        }).bind(this),
        sink && sink.error && sink.error.bind(sink));
    },
    // TODO: Implement removeAll()
    find: function(id, sink) {
      // No need to go to worker.
      this.storage_.find(id, sink);
    },
    select: function(sink, options) {
      sink = sink || [];
      // Cases:
      // 1) Cloneable reducable sink. -- Clone sync, get response, reduceI
      // 2) Non-cloneable reducable sink -- treat same as case 3.
      // 3) Non-cloneable non-reducable sink -- Use key-creator, just put into sink

      var fc = this.createFlowControl_();

      if (sink.model_ && sink.reduceI) {
        var request = {
          sink: sink,
          options: options
        };

        this.makeRequest_(
          "select", request,
          (function(response) {
            var responsesink = JSONToObject.visit(response.sink);
            sink.reduceI(responsesink);
            sink.eof && sink.eof();
          }).bind(this),
          sink && sink.error && sink.error.bind(sink));
      } else {
        var mysink = KeyCollector.create();
        request = {
          sink: mysink,
          options: options
        };

        this.makeRequest_(
          "select", request,
          (function(response) {
            var responsesink = JSONToObject.visit(response.sink);
            for (var i = 0; i < responsesink.keys.length; i++) {
              var key = responsesink.keys[i];
              if ( fc.stopped ) break;
              if ( fc.errorEvt ) {
                sink.error && sink.error(fc.errorEvt);
                break;
              }
              var obj = this.storage_[key];
              sink.put(obj);
            }
            sink.eof && sink.eof();
          }).bind(this),
          sink && sink.error && sink.error.bind(sink));
      }
    },
    handleNotification_: function(message) {
      if (message.method == "put") {
        var obj = JSONToObject.visitObject(message.obj);
        this.storage_[obj.id] = obj;
        this.notify_("put", [obj]);
      } else if (message.method == "remove") {
        var obj = this.stroage_[message.key];
        delete this.storage_[message.key];
        this.notify_("remove", [obj]);
      }
    }
  },

  listeners: [
    {
      name: 'onMessage',
      help: 'Callback for message events from the delegate.',
      code: function(e) {
        // FIXME: Validate origin.
        var message = e.data;
        if (message.request) {
          var request = this.requests_[message.request];
          delete this.requests_[message.request];
          if (message.error) {
            request.error(message.error);
            return;
          }
          request.callback(message);
          return;
        } // If no request was specified this is a notification.
        this.handleNotification_(message);
      }
    }
  ]
});


FOAModel({
  name: 'WorkerDelegate',
  help:  'The client side of a web-worker DAO',

  properties: [
    {
      name:  'dao',
      label: 'DAO',
      type:  'DAO',
      required: 'true',
      postSet: function(oldVal, val) {
        if (oldVal) oldVal.unlisten(this);
        val.listen(this);
      }
    }
  ],

  methods: {
    init: function() {
      this.SUPER();

      self.addEventListener('message', this.onMessage);
    },
    put: function(obj) {
      self.postMessage({
        method: "put",
        obj: ObjectToJSON.visitObject(obj)
      });
    },
    remove: function(obj) {
      self.postMessage({
        method: "remove",
        key: obj.id
      });
    }
  },

  listeners: [
    {
      name: 'onMessage',
      code: function(e) {
        // This is a nightmare of a function, clean it up.
        var message = e.data;
        if ( !message.method ) return;
        var me = this;
        var params = message.params.model_ ?
          JSONToObject.visitObject(message.params) :
          message.params;
        if (message.method == "put") {
          this.dao.put(params, {
            put: function() {
              self.postMessage({
                request: message.request
              });
            },
            error: function() {
              self.postMessage({
                request: message.request,
                error: true
              });
            }
          });
        } else if(message.method == "remove") {
          this.dao.remove(params, {
            remove: function() {
              self.postMessage({
                request: message.request
              });
            },
            error: function() {
              self.postMessage({
                request: message.request,
                error: true
              });
            }
          });
        } else if(message.method == "select") {
          var request = JSONToObject.visit(message.params);
          var mysink = {
            __proto__: request.sink,
            eof: function() {
              request.sink.eof && request.sink.eof();
              self.postMessage({
                request: message.request,
                sink: ObjectToJSON.visit(this.__proto__)
              });
            },
            error: function() {
              request.sink.error && request.sink.error();
              self.postMessage({
                request: message.request,
                error: true
              });
            }
          };
          this.dao.select(mysink, request.options);
        }
      }
    }
  ]
});


var ModelDAO = {
  create: function(namespace, dao) {
    var res = {
      __proto__: dao,
      namespace: namespace,
      dao:       dao,
      created:   { },

      init_: function() {
        var self = this;
        this.pipe({
          put: self.add_.bind(this),
          remove: self.del_.bind(this)
        });
      },

      add_: function(obj) {
        if ( obj.name == 'Model' ) return;

        var dao = this;

        this.namespace[obj.name] = obj;

        FOAM.putFactory(this.namespace, obj.name + "Proto", function() {
          return this.namespace[obj.name].getPrototype();
        });

        FOAM.putFactory(this.namespace, obj.name + 'DAO', function() {
          console.log("Creating '" + obj.name + "DAO'");
          return StorageDAO.create({ model: obj });
        });
      },

      del_: function() {
        for (var objID in this.created) {
          delete this.namespace[objID];
        }
      }

      //TODO: remove models from namespace on remove()
    };
    res.init_();
    return res;
  }
};


FOAModel({
  name: 'OrderedCollectorSink',

  properties: [
    {
      name: 'storage',
      type: 'Array',
      factory: function() { return []; }
    },
    {
      name: 'comparator',
      type: 'Value',
      required: true
    }
  ],

  methods: {
    reduceI: function(other) {
      this.storage = this.storage.reduce(this.comparator, other.storage);
    },
    put: function(obj) {
      this.storage.push(obj);
    }
  }
});


FOAModel({
  name: 'CollectorSink',

  properties: [
    {
      name: 'storage',
      type: 'Array',
      factory: function() { return []; }
    }
  ],

  methods: {
    reduceI: function(other) {
      this.storage = this.storage.concat(other.storage);
    },
    put: function(obj) {
      this.storage.push(obj);
    }
  }
});


FOAModel({
  name: 'ParitionDAO',
  extendsModel: 'AbstractDAO',

  properties: [
    {
      name: 'partitions',
      type: 'Array[DAO]',
      mode: "read-only",
      required: true
    }
  ],

  methods: {
    init: function() {
      this.SUPER();

      for ( var i = 0; i < this.partitions.length; i++) {
        var part = this.partitions[i];
        var self = this;
        part.listen({
          put: function(value) {
            self.notify_("put", [value]);
          },
          remove: function(value) {
            self.notify_("remove", [value]);
          }
        });
      }
    },
    getPartition_: function(value) {
      return this.partitions[Math.abs(value.hashCode()) % this.partitions.length];
    },
    put: function(value, sink) {
      this.getPartition_(value).put(value, sink);
    },
    remove: function(obj, sink) {
      if (obj.id) {
        this.getPartition_(obj).remove(obj, sink);
      } else {
        var self = this;
        this.find(obj, { put: function(obj) { self.remove(obj, sink); }, error: sink && sink.error });
      }
    },
    find: function(key, sink) {
      // Assumes no data redundancy
      for (var i = 0; i < this.partitions.length; i++) {
        this.partitions[i].find(key, sink);
      }
    },
    select: function(sink, options) {
      sink = sink || [];
      var myoptions = {};
      var originalsink = sink;
      options = options || {};
      if ( 'limit' in options ) {
        myoptions.limit = options.limit + (options.skip || 0),
        myoptions.skip = 0;
      }

      myoptions.order = options.order;
      myoptions.query = options.query;

      var pending = this.partitions.length;

      var fc = this.createFlowControl_();
      var future = afuture();

      if (sink.model_ && sink.reduceI) {
        var mysink = sink;
      } else {
        if (options.order) {
          mysink = OrderedCollectorSink.create({ comparator: options.order });
        } else {
          mysink = CollectorSink.create({});
        }
        if ( 'limit' in options ) sink = limitedSink(options.limit, sink);
        if ( options.skip ) sink = skipSink(options.skip, sink);

        mysink.eof = function() {
          for (var i = 0; i < this.storage.length; i++) {
            if ( fc.stopped ) break;
            if ( fc.errorEvt ) {
              sink.error && sink.error(fc.errorEvt);
              future.set(sink, fc.errorEvt);
              break;
            }
            sink.put(this.storage[i], null, fc);
          }
        };
      }

      var sinks = new Array(this.partitions.length);
      for ( var i = 0; i < this.partitions.length; i++ ) {
        sinks[i] = mysink.deepClone();
        sinks[i].eof = function() {
          mysink.reduceI(this);
          pending--;
          if (pending <= 0) {
            mysink.eof && mysink.eof();
            future.set(originalsink);
          }
        };
      }

      for ( var i = 0; i < this.partitions.length; i++ ) {
        this.partitions[i].select(sinks[i], myoptions);
      }

      return future.get;
    }
  }
});


FOAModel({
  name: 'ActionFactoryDAO',
  extendsModel: 'ProxyDAO',
  label: 'ActionFactoryDAO',

  properties: [
    {
      name: 'actionDao',
      type: 'DAO',
      hidden: true,
      required: true
    }
  ],

  methods: {
    put: function(value, sink) {
      var self = this;
      aseq(
        function(ret) {
          self.delegate.find(value.id, {
            put: function(obj) {
              ret(obj);
            },
            error: function() { ret(); }
          });
        },
        function(ret, existing) {
          if (existing) {
            existing.writeActions(
              value,
              self.actionDao.put.bind(self.actionDao));
          } else if (value.model_.createActionFactory) {
            value.model_.createActionFactory(function(actions) {
              for (var j = 0; j < actions.length; j++)
                self.actionDao.put(actions[j]);
            }, value);
          }
          self.delegate.put(value, sink);
          ret();
        })(function() {});
    },
    remove: function(value, sink) {
      if (value.model_.deleteActionFactory) {
        var actions = value.model_.deleteActionFactory(value);
        for (var j = 0; j < actions.length; j++)
          this.actionDao.put(actions[j]);
      }
      this.delegate.remove(value, sink);
    }
  }
});


// TODO Why is this even a DAO, it literally only does find.
FOAModel({
  name: 'BlobReaderDAO',

  properties: [
    {
      name: 'blob',
      type: 'Blob',
      required: true
    }
  ],
  methods: {
    put: function(value, sink) {
      sink && sink.error && sink.error("Unsupported");
    },

    remove: function(query, sink) {
      sink && sink.error && sink.error("Unsupported");
    },

    select: function(query, sink) {
      sink = sink || [];
      sink && sink.error && sink.error("Unsupported");
    },

    find: function(key, sink) {
      var slice = this.blob.slice(key[0], key[0] + key[1]);
      var reader = new FileReader();
      reader.readAsText(slice);
      reader.onload = function(e) {
        sink && sink.put && sink.put(reader.result);
      };
      reader.onerror = function(e) {
        sink && sink.error && sink.error("find", e);
      };
    }
  }
});

FOAModel({
  name: 'GDriveDAO',
  properties: [
    {
      name: 'authtoken',
      label: 'Authentication Token'
    }
  ],

  methods: {
    put: function(value, sink) {
    },
    remove: function(query, sink) {
    },
    select: function(sink, options) {
      sink = sink || [];
      var xhr = new XMLHttpRequest();
      var params = [
        'maxResults=10'
      ];
      xhr.open(
        'GET',
        "https://www.googleapis.com/drive/v2/files?" + params.join('&'));
      xhr.setRequestHeader('Authorization', 'Bearer ' + this.authtoken);

      xhr.onreadystatechange = function() {
        if (xhr.readyState != 4) return;

        var response = JSON.parse(xhr.responseText);
        if (!response || !response.items) {
          sink && sink.error && sink.error(xhr.responseText);
          return;
        }

        for (var i = 0; i < response.items.length; i++) {
          sink && sink.put && sink.put(response.items[i]);
        }
      };
      xhr.send();
    },
    find: function(key, sink) {
    }
  }
});

FOAModel({
  name: 'RestDAO',
  extendsModel: 'AbstractDAO',

  properties: [
    {
      name: 'model',
      label: 'Type of data stored in this DAO.'
    },
    {
      name: 'url',
      label: 'REST API URL.'
    },
    {
      model_: 'ArrayProperty',
      subType: 'Property',
      name: 'paramProperties',
      help: 'Properties that are handled as separate parameters rather than in the query.'
    },
    {
      model_: 'IntProperty',
      name: 'batchSize',
      defaultValue: 200
    },
  ],

  methods: {
    jsonToObj: function(json) {
      return this.model.create(json);
    },
    objToJson: function(obj) {
      return JSONUtil.compact.stringify(obj);
    },
    buildURL: function(query) {
      return this.url;
    },
    buildFindURL: function(key) {
      return this.url + '/' + key;
    },
    buildPutURL: function(obj) {
      return this.url;
    },
    buildPutParams: function(obj) {
    },
    buildSelectParams: function(sink, query) {
      return [];
    },
    put: function(value, sink) {
      var self = this;
      var extra = {};
      this.X.ajsonp(this.buildPutURL(value),
             this.buildPutParams(value),
             "POST",
             this.objToJson(value, extra)
            )(
        function(resp, status) {
          if ( status !== 200 ) {
            sink && sink.error && sink.error([resp, status]);
            return;
          }
          var obj = self.jsonToObj(resp, extra);
          sink && sink.put && sink.put(obj);
          self.notify_('put', [obj]);
        });
    },
    remove: function(query, sink) {
    },
    select: function(sink, options) {
      sink = sink || [];
      var fut = afuture();
      var self = this;
      var limit;
      var index = 0;
      var fc = this.createFlowControl_();
      // TODO: This is a very ugly way of passing additional data
      // from buildURL to jsonToObj, used by the IssueCommentNetworkDAO
      // Clean this up.
      var extra = {};
      var params = [];

      if ( options ) {
        index += options.skip || 0;

        var query = options.query;
        var url;

        if ( query ) {
          var origQuery = query;
          query = query.normalize();

          var outquery = [query, origQuery.deepClone()];

          params = this.buildSelectParams(sink, outquery);

          url = this.buildURL(outquery, extra);

          query = outquery[0];
          origQuery = outquery[1];

          var mql = query.toMQL();
          if ( mql ) params.push('q=' + encodeURIComponent(query.toMQL()));
        } else {
          url = this.buildURL();
        }

        if ( options.order ) {
          var sort = options.order.toMQL();
          params.push("sort=" + sort);
        }

        if ( options.limit ) {
          limit = options.limit;
        }
      }

      var finished = false;
      awhile(
        function() { return !finished; },
        function(ret) {
          var batch = self.batchSize;

          if ( Number.isFinite(limit) )
            var batch = Math.min(batch, limit);

          // No need to fetch items for count.
          if ( CountExpr.isInstance(sink) ) {
            batch = 0;
          }

          var myparams = params.slice();
          myparams.push('maxResults=' + batch);
          myparams.push('startIndex=' + index);

          this.X.ajsonp(url, myparams)(function(data) {
            // Short-circuit count.
            // TODO: This count is wrong for queries that use
            if ( CountExpr.isInstance(sink) ) {
              sink.count = data.totalResults;
              finished = true;
              ret(); return;
            }

            var items = data && data.items ? data.items : [];

            // Fetching no items indicates EOF.
            if ( items.length == 0 ) finished = true;
            index += items.length;

            for ( var i = 0 ; i < items.length; i++ ) {
              var item = self.jsonToObj(items[i], extra)

              // Filter items that don't match due to
              // low resolution of Date parameters in MQL
              if ( origQuery && !origQuery.f(item) ) {
                continue;
              }

              if ( Number.isFinite(limit) ) {
                if ( limit <= 0 ) { finished = true; break; }
                limit--;
              }

              if ( fc.stopped ) { finished = true; break; }
              if ( fc.errorEvt ) {
                sink.error && sink.error(fc.errorEvt);
                finished = true;
                break;
              }

              sink && sink.put && sink.put(item, null, fc);
            }
            if ( limit <= 0 ) finished = true;
            if ( ! data || index === data.totalResults ) finished = true;
            ret();
          });
        })(function() { sink && sink.eof && sink.eof(); fut.set(sink); });

      return fut.get;
    },
    find: function(key, sink) {
      var self = this;
      this.X.ajsonp(this.buildFindURL(key))(function(data) {
        if ( data ) {
          sink && sink.put && sink.put(self.jsonToObj(data));
        } else {
          sink && sink.error && sink.error('No Network Response');
        }
      });
    }
  }
});


FOAModel({
  name: 'DefaultObjectDAO',
  help: 'A DAO decorator that will generate a default object if no object is found on a .find() call.',

  extendsModel: 'ProxyDAO',

  properties: [
    {
      name: 'factory',
      help: 'A factory method to construct the default object.'
    }
  ],

  methods: {
    find: function(q, sink) {
      var self = this;
      var mysink = {
        put: sink.put.bind(sink),
        error: function() {
          sink.put(self.factory(q));
        },
      };
      this.delegate.find(q, mysink);
    }
  }
});


FOAModel({
  name: 'LRUCachingDAO',

  extendsModel: 'ProxyDAO',

  properties: [
    {
      model_: 'IntProperty',
      name: 'maxSize',
      defaultValue: 30
    },
    {
      name: 'cacheFactory',
      defaultValueFn: function() { return MDAO; }
    },
    {
      name: 'cache',
      hidden: true
    },
  ],

  models: [
    {
      model_: 'Model',
      name: 'LRUCacheItem',
      ids: ['id'],
      properties: [
        {
          name: 'id',
        },
        {
          name: 'obj',
        },
        {
          model_: 'DateTimeProperty',
          name: 'timestamp'
        }
      ]
    }
  ],

  methods: {
    init: function(args) {
      this.SUPER();
      this.cache = this.cacheFactory.create({
        model: this.LRUCacheItem
      });
      var self = this;
      this.delegate.listen({
        remove: function(obj) {
          self.cache.remove(obj);
        }
      });
    },
    find: function(id, sink) {
      var self = this;
      this.cache.find(id, {
        put: function(obj) {
          obj.timestamp = new Date();
          self.cache.put(obj, {
            put: function() {
              sink && sink.put && sink.put(obj.obj);
            }
          });
        },
        error: function() {
          self.delegate.find(id, {
            put: function(obj) {
              self.cache.put(self.LRUCacheItem.create({
                id: id,
                timestamp: new Date(),
                obj: obj
              }), {
                put: function(obj) {
                  sink && sink.put && sink.put(obj.obj);
                  self.cleanup_();
                },
                error: function() {
                  sink && sink.error && sink.error.apply(sink, arguments);
                }
              });
            },
            error: function() {
              sink && sink.error && sink.error.apply(sink, arguments);
            }
          });
        }
      });
    },
    put: function(obj, sink) {
      var self = this;
      this.cache.find(obj.id, {
        put: function(obj) {
          obj.timestamp = new Date();
          self.cache.put(obj, {
            put: function(obj) {
              self.delegate.put(obj.obj, sink);
            },
            error: function() {
              sink && sink.error && sink.error.apply(this, arguments);
            }
          });
        },
        error: function() {
          self.cache.put(self.LRUCacheItem.create({
            timestamp: new Date(),
            id: obj.id,
            obj: obj
          }), {
            put: function() {
              self.delegate.put(obj, sink);
              self.cleanup_();
            },
            error: function() {
              sink && sink.error && sink.error.apply(this, arguments);
            }
          });
        }
      });
    },
    remove: function(obj, sink) {
      if ( obj.id ) var id = obj.id;
      else id = obj;

      var self = this;
      this.cache.remove(obj.id, {
        put: function() {
          self.delegate.remove(obj, sink);
        },
        error: function() {
          sink && sink.error && sink.error('remove', obj);
        }
      });
    },
    removeAll: function(sink, options) {
      var self = this;
      this.delegate.removeAll({
        remove: function(obj) {
          self.cache.remove(obj.id, {
            remove: function() {
              sink && sink.remove && sink.remove(obj);
            },
            error: function() {
              // TODO: what's the right course of action here?
            }
          });
        },
        error: function() {
          sink && sink.error && sink.error.apply(sink, arguments);
        }
      }, options);
    },
    cleanup_: function() {
      // TODO: Use removeAll instead of select when
      // all DAOs respect skip in removeAll.
      var self = this;
      this.cache
        .orderBy(DESC(this.LRUCacheItem.TIMESTAMP))
        .skip(this.maxSize).select({
          put: function(obj) {
            self.cache.remove(obj);
          }
        });
    }
  }
});


FOAModel({
  name: 'LazyCacheDAO',

  extendsModel: 'ProxyDAO',

  properties: [
    {
      name: 'cache'
    }
  ],

  methods: {
    find: function(id, sink) {
      var self = this;

      var mysink = {
        put: sink.put.bind(sink),
        error: function() {
          self.delegate.find(id, {
            put: function(obj) {
              var args = arguments;
              self.cache.put(obj, {
                put: function() { sink.put.apply(sink, args); }
              });
            },
            error: function() {
              sink && sink.error && sink.error.apply(sink, arguments);
            }
          });
        }
      };

      this.cache.find(id, mysink);
    }
  }
});


FOAModel({
  name: 'PropertyOffloadDAO',
  extendsModel: 'ProxyDAO',

  properties: [
    {
      name: 'property'
    },
    {
      name: 'model'
    },
    {
      name: 'offloadDAO'
    },
    {
      model_: 'BooleanProperty',
      name: 'loadOnSelect'
    }
  ],

  methods: {
    put: function(obj, sink) {
      if ( obj.hasOwnProperty(this.property.name) ) {
        var offload = this.model.create({ id: obj.id });
        offload[this.property.name] = this.property.f(obj);
        obj[this.property.name] = '';
        this.offloadDAO.put(offload);
      }
      this.delegate.put(obj, sink);
    },

    select: function(sink, options) {
      if ( ! this.loadOnSelect ) return this.delegate.select(sink, options);

      var mysink = this.offloadSink(sink);
      return this.delegate.select(mysink, options);
    },

    offloadSink: function(sink) {
      var self = this;
      return {
        __proto__: sink,
        put: function(obj) {
          sink.put && sink.put.apply(sink, arguments);
          self.offloadDAO.find(obj.id, {
            put: function(offload) {
              if ( offload[self.property.name] )
                obj[self.property.name] = offload[self.property.name];
            }
          });
        },
      };
    },

    find: function(id, sink) {
      this.delegate.find(id, this.offloadSink(sink));
    }
  }
});


FOAModel({
  name: 'BlobSerializeDAO',
  extendsModel: 'ProxyDAO',

  properties: [
    {
      model_: 'ArrayProperty',
      name: 'properties',
      subType: 'Property'
    }
  ],

  methods: {
    serialize: function(ret, obj) {
      obj = obj.clone();
      var afuncs = [];
      for ( var i = 0, prop; prop = this.properties[i]; i++ ) {
        afuncs.push((function(prop) {
          return (function(ret) {
            if ( !obj[prop.name] ) {
              ret();
              return;
            }

            var reader = new FileReader();
            reader.onloadend = function() {
              var type = obj[prop.name].type;
              obj[prop.name] = 'data:' + type + ';base64,' + Base64Encoder.encode(new Uint8Array(reader.result));
              ret();
            }

            reader.readAsArrayBuffer(obj[prop.name]);
          });
        })(prop));
      }

      apar.apply(undefined, afuncs)(function() {
        ret(obj);
      });
    },

    deserialize: function(obj) {
      for ( var i = 0, prop; prop = this.properties[i]; i++ ) {
        var value = prop.f(obj);
        if ( !value ) continue;
        var type = value.substring(value.indexOf(':') + 1,
                                   value.indexOf(';'));
        value = value.substring(value.indexOf(';base64') + 7);
        var decoder = Base64Decoder.create([]);
        decoder.put(value);
        decoder.eof();
        obj[prop.name] = new Blob(decoder.sink, { type: type });
      }
    },

    put: function(o, sink) {
      var self = this;
      this.serialize(function(obj) {
        self.delegate.put(obj, sink);
      }, o);
    },

    select: function(sink, options) {
      var self = this;
      var mysink = {
        __proto__: sink,
        put: function() {
          var args = Array.prototype.slice.call(arguments);
          self.deserialize(args[0]);
          sink.put.apply(sink, args);
        }
      };
      var args = Array.prototype.slice.call(arguments);
      args[0] = mysink;
      this.delegate.select.apply(this.delegate, args);
    },

    find: function(q, sink) {
      var self = this;
      var mysink = {
        __proto__: sink,
        put: function() {
          var args = Array.prototype.slice.call(arguments);
          self.deserialize(args[0]);
          sink.put.apply(sink, args);
        }
      };
      this.delegate.find(q, mysink);
    }
  }
});


FOAModel({
  name: 'NullDAO',
  help: 'A DAO that stores nothing and does nothing.',
  methods: {
    put: function(obj, sink) { sink && sink.put && sink.put(obj); },
    remove: function(obj, sink) { sink && sink.remove && sink.remove(obj); },
    select: function(sink) {
      sink && sink.eof && sink.eof();
      return aconstant(sink);
    },
    find: function(q, sink) { sink && sink.error && sink.error('find', q); },
    listen: function() {},
    removeAll: function() {},
    unlisten: function() {},
    pipe: function() {},
    where: function() { return this; },
    limit: function() { return this; },
  }
});


var WaitCursorDAO = FOAM({
  model_: 'Model',
  name: 'WaitCursorDAO',
  extendsModel: 'ProxyDAO',

  properties: [
    {
      name: 'count',
      defaultValue: 0,
      postSet: function(oldValue, newValue) {
        if ( ! this.window ) return;
        if ( oldValue == 0 ) DOM.setClass(this.window.document.body, 'waiting');
        else if ( newValue == 0 ) DOM.setClass(this.window.document.body, 'waiting', false);
      }
    },
    {
      name: 'window'
    }
  ],

  methods: {
    select: function(sink, options) {
      var self = this;
      var future = afuture();

      this.count++;
      var f = function() {
        self.delegate.select(sink, options)(function(sink) {
          try {
            future.set(sink);
          } finally {
          // ???: Do we need to call this asynchronously if count == 0?
            self.count--;
          }
        });
      };

      // Need to delay when turning on hourglass to give DOM a chance to update
      if ( this.count > 1 ) { f(); } else { this.window.setTimeout(f, 1); };

      return future.get;
    }
  }
});


FOAModel({
  name: 'EasyDAO',
  extendsModel: 'ProxyDAO',

  help: 'A facade for easy DAO setup.',

  properties: [
    {
      name: 'model'
    },
    {
      name: 'name',
      defaultValueFn: function() { return this.model.plural; }
    },
    {
      model_: 'BooleanProperty',
      name: 'seqNo',
      defaultValue: false
    },
    {
      name: 'seqProperty',
      type: 'Property'
    },
    {
      model_: 'BooleanProperty',
      name: 'cache',
      defaultValue: false
    },
    {
      model_: 'BooleanProperty',
      name: 'logging',
      defaultValue: false
    },
    {
      model_: 'BooleanProperty',
      name: 'timing',
      defaultValue: false
    },
    {
      name: 'daoType',
      defaultValue: 'IDBDAO'
    },
    {
      model_: 'BooleanProperty',
      name: 'autoIndex',
      defaultValue: false
    }
  ],

  methods: {
    init: function() {
      this.SUPER();

      var daoModel = typeof this.daoType === 'string' ? GLOBAL[this.daoType] : this.daoType;
      var params = { model: this.model, autoIndex: this.autoIndex };

      if ( this.name  ) params.name = this.name;
      if ( this.seqNo ) params.property = this.seqProperty;

      var dao = daoModel.create(params);

      if ( MDAO.isInstance(dao) ) {
        this.mdao = dao;
      } else if ( this.cache ) {
        this.mdao = MDAO.create(params);
        dao = CachingDAO.create(this.mdao, dao);
      }

      if ( this.seqNo ) {
        dao = SeqNoDAO.create({__proto__: params, delegate: dao});
        if ( this.seqProperty ) dao.property = this.seqProperty;
      }

      if ( this.timing  ) dao = TimingDAO.create(this.name + 'DAO', dao);
      if ( this.logging ) dao = LoggingDAO.create(dao);

      this.delegate = dao;
    },

    addIndex: function() {
      this.mdao && this.mdao.addIndex.apply(this.mdao, arguments);
    },

    addRawIndex: function() {
      this.mdao && this.mdao.addRawIndex.apply(this.mdao, arguments);
    },

  }
});


// Experimental, convert all functions into sinks
Function.prototype.put    = function() { this.apply(this, arguments); };
Function.prototype.remove = function() { this.apply(this, arguments); };
//Function.prototype.error  = function() { this.apply(this, arguments); };
//Function.prototype.eof    = function() { this.apply(this, arguments); };
