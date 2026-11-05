import yaml from 'js-yaml';

// No gray-matter engine dispatch: JavaScript and all executable engines are absent.
// Only an exact bare --- header is supported, containing safe YAML or JSON data.
export function parseFrontmatter(source) {
  const text=source.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n');
  if(!text.startsWith('---')) return {data:{},content:text};
  const lines=text.split('\n');
  if(lines[0]!=='---') throw Error('Unsupported frontmatter header; use bare --- with YAML or JSON');
  const end=lines.indexOf('---',1);
  if(end<0) throw Error('Unterminated frontmatter');
  const raw=lines.slice(1,end).join('\n');
  const data=raw.trim().startsWith('{')?JSON.parse(raw):yaml.load(raw,{schema:yaml.JSON_SCHEMA});
  if(data!==undefined&&(data===null||typeof data!=='object'||Array.isArray(data))) throw Error('Frontmatter must be a data object');
  return {data:data??{},content:lines.slice(end+1).join('\n')};
}
