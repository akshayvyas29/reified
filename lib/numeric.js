"use strict";

var D            = require('./utility').desc;
var sLoop        = require('./utility').sLoop;
var bits         = require('./utility').bits;
var Type         = require('./genesis').Type;
var lookupType   = require('./genesis').lookupType;
var NumericSubtype = require('./genesis').Subtype.bind(NumericType);


module.exports = NumericType;


var types = {
     Int8: 1,
    UInt8: 1,
    Int16: 2,
   UInt16: 2,
    Int32: 4,
   UInt32: 4,
    Float: 4,
   Double: 8,
};


/**
 * Coerce to number when appropriate and verify number against type storage
 */
function checkType(type, val){
  if (val && val.DataType) {
    if (val.DataType === 'numeric' && val.Subtype === 'Int64' || val.Subtype === 'UInt64') {
      if (type === 'Int64' || type === 'UInt64') {
        return val;
      } else {
        throw new RangeError(val + ' exceeds '+type+' capacity');
      }
    } else if (val.DataType === 'array' || val.DataType === 'struct') {
      if (val.bytes > types[type][0]) {
        throw new RangeError(val + ' exceeds '+type+' capacity');
      } else {
        val = val.reify();
      }
    } else {
      val = val.reify();
    }
  }
  if (isFinite(val)) {
    val = +val;
  } else {
    throw new TypeError('Invalid value for ' + type + ': ' + val.DataType);
  }
  if (val && bits(val) / 8 > types[type][0]) {
    throw new RangeError(val + ' exceeds '+type+' capacity');
  }
  return val;
}



// ###############################
// ### NumericType Constructor ###
// ###############################

function NumericType(name, bytes){

  // ############################
  // ### NumericT Constructor ###
  // ############################

  function NumericT(buffer, offset, value){
    if (typeof buffer === 'number' || !buffer) {
      value = buffer;
      buffer = null;
    }
    this.rebase(buffer);
    this.realign(offset);

    if (value != null) {
      this.write(value);
    }
  }

  // #####################
  // ### NumericT Data ###
  // #####################

  NumericT.prototype = {
    Subtype: name,
    write: function write(v){ this.buffer['write'+name](checkType(this.Subtype, v), this.offset); return this; },
    reify: function reify(){ return this.buffer['read'+name](this.offset) },
  };

  return NumericSubtype(name, bytes, NumericT);
}


// ########################
// ### NumericType Data ###
// ########################

Type(NumericType, {
  DataType: 'numeric',
  fill: function fill(v){ this.write(v || 0) },
  realign: function realign(offset){
    Object.defineProperty(this, 'offset', D._CW(offset ||  0));
  },
});


Object.keys(types).forEach(function(name){
  NumericType[name] = new NumericType(name, types[name]);
});

var ArrayType = require('./array');

NumericType.UInt64 = new ArrayType('UInt64', 'UInt32', 2);
NumericType.Int64 = new ArrayType('Int64', 'Int32', 2);

var OctetString = new ArrayType('EightByteOctetString', 'UInt8', 8);

function octets(){ return new OctetString(this.buffer, this.offset) }
NumericType.UInt64.prototype.octets = octets;
NumericType.Int64.prototype.octets = octets;
