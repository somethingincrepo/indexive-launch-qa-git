import test from 'node:test';import assert from 'node:assert/strict';import {validateMdx} from '../lib/core.mjs';
test('comment appearance never permits executable ESTree expressions',()=>{
 const probes=['{/* a */ process.env.SECRET /* b */}','{/* a */ globalThis.fetch("https://example.com") /* b */}','{/* a */ (()=>1)() /* b */}','{/* a */ (1,process.env.SECRET) /* b */}','{/* a */ `literal` /* b */}','{/* a */ ({x:1}) /* b */}','{process.env.SECRET}','{["literal"]}','{1}','{null}','{true}','{"a" + "b"}','{`a${process.env.SECRET}`}'];
 for(const probe of probes){assert.throws(()=>validateMdx(probe),probe);assert.throws(()=>validateMdx(`<p>${probe}</p>`),probe);}
});
test('only empty comment programs and standalone literal strings remain compatible',()=>{for(const source of ['{/* inert */}','{/* one */ /* two */}','<p>{/* inert */}</p>','<pre>{"literal\\ntext"}</pre>'])assert.doesNotThrow(()=>validateMdx(source));});
