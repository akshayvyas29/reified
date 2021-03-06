"use strict";

var util       = require('util');
var D          = require('./utility').desc;
var sLoop      = require('./utility').sLoop;
var isObject   = require('./utility').isObject;
var inspectors = require('./utility').inspectors;
var ViewBuffer = require('./buffer');

var hasProto = !!Function.__proto__;
var types = {};


module.exports = {
  Type: Type,
  Subtype: Subtype,
  lookupType: lookupType,
  registerType: registerType,
  types: types,
};



function registerType(name, type){
  if (name in types) return types[name];
  if (name.length) return types[name] = type;
  return type;
}

function lookupType(name, label){
  if (typeof name === 'string') {
    if (name[name.length-1] === ']') {
      var count = name.match(/(.*)\[(\d+)\]$/);
      if (count) {
        name = count[1];
        count = +count[2];
        if (typeof label === 'string') {
          return new (require('./array'))(label, lookupType(name), count);
        } else {
          var type = lookupType(name);
          if (type === name) {
            return new (require('./array'))(name, count);
          } else {
            name = type.name + 'x' + count;
            return new (require('./array'))(name, type, count);
          }
        }
      }
    }
    return name in types ? types[name] : name;
  } else {
    return name;
  }
}


// ########################
// ### Genesis for Type ###
// ########################

function Type(ctor, proto){
  ctor.prototype = eval('(function Empty'+ctor.name.replace(/Type$/,'T')+'(){})');
  if (hasProto) {
    ctor.prototype.__proto__ = Type;
  } else {
    copy(Type, ctor.prototype);
  }
  ctor.prototype.constructor = ctor,
  ctor.prototype.inspect = inspectors('Type', ctor.name);
  proto.inspect = inspectors('Data', ctor.name);
  ctor.prototype.prototype = copy(proto, Object.create(Data));
}

copy({
  Class: 'Type',
  toString: function toString(){ return '[object Type]' },
  array: function array(n){ return new (require('./array'))(this, n) },
  isInstance: function isInstance(o){ return this.prototype.isPrototypeOf(o) },
}, Type);

sLoop(20, function(i){
  Object.defineProperty(Type, i, {
    configurable: true,
    get: function(){ return this.array(i) }
  });
});

function createInterface(type, name, ctor){
  var iface = Function(name+'Constructor', 'return function '+name+'(buffer, offset, values){ return new '+name+'Constructor(buffer, offset, values) }')(ctor);

  Object.defineProperty(iface, 'rename', D._CW(function rename(name){
    return ctor.prototype.constructor = createInterface(type, name, ctor);
  }));

  if (hasProto) {
    iface.__proto__ = type.prototype;
  } else {
    copy(type, iface);
  }

  iface.prototype = ctor.prototype;

  if (name) registerType(name, iface);
  return copy(ctor, iface);
}

function Subtype(name, bytes, ctor){
  ctor.bytes = bytes;
  ctor.prototype.bytes = bytes;
  ctor.prototype = copy(ctor.prototype, Object.create(this.prototype.prototype));
  return ctor.prototype.constructor = createInterface(this, name, ctor);
}


// ########################
// ### Genesis for Data ###
// ########################

var Data = Type.prototype = {
  Class: 'Data',
  toString: function toString(){ return '[object Data]' },
  rebase: function rebase(buffer){
    if (buffer == null) {
      buffer = new ViewBuffer(this.bytes);
      buffer.fill(0);
    } else {
      while (buffer.buffer) buffer = buffer.buffer;
      buffer = ViewBuffer.isInstance(buffer) ? buffer : new ViewBuffer(buffer);
    }
    Object.defineProperty(this, 'buffer', D._CW(buffer));
  },
  clone: function clone(){
    return new this.constructor(this.buffer, this.offset);
  },
  copy: function copy(buffer, offset){
    var copied = new this.constructor(buffer, offset);
    this.buffer.copy(copied.buffer, copied.offset, this.offset, this.offset + this.bytes);
    return copied;
  }
};


function copy(from, to, hidden){
  Object[hidden ? 'getOwnPropertyNames' : 'keys'](from).forEach(function(key){
    var desc = Object.getOwnPropertyDescriptor(from, key);
    desc.enumerable = false;
    Object.defineProperty(to, key, desc);
  });
  return to;
}