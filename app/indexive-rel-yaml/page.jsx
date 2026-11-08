import fs from 'node:fs';import path from 'node:path';import yaml from 'js-yaml';
const load=()=>yaml.load(fs.readFileSync(path.join(process.cwd(),'data','indexive-rel-yaml.yaml'),'utf8'));
export function generateMetadata(){const d=load();return {title:d.seoTitle,description:d.description,robots:{index:false,follow:false}};}
export default function Page(){const d=load();return <article><h1>{d.heading}</h1><div dangerouslySetInnerHTML={{__html:d.body}}/></article>;}
