// Every raw file is written as { source, url, retrievedAt, params, data }.
// `data` is the unmodified response body. No transformation at pull time.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function writeEnvelope(path, { source, url, params = {}, data, retrievedAt }) {
  const envelope = { source, url, retrievedAt: retrievedAt ?? new Date().toISOString(), params, data };
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(envelope, null, 2) + '\n');
  return envelope;
}

export async function readEnvelope(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

export async function writeJson(path, obj) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(obj, null, 2) + '\n');
}
