import createMDX from '@next/mdx';import remarkFrontmatter from 'remark-frontmatter';
export default createMDX({options:{remarkPlugins:[remarkFrontmatter]}})({pageExtensions:['js','jsx','mdx'],experimental:{cpus:2},async headers(){return [{source:'/:path*',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow'}]}]}});
