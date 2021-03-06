"use strict";

var D        = require('./utility').desc;
var bytesFor = require('./utility').bytes;
var bits     = require('./utility').bits;
var sLoop    = require('./utility').sLoop;
var isObject = require('./utility').isObject;
var Type     = require('./genesis').Type;
var BitfieldSubtype = require('./genesis').Subtype.bind(BitfieldType);

var views = [Uint8Array, Uint8Array, Uint16Array, Uint32Array, Uint32Array];
var powers = Array.apply(null, Array(32)).map(Function.call.bind(Number)).map(Math.pow.bind(null, 2));

module.exports = BitfieldType;

// ################################
// ### BitfieldType Constructor ###
// ################################

function BitfieldType(name, flags, bytes){
  if (typeof name !== 'string') {
    bytes = flags;
    flags = name;
    name = '';
  }
  if (typeof flags === 'number') {
    bytes = flags;
    flags = [];
  }

  if (Array.isArray(flags)) {
    flags = flags.reduce(function(ret, name, index){
      ret[name] = 1 << index;
      return ret;
    }, {});
  }

  if (!(bytes > 0)) {
    bytes = bytesFor(max(flags));
  }

  // #############################
  // ### BitfieldT Constructor ###
  // #############################

  function BitfieldT(buffer, offset, values) {
    if (!Buffer.isBuffer(buffer)) {
      values = buffer || 0;
      buffer = null;
    }
    this.rebase(buffer);
    this.realign(offset);

    if (Array.isArray(values)) {
      values.forEach(function(flag){ this[flag] = true }, this);
    } else if (typeof values === 'number') {
      this.write(values);
    } else if (isObject(values)){
      Object.keys(values).forEach(function(key){ this[key] = values[key] }, this);
    }
  };

  BitfieldT.flags = flags;

  // ######################
  // ### BitfieldT Data ###
  // ######################

  BitfieldT.prototype = {
    flags: flags,
    length: bytes * 8,
    toString: function toString(){ return this === BitfieldT.prototype ? '[object Data]' : this.map(function(v){ return +v }).join('') },
  };

  return defineFlags(BitfieldSubtype(name, bytes, BitfieldT));
}


function defineFlags(target) {
  Object.keys(target.flags).forEach(function(flag){
    var val = target.flags[flag];
    Object.defineProperty(target.prototype, flag, {
      configurable: true,
      enumerable: true,
      get: function( ){ return (this.view[0] & val) > 0 },
      set: function(v){ v ? this.view[0] |= val : this.view[0] &= ~val }
    })
  });
  sLoop(bits(max(target.flags))+1|0, function(i){
    var power = powers[i];
    Object.defineProperty(target.prototype, i, {
      configurable: true,
      enumerable: true,
      get: function( ){ return (this.view[0] & power) > 0 },
      set: function(v){ v ? this.view[0] |= power : this.view[0] &= ~power }
    });
  });
  return target;
}



// #########################
// ### BitfieldType Data ###
// #########################

Type(BitfieldType, {
  DataType: 'bitfield',
  forEach: Array.prototype.forEach,
  reduce: Array.prototype.reduce,
  map: Array.prototype.map,
  get: function get(i){ return (this.view[0] & powers[i]) > 0 },
  set: function get(i){ this.view[0] |= powers[i]; return this; },
  unset: function unset(index){ this.view[0] &= ~powers[i]; return this; },
  write: function write(v){ this.view[0] = v; return this; },
  read: function read(){ return this.view[0] },
  reify: function reify(){
    var flags = Object.keys(this.flags);
    if (flags.length) {
      return flags.reduce(function(ret, flag, i){
        ret[flag] = this[flag];
        return ret;
      }.bind(this), {});
    } else {
      return this.map(function(v){ return v });
    }
  },
  realign: function realign(offset){
    offset = offset || 0;
    Object.defineProperties(this, {
      offset: D._CW(offset),
      view: D._CW(new views[this.bytes](this.buffer, offset, 1))
    });
  },
});

function max(arr){
  if (Array.isArray(arr)) return arr.reduce(function(r,s){ return Math.max(s, r) }, 0);
  else return Object.keys(arr).reduce(function(r,s){ return Math.max(arr[s], r) }, 0);
}