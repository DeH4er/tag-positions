/*
 * app
 * [count=1]
 * [every=count*1000+500]
 * [rect='0 0 500 500']
 * [tag='TAG1']
 * [url='...']
 * [times='unlimited']
 */

import { interval } from 'rxjs';
import { take } from 'rxjs/operators';

import axios from 'axios';
import { argv } from 'yargs';

const count = argv.count || 1;
const every = argv.every || count * 1000 + 500;
const rect = argv.rect || '0 0 500 500';
const tag = argv.tag || 'TAG1';
const url = argv.url || "http://localhost:8030/api/config/tag_positions";
const times = argv.times || 'unlimited';

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

const makeRequest = (url, obj) => {
  axios.post(url, obj)
    .catch( err => console.error('error'));
};

const generateObject = (tag, positions) => {
  const data = positions.flat().reduce( (acc, val) => acc + val, []);
  return { devaddr: tag, data: data };
}

const run = () => {
  const pos = generatePositions(count, minx, miny, maxx, maxy);
  const obj = generateObject(tag, pos);
  makeRequest(url, obj);
}

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
