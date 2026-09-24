/* full-document axe-core audit (all rules) at mobile viewport; evidence -> qa/axe-audit.json */
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 360, height: 640 } })).newPage();
  await p.goto(process.env.QA_URL || 'http://127.0.0.1:8080/', { waitUntil: 'load' });
  await p.addScriptTag({ path: require.resolve('axe-core') });
  await p.waitForTimeout(1200);
  // scroll through so lazy states settle
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await p.waitForTimeout(1200);
  const res = await p.evaluate(async () => {
    const r = await axe.run(document, { resultTypes: ['violations'] });
    return r.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({
      sel: n.target.join(' ').slice(0, 120),
      label: (n.any.concat(n.all, n.none).map(c => c.message).join(' | ')).slice(0, 200),
      data: JSON.stringify(n.any.concat(n.all, n.none).map(c => c.data)).slice(0, 260),
      rel: (n.any.concat(n.all, n.none).flatMap(c => (c.relatedNodes || []).map(x => x.target.join(' ')))).join(';').slice(0, 120),
    })) }));
  });
  fs.writeFileSync('qa/_axe-full.json', JSON.stringify(res, null, 1));
  console.log(JSON.stringify(res.map(v => ({ id: v.id, n: v.nodes.length })), null, 1));
  await b.close();
})();
