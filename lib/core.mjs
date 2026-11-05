import {unified} from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import {finiteStyles, articleLayoutStyleForTag, safeImageDimension} from './layout.mjs';
import {validateArticleTableHints} from './layout-ownership.mjs';

export function eligible(d, now=Date.now()) {
  return ['page','post'].includes(d?._type) && typeof d._id==='string'
    && !/^(drafts|versions)\./.test(d._id)
    && /^[a-z0-9]+(?:[-/][a-z0-9]+)*$/.test(d.slug?.current??'')
    && (!d.publishedAt || (Number.isFinite(Date.parse(d.publishedAt)) && Date.parse(d.publishedAt)<=now));
}
const tags=new Set('p h1 h2 h3 h4 h5 h6 ul ol li blockquote pre code strong em b i u s a table caption thead tbody tfoot tr th td img figure figcaption hr br div section details summary span aside'.split(' '));
const attributes=new Set('href src alt title colSpan rowSpan scope id className tabIndex role aria-label data-indexive-id data-indexive-key data-indexive-change data-ix-cell-spacing data-ix-prose-column data-ix-prose-top data-ix-table-hint data-ix-table-caption aria-describedby'.split(' '));
function safeUrl(value) {
  return typeof value==='string' && (/^https?:\/\//i.test(value) || /^\/(?!\/)/.test(value) || /^#[a-z0-9_-]+$/i.test(value));
}
/** Sole script exception: the adapter's static, inert JSON-LD carrier. Never evaluate an expression. */
function validateStaticJsonLd(node) {
  const fail=()=>{throw Error('Unsupported static JSON-LD');};
  const attrs=node.attributes;
  if(node.children?.length || attrs?.length!==2 || attrs[0].type!=='mdxJsxAttribute' || attrs[0].name!=='type' || attrs[0].value!=='application/ld+json'
    || attrs[1].type!=='mdxJsxAttribute' || attrs[1].name!=='dangerouslySetInnerHTML') fail();
  const value=attrs[1].value,program=value?.data?.estree;
  if(value?.type!=='mdxJsxAttributeValueExpression' || program?.type!=='Program' || program.body?.length!==1 || program.comments?.length) fail();
  const statement=program.body[0],expression=statement?.expression;
  if(statement.type!=='ExpressionStatement' || expression?.type!=='ObjectExpression' || expression.properties?.length!==1) fail();
  const property=expression.properties[0],literal=property?.value;
  if(property.type!=='Property' || property.kind!=='init' || property.computed || property.method || property.shorthand
    || property.key?.type!=='Identifier' || property.key.name!=='__html' || literal?.type!=='Literal' || typeof literal.value!=='string'
    || literal.raw!==JSON.stringify(literal.value) || literal.value.includes('<')) fail();
  let data;try{data=JSON.parse(literal.value);}catch{fail();}
  if(!data || typeof data!=='object' || Array.isArray(data)) fail();
  // Permit canonical data, including the inert escaped-HTML spelling used by JSON-LD carriers.
  const canonical=JSON.stringify(data);
  if(literal.value!==canonical && literal.value!==canonical.replace(/</g,'\\u003c')) fail();
}
export function validateMdx(source) {
  const tree=unified().use(remarkParse).use(remarkMdx).parse(source);
  function visit(node) {
    if(node.type==='mdxjsEsm') throw Error('Unsupported executable MDX');
    if(node.type==='mdxFlowExpression'||node.type==='mdxTextExpression') {
      const program=node.data?.estree;
      if(program?.type!=='Program'||!Array.isArray(program.body)) throw Error('Missing MDX expression AST');
      // Comments are inert only when the compiler parser finds no statements.
      if(program.body.length!==0) {
        const statement=program.body[0];
        const expression=statement?.expression;
        if(program.body.length!==1||statement.type!=='ExpressionStatement'
          ||expression?.type!=='Literal'||typeof expression.value!=='string') {
          throw Error('Unsupported MDX expression');
        }
        // Keep adapter-generated JSON string literals as the sole expression form.
        let literal;
        try { literal=JSON.parse(node.value.trim()); } catch { throw Error('Unsupported MDX expression'); }
        if(literal!==expression.value) throw Error('Unsupported MDX expression');
      }
    }
    if(node.type==='mdxJsxFlowElement'||node.type==='mdxJsxTextElement') {
      if(node.name==='script'){validateStaticJsonLd(node);return;}
      if(!tags.has(node.name)) throw Error('Unsupported MDX element');
      const seen=new Set();
      for(const attr of node.attributes) {
        if(attr.type!=='mdxJsxAttribute'||seen.has(attr.name)) throw Error('Duplicate or spread MDX attribute');
        seen.add(attr.name);
        if(attr.name==='style') {
          if(attr.value?.type!=='mdxJsxAttributeValueExpression') throw Error('Unsupported MDX style');
          let obj;
          try { obj=JSON.parse(attr.value.value); } catch { throw Error('Unsupported MDX style'); }
          if(!finiteStyles.some(v=>JSON.stringify(v)===JSON.stringify(obj))||!articleLayoutStyleForTag(Object.entries(obj).map(([k,v])=>k.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())+':'+v).join(';'),node.name)) throw Error('Unsupported MDX style');
        } else {
          if(!((node.name==='img'&&['width','height'].includes(attr.name)&&safeImageDimension(attr.value))||(attributes.has(attr.name)&&typeof attr.value==='string'))) throw Error('Unsupported MDX attribute');
          if(['href','src'].includes(attr.name)&&!safeUrl(attr.value)) throw Error('Unsafe MDX URL');
        }
      }
    }
    if(['link','image','definition'].includes(node.type)&&!safeUrl(node.url)) throw Error('Unsafe Markdown URL');
    for(const child of node.children??[]) visit(child);
  }
  visit(tree);
  // Reconstruct inert JSX data for the same contextual ownership validator used by HTML.
  const escape=v=>String(v).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
  function html(node) {
    if(node.type==='mdxJsxFlowElement'||node.type==='mdxJsxTextElement') {
      if(node.name==='script') return ''; // Already validated inert data has no table ownership.
      const attrs=node.attributes.map(a=>{
        let value=a.value;
        if(a.name==='style') value=Object.entries(JSON.parse(value.value)).map(([k,v])=>k.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())+':'+v).join(';');
        return ' '+(a.name==='tabIndex'?'tabindex':a.name)+'="'+escape(value)+'"';
      }).join('');
      return '<'+node.name+attrs+'>'+(node.children??[]).map(html).join('')+'</'+node.name+'>';
    }
    if(node.type==='text') return escape(node.value);
    if(node.type==='mdxTextExpression'||node.type==='mdxFlowExpression') {try{return escape(JSON.parse(node.value));}catch{return '';}}
    return (node.children??[]).map(html).join('');
  }
  validateArticleTableHints(html(tree));
}

