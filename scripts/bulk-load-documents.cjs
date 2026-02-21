const fs = require('fs');
const path = require('path');
const readline = require('readline');
const axios = require('axios');

const workspaceRoot = path.resolve(__dirname, '..');
const cleanedDefaultFile = path.join(workspaceRoot, 'data', 'ag_news', 'documents.cleaned.jsonl');
const rawDefaultFile = path.join(workspaceRoot, 'data', 'ag_news', 'documents.jsonl');

const defaults = {
  file: fs.existsSync(cleanedDefaultFile) ? cleanedDefaultFile : rawDefaultFile,
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8080',
  endpoint: '/documents',
  batchSize: 25,
  maxRetries: 3,
  retryDelayMs: 500,
  requestTimeoutMs: 20000,
  maxRecords: 0,
  dryRun: false,
  failedOutput: path.join(workspaceRoot, 'data', 'ag_news', 'failed-documents.jsonl')
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = { ...defaults };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg.startsWith('--file=')) {
      options.file = path.resolve(arg.split('=').slice(1).join('='));
      continue;
    }

    if (arg.startsWith('--api-base-url=')) {
      options.apiBaseUrl = arg.split('=').slice(1).join('=');
      continue;
    }

    if (arg.startsWith('--batch-size=')) {
      options.batchSize = Number(arg.split('=').slice(1).join('='));
      continue;
    }

    if (arg.startsWith('--max-retries=')) {
      options.maxRetries = Number(arg.split('=').slice(1).join('='));
      continue;
    }

    if (arg.startsWith('--retry-delay-ms=')) {
      options.retryDelayMs = Number(arg.split('=').slice(1).join('='));
      continue;
    }

    if (arg.startsWith('--max-records=')) {
      options.maxRecords = Number(arg.split('=').slice(1).join('='));
      continue;
    }

    if (arg.startsWith('--failed-output=')) {
      options.failedOutput = path.resolve(arg.split('=').slice(1).join('='));
    }
  }

  if (!Number.isInteger(options.batchSize) || options.batchSize < 1 || options.batchSize > 200) {
    throw new Error('batch-size must be an integer between 1 and 200');
  }

  if (!Number.isInteger(options.maxRetries) || options.maxRetries < 0 || options.maxRetries > 10) {
    throw new Error('max-retries must be an integer between 0 and 10');
  }

  if (!Number.isInteger(options.retryDelayMs) || options.retryDelayMs < 100 || options.retryDelayMs > 60000) {
    throw new Error('retry-delay-ms must be an integer between 100 and 60000');
  }

  if (!Number.isInteger(options.maxRecords) || options.maxRecords < 0) {
    throw new Error('max-records must be a non-negative integer');
  }

  return options;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const validateRecord = (record) => {
  if (!record || typeof record !== 'object') {
    return false;
  }

  if (typeof record.title !== 'string' || typeof record.content !== 'string') {
    return false;
  }

  const title = record.title.trim();
  const content = record.content.trim();

  return title.length > 0 && content.length > 0 && title.length <= 300 && content.length <= 10000;
};

const sanitizeRecord = (record) => ({
  title: String(record.title || '').trim().slice(0, 300),
  content: String(record.content || '').trim().slice(0, 10000)
});

const readJsonl = async (filePath, maxRecords) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Input file not found: ${filePath}`);
  }

  const records = [];
  const invalid = [];
  const reader = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity
  });

  let lineNumber = 0;
  for await (const line of reader) {
    lineNumber += 1;

    if (!line || !line.trim()) {
      continue;
    }

    try {
      const parsed = JSON.parse(line);
      const record = sanitizeRecord(parsed);
      if (validateRecord(record)) {
        records.push(record);
      } else {
        invalid.push({ lineNumber, reason: 'validation failed', line });
      }
    } catch (error) {
      invalid.push({ lineNumber, reason: 'invalid json', line });
    }

    if (maxRecords > 0 && records.length >= maxRecords) {
      break;
    }
  }

  return { records, invalid };
};

const postWithRetry = async (client, url, payload, maxRetries, retryDelayMs) => {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      await client.post(url, payload);
      return { ok: true };
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message || 'unknown error';
      const retryable = !status || status >= 500 || status === 429;

      if (!retryable || attempt === maxRetries) {
        return {
          ok: false,
          status,
          message
        };
      }

      const delay = retryDelayMs * 2 ** attempt;
      await sleep(delay);
      attempt += 1;
    }
  }

  return { ok: false, message: 'retry loop ended unexpectedly' };
};

const logProgress = ({ done, total, startTime, success, failed }) => {
  const elapsedSeconds = Math.max((Date.now() - startTime) / 1000, 0.001);
  const rate = (done / elapsedSeconds).toFixed(2);
  const percent = ((done / total) * 100).toFixed(1);
  process.stdout.write(`\rProcessed ${done}/${total} (${percent}%) | success=${success} failed=${failed} | ${rate}/s`);
};

const writeFailedRecords = (outputPath, failedRecords) => {
  if (!failedRecords.length) {
    return;
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const content = failedRecords.map((entry) => JSON.stringify(entry)).join('\n') + '\n';
  fs.writeFileSync(outputPath, content, 'utf8');
};

const run = async () => {
  const options = parseArgs();
  const { records, invalid } = await readJsonl(options.file, options.maxRecords);

  if (!records.length) {
    throw new Error('No valid records found to load');
  }

  console.log(`Loaded ${records.length} valid records from ${options.file}`);
  if (invalid.length) {
    console.log(`Skipped ${invalid.length} invalid lines during parsing`);
  }

  if (options.dryRun) {
    console.log('Dry run enabled. No API requests were sent.');
    return;
  }

  const client = axios.create({ timeout: options.requestTimeoutMs });
  const targetUrl = `${options.apiBaseUrl.replace(/\/$/, '')}${options.endpoint}`;

  let success = 0;
  let failed = 0;
  let done = 0;
  const failedRecords = [];
  const startTime = Date.now();

  for (let offset = 0; offset < records.length; offset += options.batchSize) {
    const batch = records.slice(offset, offset + options.batchSize);

    for (const record of batch) {
      const result = await postWithRetry(
        client,
        targetUrl,
        record,
        options.maxRetries,
        options.retryDelayMs
      );

      if (result.ok) {
        success += 1;
      } else {
        failed += 1;
        failedRecords.push({
          record,
          error: {
            status: result.status || null,
            message: result.message || 'request failed'
          }
        });
      }

      done += 1;
      logProgress({ done, total: records.length, startTime, success, failed });
    }
  }

  process.stdout.write('\n');

  if (failedRecords.length) {
    writeFailedRecords(options.failedOutput, failedRecords);
  }

  console.log(`Completed load. success=${success} failed=${failed}`);
  if (failedRecords.length) {
    console.log(`Failed records written to ${options.failedOutput}`);
  }
};

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
