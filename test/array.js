var tap = require("tap");
var test = tap.test;
var ArrayType;
var ArrayT;

test('load', function(t){
  t.ok(ArrayType = require('../lib/array'), 'ArrayType loaded');
  t.ok(require('../'), 'reified loaded');
  t.end();
});

test('constructor properties', function(t){
	ArrayT = new ArrayType('Int8', 10);
  t.equal(typeof ArrayT, 'function', 'ctor is function');
  t.equal(ArrayT.name, 'Int8x10', 'named correctly');
  t.equal(ArrayT.bytes, 10, 'correct bytes');
  t.equal(ArrayT.__proto__, ArrayType.prototype, 'ctor inherits from ArrayType.prototype');
  t.equal(ArrayT+'', '[object Type]', 'toString shows class "Type"');
  t.equal(ArrayT.prototype.DataType, 'array', 'prototype is correct DataType');
  t.equal(ArrayT.count, 10, 'array is correct length');
  t.end();
});


test('instance creation', function(t){
	var Int8x10 = new ArrayT;
  t.equal(Int8x10.constructor, ArrayT, 'constructor set correctly');
  t.equal(Int8x10.bytes, 10, 'correct bytes');
  t.equal(Int8x10.length, 10, 'correct length');
  t.equal(Object.keys(Int8x10)+'', '', 'indices not initialized');
  Int8x10[5];
  t.equal(Object.keys(Int8x10)+'', '5', 'accessing one index initializes only it');
  t.equal(Int8x10.reify()+'', '0,0,0,0,0,0,0,0,0,0', 'reifies to zero intialized values');
  t.equal(Object.keys(Int8x10)+'', '0,1,2,3,4,5,6,7,8,9', 'all indices initialized after reify');
  Int8x10.fill(1)
  t.equal(Int8x10.reify()+'', '1,1,1,1,1,1,1,1,1,1', 'fill with single number');
  Int8x10.write([10,20,30,40,50])
  t.equal(Int8x10.reify()+'', '10,20,30,40,50,1,1,1,1,1', 'writing array with smaller size only writes given values');
  Int8x10.buffer[0] = 100;
  t.equal(Int8x10.reify()+'', '100,20,30,40,50,1,1,1,1,1', 'reflects buffer changes');
  var clone = Int8x10.clone();
  clone[1] = 14;
  t.equal(clone.reify()+'', Int8x10.reify()+'', 'clone points to same data');
  var copy = Int8x10.copy();
  t.equal(copy.reify()+'', Int8x10.reify()+'', 'copy starts out matching');
  copy[0] = 5;
  t.notEqual(copy.reify()+'', Int8x10.reify()+'', 'and does not use same data');
  t.end();
});
