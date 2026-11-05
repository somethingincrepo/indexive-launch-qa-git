// Validation/finite-contract snapshot from product a4fc41d27cc45d04668a1f372c45520944330aa9.
// packages/contracts/src/article-layout.ts SHA256 f7eb04887d701f07e83308c90f48bd1cc1d94517bd67e465bb2ea2ce99e98782
/** Versioned, inert layout instruction supported by HTML renderers. No arbitrary CSS. */
export const ARTICLE_WRAP_STYLE = "max-width:100%;overflow-wrap:anywhere;box-sizing:border-box";
export const ARTICLE_IMAGE_STYLE = "max-width:100%;height:auto;box-sizing:border-box";
export const ARTICLE_IMAGE_REACT_STYLE = { maxWidth: "100%", height: "auto", boxSizing: "border-box" };
export const ARTICLE_LEGACY_TABLE_STYLE = "max-width:100%;overflow-x:auto;box-sizing:border-box";
export const ARTICLE_TABLE_STYLE = ARTICLE_LEGACY_TABLE_STYLE + ";container-type:inline-size";
export const ARTICLE_TABLE_CAPTION_STYLE = "max-width:100cqi;position:sticky;left:0;overflow-wrap:normal;word-break:normal";
export const ARTICLE_NATIVE_TABLE_CAPTION_STYLE = ARTICLE_TABLE_CAPTION_STYLE.replace("left:0", "left:auto;inset-inline-start:0");
export const ARTICLE_WRAP_REACT_STYLE = { maxWidth: "100%", overflowWrap: "anywhere", boxSizing: "border-box" };
export const ARTICLE_TABLE_REACT_STYLE = { maxWidth: "100%", overflowX: "auto", boxSizing: "border-box", containerType: "inline-size" };
export const ARTICLE_LAYOUT_CAPABILITY = "inline-wrap-v3";
export const ARTICLE_TABLE_SIZING_STYLE = "min-width:min-content;box-sizing:border-box";
export const ARTICLE_CELL_SPACING_STYLE = "padding:0.5em 0.75em";
export const ARTICLE_PROSE_COLUMN_CAPABILITY = "table-prose-column-v1";
export const ARTICLE_PROSE_COLUMN_STYLE = "min-width:240px;box-sizing:border-box";
export const ARTICLE_PROSE_TOP_STYLE = "vertical-align:top";
/** Finite combinations only; no authored CSS is merged into this recipe. */
export const ARTICLE_PROSE_CELL_STYLES = [ARTICLE_PROSE_COLUMN_STYLE, ARTICLE_PROSE_TOP_STYLE, ARTICLE_PROSE_COLUMN_STYLE + ";" + ARTICLE_PROSE_TOP_STYLE].flatMap(s => [s, ARTICLE_CELL_SPACING_STYLE + ";" + s]);
export function articleDenseProse(text) {
    const normalized = text.replace(/\s+/g, " ").trim(), words = normalized.split(" ");
    return normalized.length >= 240 && words.length >= 40 && words.filter(w => /^[\p{L}][\p{L}',.!?;:-]*$/u.test(w)).length >= 30 && /[.!?;,:]/.test(normalized);
}
export const ARTICLE_CELL_SPACING_CAPABILITY = "table-cell-spacing-v1";
/** Composition may wrap prose anywhere; tables retain word-boundary min-content sizing. */
export const ARTICLE_COMPOSITION_TABLE_STYLE = "overflow-wrap:normal;word-break:normal";
export const ARTICLE_TABLE_HINT = "↔ Scroll horizontally if needed. Focus here and use arrow keys.";
export const ARTICLE_COMPOSITION_CAPABILITY = "page-composition-v4";
export const ARTICLE_SECTION_STYLE = "min-width:0;overflow-wrap:anywhere;box-sizing:border-box";
export const ARTICLE_GRID_STYLE = "display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr));gap:1rem;min-width:0;box-sizing:border-box";
export const ARTICLE_LEGACY_CARD_STYLE = ARTICLE_SECTION_STYLE + ";padding:1rem;border:1px solid currentColor";
export const ARTICLE_LEGACY_TABLE_CARD_STYLE = ARTICLE_LEGACY_CARD_STYLE + ";grid-column:1/-1";
export const ARTICLE_CARD_STYLE = ARTICLE_LEGACY_CARD_STYLE + ";margin-bottom:1rem";
export const ARTICLE_TABLE_CARD_STYLE = ARTICLE_CARD_STYLE + ";grid-column:1/-1";
/** Absence is prose. Reject unknown keys rather than accepting CSS/model instructions. */
export function articleComposition(placement) {
    if (!placement || typeof placement !== "object" || !("composition" in placement))
        return undefined;
    const c = placement.composition;
    if (!c || typeof c !== "object" || Array.isArray(c) || Object.keys(c).sort().join(",") !== "layout,version" || !("version" in c) || c.version !== 1 || !("layout" in c) || (c.layout !== "sections" && c.layout !== "cards"))
        throw new Error("Invalid page composition. Choose Prose, Sections or Cards (version 1).");
    return { version: 1, layout: c.layout };
}
export const ARTICLE_STYLE_REACT = Object.fromEntries([...ARTICLE_PROSE_CELL_STYLES, ARTICLE_LEGACY_TABLE_STYLE, ARTICLE_NATIVE_TABLE_CAPTION_STYLE, ARTICLE_TABLE_CAPTION_STYLE, ARTICLE_LEGACY_CARD_STYLE, ARTICLE_LEGACY_TABLE_CARD_STYLE, ARTICLE_CELL_SPACING_STYLE, ARTICLE_TABLE_SIZING_STYLE, ARTICLE_WRAP_STYLE, ARTICLE_TABLE_STYLE, ARTICLE_IMAGE_STYLE, ARTICLE_COMPOSITION_TABLE_STYLE, ARTICLE_SECTION_STYLE, ARTICLE_GRID_STYLE, ARTICLE_CARD_STYLE, ARTICLE_TABLE_CARD_STYLE].map(style => [style, Object.fromEntries(style.split(";").map(part => { const at = part.indexOf(":"); return [part.slice(0, at).replace(/-([a-z])/g, (_, c) => c.toUpperCase()), part.slice(at + 1)]; }))]));
export function articleLayoutStyle(value) {
    const parts = value.split(";").map(p => p.trim()).filter(Boolean);
    if (new Set(parts).size !== parts.length)
        return null;
    return Object.keys(ARTICLE_STYLE_REACT).find(style => style.split(";").length === parts.length && parts.every(p => style.split(";").includes(p))) ?? null;
}
export const isArticleWrapStyle = (value) => articleLayoutStyle(value) === ARTICLE_WRAP_STYLE;
/** Selection is bound to the sanitized source table sequence, not only to the QA row. */
export function articleTableCellSpacing(placement) {
    if (!placement || typeof placement !== "object" || !("tableCellSpacing" in placement))
        return undefined;
    const v = placement.tableCellSpacing;
    if (!v || typeof v !== "object" || Array.isArray(v) || Object.keys(v).sort().join(",") !== "sourceDigest,tables,version" || v.version !== 1 || !Array.isArray(v.tables) || v.tables.some((n, i) => !Number.isSafeInteger(n) || n < 0 || (i > 0 && n <= v.tables[i - 1])) || typeof v.sourceDigest !== "string" || !/^[a-f0-9]{64}$/.test(v.sourceDigest))
        throw new Error("Invalid table cell spacing selection; rerun visual QA on the current source.");
    return { version: 1, tables: [...v.tables], sourceDigest: v.sourceDigest };
}
/** New declarations are contextual; they cannot style unrelated elements. */
export function articleLayoutStyleForTag(value, tag) {
    const style = articleLayoutStyle(value);
    if ((style === ARTICLE_CELL_SPACING_STYLE || ARTICLE_PROSE_CELL_STYLES.includes(style ?? "")) && !["td", "th"].includes(tag))
        return null;
    if ([ARTICLE_TABLE_CAPTION_STYLE, ARTICLE_NATIVE_TABLE_CAPTION_STYLE].includes(style ?? "") && tag !== "caption")
        return null;
    if (ARTICLE_PROSE_CELL_STYLES.includes(style ?? "") && style?.includes(ARTICLE_PROSE_TOP_STYLE) && tag !== "td")
        return null;
    if (style === ARTICLE_TABLE_STYLE && tag !== "div")
        return null;
    if (style === ARTICLE_TABLE_SIZING_STYLE && tag !== "div")
        return null;
    return style;
}
/** Exact inert rule for the observed Shopify runtime's direct table wrapper only. */
export const ARTICLE_NATIVE_TABLE_RULE = `div[role="region"][aria-describedby^="ix-table-hint-"][style="${ARTICLE_TABLE_STYLE}"] > div[style="${ARTICLE_TABLE_SIZING_STYLE}"] > div[class="rte-table-wrapper"]{overflow:visible}`;
export const finiteStyles = Object.values(ARTICLE_STYLE_REACT);
export const safeImageDimension = value => typeof value === 'string' && /^[1-9][0-9]*$/.test(value) && Number.isSafeInteger(Number(value));