const predicate='_type in ["page","post"] && !(_id in path("drafts.**")) && !(_id in path("versions.**")) && (!defined(publishedAt) || dateTime(publishedAt) <= dateTime(now()))';
async function sanityQuery(query,parameters,fetcher) {
  const url=new URL('https://a7yw8mmt.api.sanity.io/v2025-02-19/data/query/production');
  url.searchParams.set('perspective','published');
  url.searchParams.set('query',query);
  for(const [name,value] of Object.entries(parameters)) url.searchParams.set('$'+name,JSON.stringify(value));
  const response=await fetcher(url,{cache:'no-store',signal:AbortSignal.timeout(12000)});
  if(!response.ok) throw Error('CMS upstream unavailable');
  const data=await response.json();
  if(!Array.isArray(data.result)) throw Error('Invalid CMS upstream response');
  return data.result;
}
export async function allSanity(fetcher=fetch) {
  const docs=[];
  let after='';
  // Bounded work, never a silently truncated successful inventory.
  for(let page=0;page<100;page++) {
    const batch=await sanityQuery(`*[${predicate} && _id > $after] | order(_id asc)[0...500]{_id,_type,slug,publishedAt}`,{after},fetcher);
    if(batch.length>500) throw Error('Invalid CMS inventory page');
    for(const doc of batch) {
      if(typeof doc._id!=='string'||doc._id<=after) throw Error('Invalid CMS inventory ordering');
      after=doc._id;
      if(eligible(doc)) docs.push(doc);
    }
    if(batch.length<500) return docs;
  }
  throw Error('CMS inventory exceeds safe pagination bound');
}
export async function readSanity(slug,fetcher=fetch) {
  if(!/^[a-z0-9]+(?:[-/][a-z0-9]+)*$/.test(slug)) return null;
  const docs=await sanityQuery(`*[${predicate} && slug.current == $slug] | order(_id asc)[0...2]`,{slug},fetcher);
  const valid=docs.filter(d=>eligible(d)&&d.slug.current===slug);
  if(valid.length>1) throw Error('Ambiguous CMS slug');
  return valid[0]??null;
}
export const jsonLd=v=>JSON.stringify(typeof v==='string'?JSON.parse(v):v).replace(/</g,'\\u003c');
