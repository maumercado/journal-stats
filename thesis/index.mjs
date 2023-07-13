import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const filePath = new URL('../data/demo.tsv', import.meta.url);
const absolutePath = fileURLToPath(filePath);

const file = await readFile(absolutePath, 'utf8');

const headers = file.split('\n')[0].split('\t');
const json = file.split('\n')
  .reduce((acc, curr, i) => {
    if (i === 0) return { ...acc }
    const row = curr.split('\t');
    const obj = row.reduce((acc, curr, j) => {
      if (curr === '') return;
      return { ...acc, [headers[j]]: curr }
    }, {})
    if (obj === undefined) return ({ ...acc });
    return { ...acc, [randomUUID()]: obj }
  }, {});

  console.log(json)
// up to here everything is a new trade, but is not taking into consideration adds into a trade.
