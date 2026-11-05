import {load} from 'cheerio';
import {finiteStyles} from './layout.mjs';
export function eligible(d, now=Date.now()){return ['page','post'].includes(d?._type)&&typeof d._id==='string'&&!/^(drafts|versions)\./.test(d._id)&&/^[a-z0-9]+(?:[-/][a-z0-9]+)*$/.test(d.slug?.current??'')&&(!d.publishedAt||(Number.isFinite(Date.parse(d.publishedAt))&&Date.parse(d.publishedAt)<=now));}
export function validateMdx(s){
 s=s.replace(/\sstyle=\{(\{[^{}]*\})\}/g,(_,raw)=>{const obj=JSON.parse(raw);if(!finiteStyles.some(v=>JSON.stringify(v)===JSON.stringify(obj)))throw Error('Unsupported style');return '';});
 s=s.replace(/\{\/\*[\s\S]*?\*\/\}/g,'').replace(/\{("(?:[^"\\]|\\.)*")\}/g,(_,raw)=>{JSON.parse(raw);return '';});
 const $=load(s,null,false);const tags=new Set('p h1 h2 h3 h4 h5 h6 ul ol li blockquote pre code strong em b i u s a table caption thead tbody tfoot tr th td img figure figcaption hr br div section details summary span aside'.split(' '));
 $('*').each((_,el)=>{if(!tags.has(el.tagName))throw Error('Unsupported MDX element');for(const [key,value] of Object.entries(el.attribs)){if(!['href','src','alt','title','colspan','rowspan','scope','id','class','classname','tabindex','role','aria-label','data-indexive-id','data-indexive-key','data-indexive-change','data-ix-cell-spacing','data-ix-table-hint'].includes(key))throw Error('Unsupported MDX attribute');if(['href','src'].includes(key)&&!(/^https?:\/\//i.test(value)||/^\/(?!\/)/.test(value)||/^#[a-z0-9_-]+$/i.test(value)))throw Error('Unsafe MDX URL');}});
 if(/^\s*(import|export)\b/m.test(s)||/[{}]/.test(s)||/<\s*[A-Z]/.test(s)||/<\s*(script|style|iframe|object|embed|form|input|svg|math)\b/i.test(s)||/\son[a-z]+\s*=/i.test(s)||/(javascript|data|vbscript)\s*:/i.test(s))throw Error('Unsupported executable MDX');
}
export const query='*[_type in ["page","post"] && !(_id in path("drafts.**")) && !(_id in path("versions.**")) && (!defined(publishedAt) || dateTime(publishedAt) <= dateTime(now()))]';
export async function allSanity(fetcher=fetch){
 const url=new URL('https://a7yw8mmt.api.sanity.io/v2025-02-19/data/query/production');url.searchParams.set('perspective','published');url.searchParams.set('query',query+'[0...1000]');
 const r=await fetcher(url,{cache:'no-store',signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('CMS upstream unavailable');const data=await r.json();if(!Array.isArray(data.result))throw Error('Invalid CMS upstream response');return data.result.filter(d=>eligible(d));
}
export async function readSanity(slug,fetcher=fetch){return (await allSanity(fetcher)).find(d=>d.slug.current===slug)??null;}
export const jsonLd=v=>JSON.stringify(typeof v==='string'?JSON.parse(v):v).replace(/</g,'\\u003c');
