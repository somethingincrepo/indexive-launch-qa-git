import content from '../../lib/indexive-rel-content';
export const metadata={title:'Indexive module page title',description:'Indexive check 202611080634: a short test description that is removed again.',robots:{index:false,follow:false}};
export default function Page(){return <article><h1>{content.heading}</h1><div dangerouslySetInnerHTML={{__html:content.body}}/></article>;}
