import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {sanitizeHtml} from '../lib/renderer.mjs';import {validateMdx} from '../lib/core.mjs';import {articleTableSourceDigest} from '../lib/layout-ownership.mjs';
const data=JSON.parse(fs.readFileSync(new URL('./prose-column-fixtures.json',import.meta.url)));
for(const [index,f]of data.fixtures.entries()){
 test(`actual product prose recipe HTML/MDX retained ${index}`,()=>{assert.equal(sanitizeHtml(f.html),f.html);assert.equal(articleTableSourceDigest(f.html),f.sourceDigest);assert.doesNotThrow(()=>validateMdx(f.mdx));assert.match(f.html,/min-width:clamp\(200px,100cqi,240px\);box-sizing:border-box;vertical-align:top/);});
 test(`changed ownership/style/source rejected before normalization ${index}`,()=>{
  for(const bad of [f.html.replace('min-width:clamp(200px,100cqi,240px)','min-width:241px'),f.html.replace('data-ix-prose-column="1"','data-ix-prose-column="2"'),f.html.replaceAll('data-ix-prose-column="1"',''),f.html.replace('Review the operational evidence','Changed evidence'),f.html.replace('vertical-align:top','vertical-align:middle')])assert.throws(()=>sanitizeHtml(bad));
  for(const bad of [f.mdx.replace('"minWidth":"clamp(200px,100cqi,240px)"','"minWidth":"241px"'),f.mdx.replace('data-ix-prose-column="1"','data-ix-prose-column="2"'),f.mdx.replaceAll('data-ix-prose-column="1"','')])assert.throws(()=>validateMdx(bad));
 });
}
test('contextual finite styles cannot escape cells or acquire arbitrary CSS',()=>{assert.throws(()=>validateMdx('<p style={{"minWidth":"clamp(200px,100cqi,240px)","boxSizing":"border-box"}}>outside</p>'));assert.throws(()=>sanitizeHtml('<td style="min-width:clamp(200px,100cqi,240px);box-sizing:border-box">unowned</td>'));assert.throws(()=>validateMdx('<td style={{"minWidth":"clamp(200px,100cqi,240px)","position":"fixed"}}>bad</td>'));});
