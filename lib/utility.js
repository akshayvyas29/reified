//"use strict";

var util = require('util');

module.exports = {
  isObject: isObject,
  sLoop: sLoop,
  desc: desc,
  inspect: ins,
  color: color,
  enableColor: false,
  MAKE_ALL_ENUMERABLE: function makeEnumerable(){ desc.allEnumerable = true },
  bytes: bytes,
  bits: bits
};

function isObject(o){ return Object(o) === o }

function sLoop(n, cb){ return Array.apply(null, Array(n)).map(Function.call.bind(cb), this); }

function bits(n){ return Math.log(n) / Math.LN2 }
function bytes(n){ return ((bits(n) / 8) | 0) + 1 }


function desc(flags, value){
  return {
    value        : value,
    enumerable   : desc.allEnumerable || Boolean(flags & ENUMERABLE),
    configurable : Boolean(flags & CONFIGURABLE),
    writable     : Boolean(flags & WRITABLE),
  };
}

var PRIVATE      = 0,
    ENUMERABLE   = 1,
    CONFIGURABLE = 2,
    READONLY     = 3,
    WRITABLE     = 4,
    FROZEN       = 5,
    HIDDEN       = 6,
    NORMAL       = 7;

function attachFlags(o){
  o.___ = desc.bind(null, PRIVATE     );
  o.E__ = desc.bind(null, ENUMERABLE  );
  o._C_ = desc.bind(null, CONFIGURABLE);
  o.EC_ = desc.bind(null, READONLY    );
  o.__W = desc.bind(null, WRITABLE    );
  o.E_W = desc.bind(null, FROZEN      );
  o._CW = desc.bind(null, HIDDEN      );
  o.ECW = desc.bind(null, NORMAL      );
}

attachFlags(desc);



var names = [ 'black',   'red',      'green',  'yellow',
              'blue',    'magenta',  'cyan',   'white',
              'bblack',  'bred',     'bgreen', 'byellow',
              'bblue',   'bmagenta', 'bcyan',  'bwhite', ];

var colors = {};
var esc = '\u001b[';
for (var i = 16; i-- > 0;) {
  colors[names[i]] = [esc+(i > 7 ? '1;':'')+(i%8+30)+'m',
                      esc+(i > 7 ?'2;':'')+'39m']
}
for (var i = 0; i++ < 8;) {
  names.push('bg'+names[i]);
  colors['bg'+names[i]] = [esc+(i+40)+'m', esc+'49m']
}
for (var i = 0; i++ < 8;) {
  names.push('bg'+names[i+8]);
  colors['bg'+names[i+8]] = [esc+(i+100)+'m', esc+'25;49m']
}


function color(text, name, brackets){
  if (color.useColor) {
    return colors[name][0]+text+colors[name][1];
  } else {
    return brackets ? brackets[0]+text+brackets[1] : text;
  }
}

names.forEach(function(n){
  color[n] = function(t, b){ return color(t, n, b) }
})

function ins(object, depth, hidden, colors){
  module.exports.enableColor = require('repl').disableColor === false// || true;
  return util.inspect(object, hidden, depth||6, colors);
}

function indent(str, amount){
  var space = Array((amount||2)+1).join(' ');
  return str.split('\n').map(function(line){ return space+line }).join('\n');
}

