import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {ARTICLE_LAYOUT_CAPABILITY,ARTICLE_COMPOSITION_CAPABILITY,ARTICLE_CELL_SPACING_CAPABILITY,ARTICLE_PROSE_COLUMN_CAPABILITY} from '../lib/layout.mjs';
const manifest=JSON.parse(fs.readFileSync(new URL('../layout-source-manifest.json',import.meta.url)));
test('current manifest binds exact generated validation snapshots and truthful source provenance',()=>{
 assert.match(manifest.sourceCommit,/^[a-f0-9]{40}$/);assert.equal(manifest.files.length,3);
 for(const file of manifest.files){const bytes=fs.readFileSync(new URL('../'+file.generated,import.meta.url)),text=bytes.toString();assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),file.generatedSha256);assert.match(file.sourceSha256,/^[a-f0-9]{64}$/);assert.ok(text.startsWith('// Validation/finite-contract snapshot from product '+manifest.sourceCommit+'.\n'));assert.ok(text.includes('// '+file.source+' SHA256 '+file.sourceSha256+'\n'));}
 assert.deepEqual(manifest.capabilities,[ARTICLE_LAYOUT_CAPABILITY,ARTICLE_COMPOSITION_CAPABILITY,ARTICLE_CELL_SPACING_CAPABILITY,ARTICLE_PROSE_COLUMN_CAPABILITY]);
 const layout=fs.readFileSync(new URL('../app/layout.jsx',import.meta.url),'utf8');assert.ok(layout.includes("'indexive-html-layout':'"+manifest.capabilities.join(' ')+"'"));
 assert.ok(manifest.history.every(item=>item.note.includes('superseded')));
});
