var ffi = require('../ffi');
var u = require('./utility');
var D = u.descriptor;
var Pointer = ffi.Pointer;

var Type = require('./genesis').Type;
var Data = require('./genesis').Data;
var NumberBlock = require('./blocks').NumberBlock;
var ArrayType = require('./array');
var pointerMethods = require('./blocks').pointerMethods;

var sizes = ffi.Bindings.TYPE_SIZE_MAP;

function sizeOf(type){
  return sizes[type];
}
Data.sizeOf = sizeOf;

var ffiTypes =
[ 'UInt8', 'Int8', 'Int16', 'UInt16', 'Int32', 'UInt32', 'Int64', 'UInt64', 'Float'  , 'Double' ];
[ 'uint8', 'int8', 'int16', 'uint16', 'int32', 'uint32', 'int64', 'uint64', 'float32', 'float64'].forEach(function(type, i){
  exports[type] = setupDataType(type);
  pointerMethods(type, ffiTypes[i]);
});


/**
 * Template reused below.
 */
function NumericType(v){
  var x = type._Cast(v);
  var R = new NumberBlock(name, x);
  return type._Reify(R);
}


/**
 * This function ecapsulates the setup for both the Type and Data of a given number type
 */
function setupDataType(name){

  // #########################################
  // ### Numeric Type instance constructor ###
  // #########################################

  var type = eval(('('+NumericType+')').replace('NumericType', name));
  type.__proto__ = Type;

  /**
   * Takes a value and returns a wrapped Data reference
   */
  function Convert(val){
    if (typeof val === 'boolean') {
      val = new NumberBlock(name, +val);
    } else if (val._DataType === 'int64' || val._DataType === 'uint64') {
      val = val._Value;
    } else if (typeof val === 'number') {
      val = new NumberBlock(name, val);
    } else {
      throw new TypeError('Invalid value');
    }
    return Reference(val);
  }

  function IsSame(u){
    // Not quite clear on this one yet

    // return type === u._DataType;  ?
    // - or -
    // return type._DataType === u._DataType._DataType;  ?
    // - or -
    return type._DataType === u._DataType;
  }

  /**
   * Converts another type to this one, returning the value or wrapped 64 bit value
   */
  function Cast(val){
    if (typeof n === 'string' && n > 0) n = +n;
    try {
      var V = type._Convert(val);
      return V._Value.deref();
    } catch (e) {}

    if (val === Infinity || val !== val) { //NaN
      return 0;
    } else if (typeof val === 'number') {
      return type._CCast(val);
    } else if (val._DataType._DataType === 'int64' || val._DataType._DataType === 'uint64') {
      return type._CCast(val._Value);
    }
    throw new TypeError('Type not castable');
  }

  /**
   * Similar to C++ reinterpret_cast. Doesn't modify byte structure, just rewraps it as another type.
   */
  function CCast(n) {
    if (typeof n === 'string' && n > 0) n = +n;
    var byteSize = u.bitsFor(n) / 8;
    if (byteSize > type.bytes) throw new RangeError('This many bytes is too big, get less bytes');
    return new NumberBlock(name, n);
  }

  /**
   * Turn a reference back into a normal js value (or still wrapped in the case of 64 bit ints)
   */
  function Reify(R) {
    var x = R.deref();
    if (name === 'uint64' || name === 'int64') {
      return Reference(new NumberBlock(name, x));
    } else {
      return x;
    }
  }

  /**
   * Most of these functions (any with `_`) would ostensibly not be directly exposed to JS, rather be triggered
   * during various proxies for normal js'ish usage. This is a prime target for wrapping using Harmony Proxies.
   */
  Object.defineProperties(type, {
    _Class:    D.___('DataType'),
    _DataType: D.___(name),
    _Convert:  D.___(Convert),
    _Cast:     D.___(Cast),
    _CCast:    D.___(CCast),
    _Reify:    D.___(Reify),
    _IsSame:   D.___(IsSame),
    bytes:     D.E__(sizeOf(name))
  });



  /**
   * Builds a Data instance for this type, given an input JS value.
   */
  function Reference(val){
    var data = function(){}

    return Object.defineProperties(data, {
      _Class:    D.___('Data'),
      _Value:    D.___(val),
      _DataType: D.___(type),
    });
  }

  return type;
}

