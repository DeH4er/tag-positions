/*
 * app
 * [count=1]
 * [every=count*1000+500]
 * [rect='0 0 500 500']
 * [tag='TAG1']
 * [url='...']
 * [times='unlimited']
 * [interactive='false']
 */

import axios from 'axios';
import { fromEvent, interval } from 'rxjs';
import { filter, map, take, tap } from 'rxjs/operators';
import { argv } from 'yargs';


const count = argv.count || 1;
const every = argv.every || count * 1000 + 500;
const rect = argv.rect || '0 0 500 500';
const tag = argv.tag || 'TAG1';
const url = argv.url || "http://localhost:8030/api/config/tag_positions";
const times = argv.times || 'unlimited';

const start = argv.start || null;
const end = argv.end || null;
const step = argv.step || null;
const coord = argv.coord || null;
const lineStart = argv.lineStart || null;

const interactive = argv.interactive || 'false';

const [minx, miny, maxx, maxy] = rect.split(' ');

const random = (min, max) => (Math.floor(Math.random() * (max - min)) + min);

const encode = (num) => {
  const res = ((num+0x10000).toString(16).substr(-4).toUpperCase())
  return res;
};

const generatePosition = (minx, miny, maxx, maxy) => {
  const pure_x = random(minx, maxx);
  const pure_y = random(miny, maxy);
  const pure_z = 0;
  const x = encode(pure_x);
  const y = encode(pure_y);
  const z = encode(pure_z);

  console.log([pure_x, pure_y]);

  return [x, y, z];
}

const generatePositions = (count, minx, miny, maxx, maxy) => {
  let positions = [];
  minx = +minx;
  miny = +miny;
  maxx = +maxx;
  maxy = +maxy;
  for (let i = 0; i < count; i++) {
    positions.push( generatePosition(minx, miny, maxx, maxy ));
  }

  return positions;
}

const generateLineMotion = (coord, lineStart, start, end, step) => {
  let positions = [];

  for (let i = start; i <= end; i += step) {
    let position;
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
}

const makeRequest = (url, obj) => {
  axios.post(url, obj)
    .then(() => {
      console.log('request success');
    })
    .catch( err => {
      console.error('request error')
    });
};

const flat = (list) => {
    return list.reduce(function (a, b) {
        return a.concat(Array.isArray(b) ? flat(b) : b);
    }, []);
};

const generateObject = (tag, positions) => {
  const data = flat(positions).reduce( (acc, val) => acc + val, []);
  return { devaddr: tag, data: data };
}

const run = () => {
  const pos = generatePositions(count, minx, miny, maxx, maxy);
  const obj = generateObject(tag, pos);
  makeRequest(url, obj);
}

if (interactive === 'true') {
  const stdin = process.stdin;
  stdin.setEncoding('utf-8');
  const input = fromEvent(stdin, 'data');

  console.log('quit: CTRL+c');

  const point$ = input.pipe(
    map( line => line.split(' ')),
    filter(nums => nums.length === 2),
    tap(nums => console.log('got point')),
    map( p => [+p[0], +p[1]])
  );

  point$
    .subscribe(
      point => {
        console.log(point);
        const encoded_point = [encode(point[0]), encode(point[1]), encode(0)]
        const req_obj = generateObject(tag, encoded_point)
        console.log(req_obj);
        makeRequest(url, req_obj);
      },
      err => console.log(err),
      () => console.log('bye')
    );
} else if (start !== null && end !== null && step !== null && coord !== null && lineStart !== null) {

  const pos = generateLineMotion(coord, parseInt(lineStart), parseInt(start), parseInt(end), parseInt(step));
  const obj = generateObject(tag, pos);
  makeRequest(url, obj);
} else {
  run();

  let timer;

  if (times != 'unlimited') {
    timer = interval(every)
      .pipe(
        take(times - 1)
      )
  } else {
    timer = interval(every)
  }

  timer.subscribe( x => {
    run();
  });
}
