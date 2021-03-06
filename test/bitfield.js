var tap = require("tap");
var test = tap.test;
var Buffer = require('../lib/buffer');
var Bitfield;
var Desc;

test('load', function(t){
  t.ok(Bitfield = require('../lib/bitfield'), 'BitfieldType loaded');
  t.end();
});

test('constructor properties', function(t){
  Desc = new Bitfield('DescriptorFlags', {
    ENUMERABLE   : 1,
    CONFIGURABLE : 2,
    READONLY     : 3,
    WRITABLE     : 4,
    FROZEN       : 5,
    HIDDEN       : 6,
    NOTPRIVATE   : 7,
  }, 1);
  t.equal(typeof Desc, 'function', 'ctor is function');
  t.equal(Desc.name, 'DescriptorFlags', 'named');
  t.equal(Desc.bytes, 1, 'correct bytes');
  t.equal(Desc.__proto__, Bitfield.prototype, 'ctor inherits from numeric.prototype');
  t.equal(Desc+'', '[object Type]', 'toString shows class "Type"');
  t.end();
});

test('prototype properties', function(t){
  t.equal(Desc.bytes, Desc.prototype.bytes, 'prototype bytes match constructor bytes');
  t.equal(Desc.prototype.__proto__, Bitfield.prototype.prototype, 'prototype inherits from numeric.prototype.prototype');
  t.equal(Desc.prototype.DataType, 'bitfield', 'DataType is correct');
  t.equal(Desc.prototype+'', '[object Data]', 'toString shows class "Data"');
  t.end();
});

test('flags', function(t){
  var desc = new Desc({ HIDDEN: true });
  t.ok(desc, 'constructed');
  t.equal(desc.__proto__, Desc.prototype, 'instance inherits from ctor.prototype');
  t.equal(JSON.stringify(desc.reify()), '{"ENUMERABLE":false,"CONFIGURABLE":true,"READONLY":true,"WRITABLE":true,"FROZEN":true,"HIDDEN":true,"NOTPRIVATE":true}', 'reifies to correct keys and values');
  t.equal(desc.buffer.length, 1, 'buffer is correct size');
  t.equal(desc.buffer[0], 6, 'buffer value matches given value');

  t.equal(desc+'', '011', 'toString shows correct bits');
  desc.READONLY = false;
  t.equal(desc+'', '001', 'flag accessor correctly sets multiple bits');
  desc[0] = true;
  t.equal(desc+'', '101', 'index accessor correctly sets bit');
  t.end();
});
