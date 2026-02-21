const fs = require('fs');
const path = require('path');
const readline = require('readline');

const workspaceRoot = path.resolve(__dirname, '..');
const inputDir = path.join(workspaceRoot, 'data', 'ag_news');
const outputFile = path.join(inputDir, 'documents.jsonl');
const inputFiles = ['train.csv', 'test.csv'];

const parseCsvLine = (line) => {
  const fields = [];
  let current = '';
  let index = 0;
  let inQuotes = false;

  while (index < line.length) {
    const ch = line[index];

    if (ch === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 2;
        continue;
      }

      inQuotes = !inQuotes;
      index += 1;
      continue;
    }

    if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
      index += 1;
      continue;
    }

    current += ch;
    index += 1;
  }

  fields.push(current);
  return fields;
};

const normalize = (value) => value.replace(/\s+/g, ' ').trim();

const run = async () => {
  if (!fs.existsSync(inputDir)) {
    throw new Error(`Input folder not found: ${inputDir}`);
  }

  const writer = fs.createWriteStream(outputFile, { encoding: 'utf8' });
  let total = 0;

  for (const inputName of inputFiles) {
    const filePath = path.join(inputDir, inputName);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const reader = readline.createInterface({
      input: fs.createReadStream(filePath, { encoding: 'utf8' }),
      crlfDelay: Infinity
    });

    for await (const line of reader) {
      if (!line || !line.trim()) {
        continue;
      }

      const [label, rawTitle = '', rawDescription = ''] = parseCsvLine(line);
      const title = normalize(rawTitle).slice(0, 300);
      const content = normalize(rawDescription).slice(0, 10000);

      if (!title || !content) {
        continue;
      }

      const record = {
        title,
        content,
        source: 'AG News',
        category: Number(label)
      };

      writer.write(`${JSON.stringify(record)}\n`);
      total += 1;
    }
  }

  writer.end();

  await new Promise((resolve) => writer.on('finish', resolve));
  console.log(`Wrote ${total} records to ${outputFile}`);
};

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
