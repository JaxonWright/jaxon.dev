import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { spawnSync } from 'child_process';

const script = resolve(import.meta.dirname, 'fetch-contributions.mjs');

function runIfMissing(file) {
  return spawnSync(process.execPath, [script, '--if-missing'], {
    env: { ...process.env, CONTRIBUTIONS_OUT: file, GITHUB_TOKEN: '' },
    encoding: 'utf8',
  });
}

test('--if-missing sorts an existing contributions file by stars without refetching', () => {
  const dir = mkdtempSync(join(tmpdir(), 'contrib-'));
  const file = join(dir, 'contributions.json');
  const original = {
    author: 'JaxonWright',
    fetchedAt: '2020-01-01T00:00:00.000Z',
    repos: [
      { repo: 'b/low', stars: 1, prs: [] },
      { repo: 'm/tie', stars: 3, prs: [] },
      { repo: 'a/tie', stars: 3, prs: [] },
      { repo: 'z/high', stars: 10, prs: [] },
    ],
  };
  writeFileSync(file, JSON.stringify(original, null, 2) + '\n');

  const result = runIfMissing(file);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const data = JSON.parse(readFileSync(file, 'utf8'));
  assert.deepEqual(data.repos.map(r => r.repo), ['z/high', 'a/tie', 'm/tie', 'b/low']);
  assert.equal(data.fetchedAt, original.fetchedAt);
  assert.deepEqual(data.repos.map(r => r.stars), [10, 3, 3, 1]);

  const sorted = readFileSync(file, 'utf8');
  const again = runIfMissing(file);
  assert.equal(again.status, 0, again.stderr || again.stdout);
  assert.equal(readFileSync(file, 'utf8'), sorted);
});
