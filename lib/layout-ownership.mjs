// packages/cms-adapters/src/article-layout.ts SHA256 9a2d333b0e02b9a0b24b4ad0e67a4a609207cafa048ff153ddd1597fb19e3341
// Only articleTableSourceDigest and validateArticleTableHints are retained.
// Validation-only snapshot from product 7305195e; no page compiler.
import { createHash } from "node:crypto";
import { load } from "cheerio";
import { ARTICLE_LEGACY_TABLE_STYLE, ARTICLE_TABLE_CAPTION_STYLE, ARTICLE_TABLE_SIZING_STYLE, ARTICLE_CELL_SPACING_STYLE, ARTICLE_TABLE_STYLE, ARTICLE_WRAP_STYLE, ARTICLE_COMPOSITION_TABLE_STYLE, ARTICLE_TABLE_HINT } from "./layout.mjs";
/** Canonical table identity excludes only exact compiler-owned cells/wrappers. */
export function articleTableSourceDigest(html) {
    const $ = load(html, null, false);
    $('p[data-ix-table-hint="1"]').each((_, el) => { const n = $(el), id = n.attr('id'), region = id ? n.next() : n.parent(); if (n.text() === ARTICLE_TABLE_HINT && n.contents().toArray().every(c => c.type === 'text') && [ARTICLE_TABLE_STYLE, ARTICLE_LEGACY_TABLE_STYLE].includes(region.attr('style') ?? '') && region.attr('role') === 'region' && (id ? ['data-ix-table-hint,id', 'data-ix-table-hint,id,style'].includes(Object.keys(el.attribs).sort().join(',')) && (!n.attr('style') || n.attr('style') === ARTICLE_WRAP_STYLE) : Object.keys(el.attribs).join(',') === 'data-ix-table-hint') && (!id || (/^ix-table-hint-[a-f0-9]{20}-[0-9]+$/.test(id) && region.attr('aria-describedby') === id)))
        n.remove(); });
    $('td[data-ix-cell-spacing="1"],th[data-ix-cell-spacing="1"]').each((_, el) => { const n = $(el); if (n.attr('style') === ARTICLE_CELL_SPACING_STYLE)
        n.removeAttr('style').removeAttr('data-ix-cell-spacing'); });
    $('caption[data-ix-table-caption="1"]').each((_, el) => { if ($(el).attr('style') === ARTICLE_TABLE_CAPTION_STYLE)
        $(el).removeAttr('style').removeAttr('data-ix-table-caption'); });
    $('table').each((_, el) => { if ($(el).attr('style') === ARTICLE_COMPOSITION_TABLE_STYLE)
        $(el).removeAttr('style'); });
    $('div').toArray().reverse().forEach(el => { const n = $(el); if ([ARTICLE_TABLE_SIZING_STYLE, ARTICLE_TABLE_STYLE, ARTICLE_LEGACY_TABLE_STYLE].includes(n.attr('style') ?? '') && n.find('table').length)
        n.replaceWith(n.contents()); });
    return createHash('sha256').update(JSON.stringify($('table').toArray().map(el => $.html(el)))).digest('hex');
}
/** Validate only finite historical/current compiler hint relationships. */
export function validateArticleTableHints(html) {
    const $ = load(html, null, false), ids = new Set(), digest = articleTableSourceDigest(html).slice(0, 20);
    const fail = () => { throw new Error('Compiler-owned table hint changed or ID collision; review the source.'); };
    $('[data-ix-table-hint]').each((_, el) => {
        const n = $(el), id = n.attr('id'), region = id ? n.next() : n.parent();
        const keys = Object.keys(el.attribs).sort().join(',');
        if (!n.is('p') || n.attr('data-ix-table-hint') !== '1' || n.text() !== ARTICLE_TABLE_HINT || n.contents().toArray().some(c => c.type !== 'text') || ![ARTICLE_TABLE_STYLE, ARTICLE_LEGACY_TABLE_STYLE].includes(region.attr('style') ?? '') || region.attr('role') !== 'region')
            fail();
        if (Object.keys(region[0] && 'attribs' in region[0] ? region[0].attribs : {}).sort().join(',') !== (id ? 'aria-describedby,aria-label,role,style,tabindex' : 'aria-label,role,style,tabindex') || region.attr('tabindex') !== '0' || !region.attr('aria-label') || region.find('table').filter((_, t) => $(t).closest('[role=region]')[0] === region[0]).length !== 1)
            fail();
        if (!id) {
            if (keys !== 'data-ix-table-hint' || region.children('p[data-ix-table-hint]').length !== 1)
                fail();
            return;
        }
        const ordinal = $('table').toArray().indexOf(region.find('table')[0]);
        if (id !== `ix-table-hint-${digest}-${ordinal}` || ids.has(id) || $('[id]').toArray().filter(e => $(e).attr('id') === id).length !== 1 || region.attr('aria-describedby') !== id || !['data-ix-table-hint,id', 'data-ix-table-hint,id,style'].includes(keys) || (n.attr('style') && n.attr('style') !== ARTICLE_WRAP_STYLE))
            fail();
        ids.add(id);
    });
    $('[aria-describedby]').each((_, el) => { const n = $(el); if ([ARTICLE_TABLE_STYLE, ARTICLE_LEGACY_TABLE_STYLE].includes(n.attr('style') ?? '') && !ids.has(n.attr('aria-describedby')))
        fail(); });
    $('[data-ix-table-caption]').each((_, el) => { const n = $(el); if (Object.keys(el.attribs).sort().join(',') !== 'data-ix-table-caption,style' || !n.is('caption') || n.attr('data-ix-table-caption') !== '1' || n.attr('style') !== ARTICLE_TABLE_CAPTION_STYLE || !n.parent().is('table') || n.closest('[role=region]').attr('style') !== ARTICLE_TABLE_STYLE)
        fail(); });
    return ids;
}
