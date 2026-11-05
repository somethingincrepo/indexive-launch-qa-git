// Validation/finite-contract snapshot from product a4fc41d27cc45d04668a1f372c45520944330aa9.
// packages/cms-adapters/src/article-layout.ts SHA256 e83d0696392103777250fada9ec44e79cb2c9dcb5cff8220c920303d4532d44f
import { recoverProseColumns } from "./prose-ownership.mjs";
import { createHash } from "node:crypto";
import { load } from "cheerio";
import { ARTICLE_NATIVE_TABLE_CAPTION_STYLE, ARTICLE_NATIVE_TABLE_RULE, ARTICLE_LEGACY_TABLE_STYLE, ARTICLE_TABLE_CAPTION_STYLE, ARTICLE_TABLE_SIZING_STYLE, ARTICLE_CELL_SPACING_STYLE, ARTICLE_TABLE_STYLE, ARTICLE_WRAP_STYLE, ARTICLE_COMPOSITION_TABLE_STYLE, ARTICLE_TABLE_HINT } from "./layout.mjs";
/** Canonical table identity excludes only exact compiler-owned cells/wrappers. */
function rawArticleTableSourceDigest(html) {
    const $ = load(recoverProseColumns(html), null, false);
    $('p[data-ix-table-hint="1"]').each((_, el) => { const n = $(el), id = n.attr('id'), region = id ? n.next() : n.parent(); if (n.text() === ARTICLE_TABLE_HINT && n.contents().toArray().every(c => c.type === 'text') && [ARTICLE_TABLE_STYLE, ARTICLE_LEGACY_TABLE_STYLE].includes(region.attr('style') ?? '') && region.attr('role') === 'region' && (id ? ['data-ix-table-hint,id', 'data-ix-table-hint,id,style'].includes(Object.keys(el.attribs).sort().join(',')) && (!n.attr('style') || n.attr('style') === ARTICLE_WRAP_STYLE) : Object.keys(el.attribs).join(',') === 'data-ix-table-hint') && (!id || (/^ix-table-hint-[a-f0-9]{20}-[0-9]+$/.test(id) && region.attr('aria-describedby') === id)))
        n.remove(); });
    $('td[data-ix-cell-spacing="1"],th[data-ix-cell-spacing="1"]').each((_, el) => { const n = $(el); if (n.attr('style') === ARTICLE_CELL_SPACING_STYLE)
        n.removeAttr('style').removeAttr('data-ix-cell-spacing'); });
    $('caption[data-ix-table-caption="1"]').each((_, el) => { if ([ARTICLE_TABLE_CAPTION_STYLE, ARTICLE_NATIVE_TABLE_CAPTION_STYLE].includes($(el).attr('style') ?? ''))
        $(el).removeAttr('style').removeAttr('data-ix-table-caption'); });
    $('table').each((_, el) => { if ($(el).attr('style') === ARTICLE_COMPOSITION_TABLE_STYLE)
        $(el).removeAttr('style'); });
    $('div').toArray().reverse().forEach(el => { const n = $(el); if ([ARTICLE_TABLE_SIZING_STYLE, ARTICLE_TABLE_STYLE, ARTICLE_LEGACY_TABLE_STYLE].includes(n.attr('style') ?? '') && n.find('table').length)
        n.replaceWith(n.contents()); });
    return createHash('sha256').update(JSON.stringify($('table').toArray().map(el => $.html(el)))).digest('hex');
}
/** Reject changed generated CSS/ownership before recovering the source identity. */
export function articleTableSourceDigest(html) {
    validateNativeTableCaptionRule(html);
    validateArticleTableHints(html);
    return rawArticleTableSourceDigest(html);
}
/** Validate only finite historical/current compiler hint relationships. */
export function validateArticleTableHints(html) {
    const $ = load(html, null, false), ids = new Set(), currentOwners = new Set(), digest = rawArticleTableSourceDigest(html).slice(0, 20);
    const fail = () => { throw new Error('Compiler-owned table hint changed or ID collision; review the source.'); };
    $('[data-ix-table-hint]').each((_, el) => {
        const n = $(el), id = n.attr('id'), region = id ? n.next() : n.parent();
        const keys = Object.keys(el.attribs).sort().join(',');
        if (!region.is('div') || !n.is('p') || n.attr('data-ix-table-hint') !== '1' || n.text() !== ARTICLE_TABLE_HINT || n.contents().toArray().some(c => c.type !== 'text') || ![ARTICLE_TABLE_STYLE, ARTICLE_LEGACY_TABLE_STYLE].includes(region.attr('style') ?? '') || region.attr('role') !== 'region')
            fail();
        if (Object.keys(region[0] && 'attribs' in region[0] ? region[0].attribs : {}).sort().join(',') !== (id ? 'aria-describedby,aria-label,role,style,tabindex' : 'aria-label,role,style,tabindex') || region.attr('tabindex') !== '0' || !region.attr('aria-label') || region.find('table').filter((_, t) => $(t).closest('[role=region]')[0] === region[0]).length !== 1)
            fail();
        if (!id) {
            if (keys !== 'data-ix-table-hint' || region.children('p[data-ix-table-hint]').length !== 1)
                fail();
            if (region.attr('style') === ARTICLE_TABLE_STYLE)
                currentOwners.add(region[0]);
            return;
        }
        const ordinal = $('table').toArray().indexOf(region.find('table')[0]);
        if (id !== `ix-table-hint-${digest}-${ordinal}` || ids.has(id) || $('[id]').toArray().filter(e => $(e).attr('id') === id).length !== 1 || region.attr('aria-describedby') !== id || !['data-ix-table-hint,id', 'data-ix-table-hint,id,style'].includes(keys) || (n.attr('style') && n.attr('style') !== ARTICLE_WRAP_STYLE))
            fail();
        ids.add(id);
        if (region.attr('style') === ARTICLE_TABLE_STYLE)
            currentOwners.add(region[0]);
    });
    $('[aria-describedby]').each((_, el) => { const n = $(el); if ([ARTICLE_TABLE_STYLE, ARTICLE_LEGACY_TABLE_STYLE].includes(n.attr('style') ?? '') && !ids.has(n.attr('aria-describedby')))
        fail(); });
    $('[data-ix-table-caption]').each((_, el) => { const n = $(el); if (n.attr('style') === ARTICLE_NATIVE_TABLE_CAPTION_STYLE && !$('style[data-ix-native-table="1"]').length)
        fail(); if (Object.keys(el.attribs).sort().join(',') !== 'data-ix-table-caption,style' || !n.is('caption') || n.attr('data-ix-table-caption') !== '1' || ![ARTICLE_TABLE_CAPTION_STYLE, ARTICLE_NATIVE_TABLE_CAPTION_STYLE].includes(n.attr('style') ?? '') || !n.parent().is('table') || !currentOwners.has(n.closest('[role=region]')[0]))
        fail(); });
    return ids;
}
export function validateNativeTableCaptionRule(html) {
    const $ = load(html, null, false), styles = $('[data-ix-native-table]');
    if (!styles.length)
        return false;
    const fail = () => { throw new Error('Native table caption rule or ownership changed; review the source.'); };
    if (styles.length !== 1 || $('style').length !== 1)
        fail();
    const rule = styles.first(), el = rule[0];
    if (!rule.is('style') || !('attribs' in el) || Object.keys(el.attribs).join(',') !== 'data-ix-native-table' || rule.attr('data-ix-native-table') !== '1' || rule.html() !== ARTICLE_NATIVE_TABLE_RULE)
        fail();
    const ids = validateArticleTableHints(html);
    const regions = $('div[role="region"]').filter((_, n) => $(n).attr('style') === ARTICLE_TABLE_STYLE);
    if (!regions.length)
        fail();
    regions.each((_, n) => {
        const r = $(n), sizing = r.children();
        r.find('caption').each((_, caption) => { if ($(caption).attr('style') !== ARTICLE_NATIVE_TABLE_CAPTION_STYLE)
            fail(); });
        if (!ids.has(r.attr('aria-describedby') ?? '') || sizing.length !== 1 || !sizing.is('div') || Object.keys(sizing[0].attribs).join(',') !== 'style' || sizing.attr('style') !== ARTICLE_TABLE_SIZING_STYLE || sizing.children().length !== 1 || !sizing.children().is('table') || sizing.contents().toArray().some(c => c.type !== 'tag' && (c.type !== 'text' || c.data.trim())))
            fail();
    });
    return true;
}
