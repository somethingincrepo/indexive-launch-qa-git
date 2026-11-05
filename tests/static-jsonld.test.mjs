import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {validateMdx} from '../lib/core.mjs';import {parseFrontmatter} from '../lib/frontmatter.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('./static-jsonld-fixture.json',import.meta.url)));
const ld=(value,property='__html')=>`<script type="application/ld+json" dangerouslySetInnerHTML={{ ${property}: ${JSON.stringify(value)} }} />`;
const json='{"@context":"https://schema.org","@type":"Organization","name":"Fictional QA"}';
test('accepts exact actual normal-worker PR75 MDX with inert JSON-LD',()=>{assert.equal(crypto.createHash('sha256').update(fixture.mdx).digest('hex'),fixture.sha256);assert.doesNotThrow(()=>validateMdx(parseFrontmatter(fixture.mdx).content));});
test('actual full PR75 body compiles and preserves a single inert JSON-LD graph',async()=>{
 const {evaluate}=await import('@mdx-js/mdx');const runtime=await import('react/jsx-runtime');const {createElement}=await import('react');const {renderToStaticMarkup}=await import('react-dom/server');
 const body=parseFrontmatter(fixture.mdx).content;validateMdx(body);const {default:Content}=await evaluate(body,{...runtime});const html=renderToStaticMarkup(createElement(Content));const scripts=[...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)];assert.equal(scripts.length,1);assert.equal(JSON.parse(scripts[0][1])['@graph'][0]['@type'],'Organization');assert.match(html,/min-width:clamp\(200px,100cqi,240px\)/);
});
test('static JSON-LD compiles and React renders exact inert object data including valid escapes',async()=>{
 const {evaluate}=await import('@mdx-js/mdx');const runtime=await import('react/jsx-runtime');const {createElement}=await import('react');const {renderToStaticMarkup}=await import('react-dom/server');
 for(const data of [json,JSON.stringify({'@type':'Thing',name:'Quoted "QA"\nline\\tail Ω'}),'{"name":"\\u003c/script>\\u003cscript>alert(1)\\u003c/script>"}']){
  const mdx=ld(data);validateMdx(mdx);const {default:Content}=await evaluate(mdx,{...runtime});const html=renderToStaticMarkup(createElement(Content));assert.equal(html,`<script type="application/ld+json">${data}</script>`);assert.equal((html.match(/<script/g)||[]).length,1);assert.equal(html.includes('dangerouslySetInnerHTML'),false);
 }
});
for(const [label,source]of Object.entries({
 javascript: '<script>alert(1)</script>',type:'<script type="text/javascript" dangerouslySetInnerHTML={{ __html: "{}" }} />',
 src:'<script type="application/ld+json" src="https://evil.test/x" dangerouslySetInnerHTML={{ __html: "{}" }} />',
 children:'<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{}" }}>content</script>',
 spread:'<script type="application/ld+json" dangerouslySetInnerHTML={{ ...evil, __html: "{}" }} />',
 computed:ld('{}','["__html"]'),getter:'<script type="application/ld+json" dangerouslySetInnerHTML={{ get __html(){return "{}"} }} />',
 method:'<script type="application/ld+json" dangerouslySetInnerHTML={{ __html(){return "{}"} }} />',
 shorthand:'<script type="application/ld+json" dangerouslySetInnerHTML={{ __html }} />',
 extra:'<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{}", extra: "x" }} />',
 duplicate:'<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{}", __html: "{}" }} />',
 expression:'<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({}) }} />',
 sequence:'<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: (globalThis.executed=true,"{}") }} />',
 template:'<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `{} ` }} />',
 attrSpread:'<script type="application/ld+json" {...evil} dangerouslySetInnerHTML={{ __html: "{}" }} />',
 attrDuplicate:'<script type="application/ld+json" type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{}" }} />',
 attrExpression:'<script type={"application/ld+json"} dangerouslySetInnerHTML={{ __html: "{}" }} />',
 otherElement:'<div dangerouslySetInnerHTML={{ __html: "{}" }} />',quotedKey:ld('{}','"__html"'),
 comment:'<script type="application/ld+json" dangerouslySetInnerHTML={{ /* hidden */ __html: "{}" }} />',
 breakout:ld('{"name":"</ScRiPt><script>alert(1)</script>"}'),openTag:ld('{"name":"<img src=x onerror=alert(1)>"}'),
 malformed:ld('{not JSON}'),array:ld('[]'),null:ld('null'),string:ld('"text"'),number:ld('42'),
 reordered:'<script dangerouslySetInnerHTML={{ __html: "{}" }} type="application/ld+json" />',
 escapedLiteral:'<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "\\u007b}" }} />',
}))test('rejects unsafe or noncompiler JSON-LD '+label,()=>{delete globalThis.executed;assert.throws(()=>validateMdx(source));assert.equal(globalThis.executed,undefined);});
