// Validation/finite-contract snapshot from product 2e23914ab5799df00c869cc986dbfc2a3fa61b8d.
// packages/cms-adapters/src/prose-columns.ts SHA256 73b9ce2f005aef8206c4876ab14e670b4d608579cf7a99bc334f086855e8829a
import { load } from 'cheerio';
import { ARTICLE_CELL_SPACING_STYLE, ARTICLE_PROSE_CELL_STYLES, ARTICLE_PROSE_COLUMN_STYLE, ARTICLE_PROSE_TOP_STYLE, ARTICLE_TABLE_STYLE, ARTICLE_COMPOSITION_TABLE_STYLE, articleDenseProse } from './layout.mjs';
const COLUMN = 'data-ix-prose-column', TOP = 'data-ix-prose-top', SPACING = 'data-ix-cell-spacing';
const recipe = (spacing, column, top) => [spacing ? ARTICLE_CELL_SPACING_STYLE : '', column ? ARTICLE_PROSE_COLUMN_STYLE : '', top ? ARTICLE_PROSE_TOP_STYLE : ''].filter(Boolean).join(';');
/** Source-only eligibility. Every structural ambiguity or authored treatment opts out. */
function columns($, table) {
    const t = $(table), result = new Set();
    if (t.parents('table').length || (t.attr('style') && t.attr('style') !== ARTICLE_COMPOSITION_TABLE_STYLE) || t.find('thead[style],tbody[style],tfoot[style],tr[style]').length || t.find('table,colgroup,col').length || /compact|dense/i.test(t.attr('class') ?? '') || t.find('[width],[height],[align],[valign]').length || t.is('[width],[height],[align],[valign]'))
        return result;
    const rows = t.find('tr').filter((_, r) => $(r).closest('table')[0] === table).toArray();
    const count = $(rows[0]).children('td,th').length;
    if (!count || rows.some(r => $(r).children('td,th').length !== count))
        return result;
    const cells = rows.flatMap(r => $(r).children('td,th').toArray());
    if (cells.some(c => { const n = $(c); return ['colspan', 'rowspan'].some(k => n.attr(k) !== undefined && n.attr(k) !== '1') || !!n.attr('style') || /compact|dense/i.test(n.attr('class') ?? ''); }))
        return result;
    cells.forEach(c => { const n = $(c); if (n.is('td') && !n.find('code,pre,table').length && articleDenseProse(n.text()))
        result.add(n.index()); });
    return result;
}
/** Validate exact derived ownership before removing any declaration for source recovery. */
export function recoverProseColumns(html) {
    const $ = load(html, null, false);
    $('td[style],th[style]').each((_, el) => { const n = $(el); if (ARTICLE_PROSE_CELL_STYLES.includes(n.attr('style') ?? '') && !n.is(`[${COLUMN}],[${TOP}]`))
        throw new Error('Prose column style has no compiler ownership; review the source.'); });
    const owned = $(`[${COLUMN}],[${TOP}]`).toArray();
    if (!owned.length)
        return html;
    const fail = () => { throw new Error('Compiler-owned prose column style or source changed; review the source.'); };
    for (const el of owned) {
        const n = $(el), column = n.attr(COLUMN) !== undefined, top = n.attr(TOP) !== undefined, spacing = n.attr(SPACING) === '1';
        if (!n.is('td,th') || (column && n.attr(COLUMN) !== '1') || (top && (n.attr(TOP) !== '1' || !n.is('td'))) || n.attr('style') !== recipe(spacing, column, top) || n.closest('[role="region"]').attr('style') !== ARTICLE_TABLE_STYLE)
            fail();
        n.removeAttr(COLUMN).removeAttr(TOP);
        if (spacing)
            n.attr('style', ARTICLE_CELL_SPACING_STYLE);
        else
            n.removeAttr('style');
    }
    // Evaluate source without the independent finite spacing recipe, retaining it in output.
    const original = load(html, null, false), plain = load($.html(), null, false);
    plain(`[${SPACING}="1"]`).each((_, el) => { if (plain(el).attr('style') === ARTICLE_CELL_SPACING_STYLE)
        plain(el).removeAttr('style'); });
    plain('table').each((ordinal, table) => {
        const selected = columns(plain, table), out = original('table').eq(ordinal);
        out.find('td,th').filter((_, c) => original(c).closest('table')[0] === out[0]).each((_, el) => {
            const n = original(el), column = n.attr(COLUMN) === '1', top = n.attr(TOP) === '1';
            // Only affected tables carry any recipe; unrelated eligible raw tables are valid source.
            if (out.find(`[${COLUMN}],[${TOP}]`).length && (column !== selected.has(n.index()) || top !== (selected.size > 0 && n.is('td'))))
                fail();
        });
    });
    return $.html();
}
