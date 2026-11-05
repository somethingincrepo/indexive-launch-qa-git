import { load } from 'cheerio';
export const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
import {articleLayoutStyle, articleLayoutStyleForTag, ARTICLE_TABLE_STYLE, ARTICLE_LEGACY_TABLE_STYLE} from './layout.mjs';
import {validateArticleTableHints} from './layout-ownership.mjs';
const layoutStyle=value=>articleLayoutStyle(String(value));
const safeUrl = value => { const v=String(value??''); return /^https?:\/\//i.test(v)||(/^\/(?!\/)/.test(v)) ? v : ''; };
export function publishedDocs(docs){return docs.filter(d=>['page','post'].includes(d._type)&&typeof d._id==='string'&&!/^(drafts|versions)\./.test(d._id)&&/^[a-z0-9]+(?:[-/][a-z0-9]+)*$/.test(d.slug?.current??'')&&(!d.publishedAt||Date.parse(d.publishedAt)<=Date.now()));}
export function sanitizeHtml(raw){
 const ownedHintIds=validateArticleTableHints(String(raw??''));
 const $=load(String(raw??''),null,false);
 $('script,style,iframe,object,embed,form,input,button,textarea,select,link,meta,base,svg,math').remove();
 const allowed=new Set('p h1 h2 h3 h4 h5 h6 ul ol li blockquote pre code strong em b i u s a table caption thead tbody tfoot tr th td img figure figcaption hr br div section details summary span'.split(' '));
 $('*').each((_,el)=>{if(!allowed.has(el.tagName)){$(el).replaceWith($(el).contents());return;}for(const [key,val] of Object.entries(el.attribs??{})){if(key==='style'&&articleLayoutStyleForTag(val,el.tagName)&&(!(layoutStyle(val)==='padding:0.5em 0.75em')||['td','th'].includes(el.tagName))&&(!(layoutStyle(val)==='min-width:min-content;box-sizing:border-box')||el.tagName==='div')){$(el).attr('style',articleLayoutStyleForTag(val,el.tagName));}else if(key==='data-ix-cell-spacing'&&val==='1'&&['td','th'].includes(el.tagName)&&layoutStyle(el.attribs.style)==='padding:0.5em 0.75em'){}else if(key==='data-ix-table-hint'&&val==='1'&&el.tagName==='p'){}else if(key==='data-ix-table-caption'&&val==='1'&&el.tagName==='caption'){}else if(key==='aria-describedby'&&ownedHintIds.has(val)&&el.tagName==='div'){}else if(['href','src'].includes(key)){if(!safeUrl(val))$(el).removeAttr(key);}else if(el.tagName==='div'&&[ARTICLE_TABLE_STYLE,ARTICLE_LEGACY_TABLE_STYLE].includes(layoutStyle(el.attribs.style))&&((key==='role'&&val==='region')||(key==='tabindex'&&val==='0')||(key==='aria-label'&&val.length<=300))){}else if(!['alt','title','colspan','rowspan','scope','id','data-indexive-id','data-indexive-change','data-indexive-key'].includes(key))$(el).removeAttr(key);}});
 return $.html();
}
const valueHtml=v=>Array.isArray(v)?renderPortableText(v):esc(v);
export function renderPortableText(blocks=[]){return blocks.map(b=>{
 const marker=/^(ix-[a-f0-9]{8})/.exec(String(b._key??''))?.[1];
 const attrs=` data-indexive-key="${esc(b._key??'')}"${marker?` data-indexive-id="${esc(marker)}"`:''}`;
 if(b._type==='block'){
  const spans=(b.children??[]).map(s=>{let text=esc(s.text);for(const mark of s.marks??[]){if(['strong','em','code','underline','strike-through'].includes(mark)){const tag={'underline':'u','strike-through':'s'}[mark]??mark;text=`<${tag}>${text}</${tag}>`;}else{const def=(b.markDefs??[]).find(d=>d._key===mark);if(def?._type==='link'&&safeUrl(def.href))text=`<a href="${esc(def.href)}">${text}</a>`;}}return text;}).join('');
  if(b.listItem)return `<${b.listItem==='number'?'ol':'ul'}${attrs}><li>${spans}</li></${b.listItem==='number'?'ol':'ul'}>`;
  const tag=/^h[1-6]$/.test(b.style)?b.style:b.style==='blockquote'?'blockquote':'p';return `<${tag}${attrs}>${spans}</${tag}>`;
 }
 if(/faq/i.test(b._type??''))return `<section${attrs}><h2>${esc(b.heading??'Frequently asked questions')}</h2>${(b.items??[]).map(i=>`<div><h3>${valueHtml(i.question??i.q??i.title)}</h3><div>${valueHtml(i.answer??i.a??i.text??i.body)}</div></div>`).join('')}</section>`;
 if(/callout|note|tip/i.test(b._type??''))return `<aside${attrs}>${valueHtml(b.text??b.body)}</aside>`;
 if(/cta|button/i.test(b._type??''))return `<p${attrs}>${safeUrl(b.href)?`<a href="${esc(b.href)}">${esc(b.label??b.text)}</a>`:esc(b.label??b.text)}</p>`;
 if(/table/i.test(b._type??''))return `<table${attrs}>${(b.rows??[]).map((r,i)=>`<tr>${(r.cells??[]).map(c=>`<${i?'td':'th'}>${esc(c)}</${i?'td':'th'}>`).join('')}</tr>`).join('')}</table>`;
 if(b._type==='image'&&safeUrl(b.url))return `<figure${attrs}><img src="${esc(b.url)}" alt="${esc(b.alt)}"></figure>`;
 return '';
}).join('\n');}
