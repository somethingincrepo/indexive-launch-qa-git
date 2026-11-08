import content from '../../lib/indexive-rel-content';
export const metadata={title:'Indexive module page title',description:'A synthetic page whose text lives in a TypeScript module, for the Indexive QA sweep.',robots:{index:false,follow:false}};
export default function Page(){return <article><h1>{content.heading}</h1><div dangerouslySetInnerHTML={{__html:content.body}}/></article>;}