function strlen(str){
  return str.replace(/\033\[(?:\d+;)*\d+m/g, '').length;
}

function pad(str, len){
  len -= strlen(str||'') + 1;
  return str + Array(len > 1 ? len : 1).join(' ');
}

function maxLength(array){
  if (!Array.isArray(array)) {
    if (!isObject(array)) throw new TypeError('Max length called on non-object ' + array);
    array = Object.keys(array);
  }
  return array.reduce(function(max, item){ return Math.max(max, strlen(''+item)) }, 0);
}


module.exports.inspectors = function(className, type){
  return function(depth){
    var settings = getSettings();
    color.useColor = settings.useColor = (process && process.stdout._type === 'tty') || (settings.stylize ? settings.stylize.name === 'stylizeWithColor' : false);
    return inspectors[className][type](this, settings.showHidden, depth, settings.useColor);
  }
}
var inspectors = {
  Type: {
    NumericType: function(object, showHidden, depth, useColor){
      return color.bmagenta(object.name, '‹›');
    },
    ArrayType: function(object, showHidden, depth, useColor){
      var label = color.byellow(object.name, '‹›') + color.bblue('('+object.bytes+'b)');
      var memberType = util.inspect(object.memberType, showHidden, depth-1, useColor);
      if (~memberType.indexOf('\n') || strlen(memberType) > 60) {
        label += '\n';
        memberType = indent(memberType).slice(2);
      } else {
        label + ' '
      }
      return label+'[ '+object.count+' '+memberType+' ]';
    },
    StructType: function(object, showHidden, depth, useColor){
      var length = 0;
      var fields = object.names.map(function(field){
        field = [color.bwhite(field), util.inspect(object.fields[field], showHidden, depth-1, useColor)];
        length += strlen(field[0]) + strlen(field[1]);
        return field;
      });

      var label = color.bcyan(object.name, '‹›') + color.bblue('('+object.bytes+'b)');
      if (length > 60) {
        var max = maxLength(object.names)+4;
        return label+'\n| '+fields.map(function(field){ return pad(color.bwhite(field[0]+':'), max) + field[1] }).join('\n| ');
      } else {
        return label+' { '+fields.map(function(field){ return color.bwhite(field[0]+': ')+field[1] }).join(' | ') + ' }';
      }
    },
    BitfieldType: function(object, showHidden, depth, useColor){
      var label = color.bgreen(object.name || 'Bitfield', '‹›') + color.bblue('('+object.bytes*8+'bit)');
      var flags = Object.keys(object.flags);
      if (!flags.length) {
        return label;
      } else {
        return label+'\n'+flags.map(function(flag){
          return '  '+pad(color.bgreen('0x'+object.flags[flag].toString(16)), Math.log(object.bytes+1.3)*10|0) + flag;
        }).join('\n');
      }
    }
  },
  Data: {
    NumericType: function(object, showHidden, depth, useColor){
      return color.magenta(object.Subtype, '<>')+' '+color.bmagenta(object.reify());
    },
    ArrayType: function(object, showHidden, depth, useColor){
      var fields = util.inspect(object.map(function(item){ return item }), showHidden, depth-1, useColor);
      var sep = strlen(fields) > 60 ? '\n' : ' ';
      return color.yellow(object.constructor.name, '<>')+sep+fields;
    },
    StructType: function(object, showHidden, depth, useColor){
      var length = 0;
      var fields = object.constructor.names.map(function(field){
        field = [field, util.inspect(object[field], showHidden, depth-1, useColor)];
        length += strlen(field[0]) + strlen(field[1]);
        return field;
      });

      var label = color.cyan(object.constructor.name, '<>');
      if (length > 60) {
        var max = maxLength(object.constructor.names)+4;
        return label + '\n| '+fields.map(function(field){ return pad(field[0]+': ', max) + field[1] }).join('\n| ');
      } else {
        return label+' { '+fields.map(function(field){ return field.join(': ') }).join(' | ') + ' }';
      }
    },
    BitfieldType: function(object, showHidden, depth, useColor){
      var label = color.green(object.constructor.name || 'Bitfield', '‹›');
      var flags = Object.keys(object.flags);
      if (!flags.length) {
        return label + '['+object+']';
      } else {
        var max = maxLength(object.flags)+4;
        return '{ '+label +'\n  ' + flags.map(function(flag, index){
          return pad(color.bwhite(flag+':'), max) + color.green(object[flag]);
        }).join(',\n  ') + ' }';
      }
    }
  }
};

function getSettings(){
  var caller = getSettings.caller;
  while (caller = caller.caller) {
    if (caller.name === 'formatValue') {
      return caller.arguments[0] || {};
    }
  }
  return {};
}