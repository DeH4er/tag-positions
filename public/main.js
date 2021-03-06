"use strict";

var _axios = _interopRequireDefault(require("axios"));

var _rxjs = require("rxjs");

var _operators = require("rxjs/operators");

var _yargs = require("yargs");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var count = _yargs.argv.count || 1;
var every = _yargs.argv.every || count * 1000 + 500;
var rect = _yargs.argv.rect || '0 0 500 500';
var tag = _yargs.argv.tag || 'TAG1';
var url = _yargs.argv.url || "http://localhost:8030/api/config/tag_positions";
var times = _yargs.argv.times || 'unlimited';
var start = _yargs.argv.start || null;
var end = _yargs.argv.end || null;
var step = _yargs.argv.step || null;
var coord = _yargs.argv.coord || null;
var lineStart = _yargs.argv.lineStart || null;
var interactive = _yargs.argv.interactive || 'false';

var _rect$split = rect.split(' '),
    _rect$split2 = _slicedToArray(_rect$split, 4),
    minx = _rect$split2[0],
    miny = _rect$split2[1],
    maxx = _rect$split2[2],
    maxy = _rect$split2[3];

var random = function random(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
};

var encode = function encode(num) {
  var res = (num + 0x10000).toString(16).substr(-4).toUpperCase();
  return res;
};

var generatePosition = function generatePosition(minx, miny, maxx, maxy) {
  var pure_x = random(minx, maxx);
  var pure_y = random(miny, maxy);
  var pure_z = 0;
  var x = encode(pure_x);
  var y = encode(pure_y);
  var z = encode(pure_z);
  console.log([pure_x, pure_y]);
  return [x, y, z];
};

var generatePositions = function generatePositions(count, minx, miny, maxx, maxy) {
  var positions = [];
  minx = +minx;
  miny = +miny;
  maxx = +maxx;
  maxy = +maxy;

  for (var i = 0; i < count; i++) {
    positions.push(generatePosition(minx, miny, maxx, maxy));
  }

  return positions;
};

var generateLineMotion = function generateLineMotion(coord, lineStart, start, end, step) {
  var positions = [];

  for (var i = start; i <= end; i += step) {
    var position = void 0;

    if (coord === 'x') {
      console.log([i, lineStart]);
      position = [encode(i), encode(lineStart), encode(0)];
    } else {
      console.log([lineStart, i]);
      position = [encode(lineStart), encode(i), encode(0)];
    }

    positions.push(position);
  }

  return positions;
};

var makeRequest = function makeRequest(url, obj) {
  _axios.default.post(url, obj).then(function () {
    console.log('request success');
  }).catch(function (err) {
    console.error('request error');
  });
};

var flat = function flat(list) {
  return list.reduce(function (a, b) {
    return a.concat(Array.isArray(b) ? flat(b) : b);
  }, []);
};

var generateObject = function generateObject(tag, positions) {
  var data = flat(positions).reduce(function (acc, val) {
    return acc + val;
  }, []);
  return {
    devaddr: tag,
    data: data
  };
};

var run = function run() {
  var pos = generatePositions(count, minx, miny, maxx, maxy);
  var obj = generateObject(tag, pos);
  makeRequest(url, obj);
};

if (interactive === 'true') {
  var stdin = process.stdin;
  stdin.setEncoding('utf-8');
  var input = (0, _rxjs.fromEvent)(stdin, 'data');
  console.log('quit: CTRL+c');
  var point$ = input.pipe((0, _operators.map)(function (line) {
    return line.split(' ');
  }), (0, _operators.filter)(function (nums) {
    return nums.length === 2;
  }), (0, _operators.tap)(function (nums) {
    return console.log('got point');
  }), (0, _operators.map)(function (p) {
    return [+p[0], +p[1]];
  }));
  point$.subscribe(function (point) {
    console.log(point);
    var encoded_point = [encode(point[0]), encode(point[1]), encode(0)];
    var req_obj = generateObject(tag, encoded_point);
    console.log(req_obj);
    makeRequest(url, req_obj);
  }, function (err) {
    return console.log(err);
  }, function () {
    return console.log('bye');
  });
} else if (start !== null && end !== null && step !== null && coord !== null && lineStart !== null) {
  var pos = generateLineMotion(coord, parseInt(lineStart), parseInt(start), parseInt(end), parseInt(step));
  var obj = generateObject(tag, pos);
  makeRequest(url, obj);
} else {
  run();
  var timer;

  if (times != 'unlimited') {
    timer = (0, _rxjs.interval)(every).pipe((0, _operators.take)(times - 1));
  } else {
    timer = (0, _rxjs.interval)(every);
  }

  timer.subscribe(function (x) {
    run();
  });
}