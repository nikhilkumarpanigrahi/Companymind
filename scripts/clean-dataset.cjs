const fs = require('fs');
const path = require('path');
const readline = require('readline');

const workspaceRoot = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const value = args.find((arg) => arg.startsWith(`${name}=`));
  if (!value) {
    return fallback;
  }
  return value.slice(name.length + 1);
};

const inputFile = path.resolve(
  getArg('--input', path.join(workspaceRoot, 'data', 'ag_news', 'documents.jsonl'))
);
const outputFile = path.resolve(
  getArg('--output', path.join(workspaceRoot, 'data', 'ag_news', 'documents.cleaned.jsonl'))
);

const normalizeText = (value) => {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\\[nrt]/g, ' ')
    .replace(/\\+/g, ' ')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const cleanTitle = (title) => normalizeText(title).slice(0, 300);
const cleanContent = (content) => normalizeText(content).slice(0, 10000);

const isValid = (record) => {
  return (
    record &&
    typeof record.title === 'string' &&
    typeof record.content === 'string' &&
    record.title.length > 0 &&
    record.content.length > 0
  );
};

const run = async () => {
  if (!fs.existsSync(inputFile)) {
    throw new Error(`Input file not found: ${inputFile}`);
  }

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });

  const reader = readline.createInterface({
    input: fs.createReadStream(inputFile, { encoding: 'utf8' }),
    crlfDelay: Infinity
  });
  const writer = fs.createWriteStream(outputFile, { encoding: 'utf8' });

  let total = 0;
  let kept = 0;
  let invalid = 0;
  let duplicates = 0;
  const seen = new Set();

  for await (const line of reader) {
    if (!line || !line.trim()) {
      continue;
    }

    total += 1;

    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch {
      invalid += 1;
      continue;
    }

    const record = {
      title: cleanTitle(parsed.title),
      content: cleanContent(parsed.content),
      source: parsed.source || 'AG News',
      category: Number(parsed.category) || null
    };

    if (!isValid(record)) {
      invalid += 1;
      continue;
    }

    const fingerprint = `${record.title}||${record.content}`;
    if (seen.has(fingerprint)) {
      duplicates += 1;
      continue;
    }

    seen.add(fingerprint);
    writer.write(`${JSON.stringify(record)}\n`);
    kept += 1;
  }

  writer.end();
  await new Promise((resolve) => writer.on('finish', resolve));

  console.log(`Input records: ${total}`);
  console.log(`Kept records: ${kept}`);
  console.log(`Removed duplicates: ${duplicates}`);
  console.log(`Removed invalid: ${invalid}`);
  console.log(`Output: ${outputFile}`);
};

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
