import data from '../../../data/rel-pages.json';
import {notFound} from 'next/navigation';
const find=slug=>data.pages.find(p=>p.slug===slug);
export function generateStaticParams(){return data.pages.map(p=>({slug:p.slug}));}
export async function generateMetadata({params}){const {slug}=await params;const page=find(slug);if(!page)return {};return {title:page.seoTitle,description:page.description,robots:{index:false,follow:false}};}
export default async function Page({params}){const {slug}=await params;const page=find(slug);if(!page)notFound();return <article><h1>{page.heading}</h1><div dangerouslySetInnerHTML={{__html:page.body}}/></article>;}
