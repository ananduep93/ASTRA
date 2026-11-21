const { spawn } = require('child_process');

async function test() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9922',
    'about:blank',
  ]);
  await new Promise((r) => setTimeout(r, 1000));
  const list = await (await fetch('http://127.0.0.1:9922/json/list')).json();
  const ws = new WebSocket(list[0].webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 1;
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const msgId = id++;
      const handler = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === msgId) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:3000/?intro=1' });
  await new Promise((r) => setTimeout(r, 2000));
  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        search: window.location.search,
        seen: sessionStorage.getItem('astra_intro_seen'),
        reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        hasTimeline: typeof window.__introTimeline !== 'undefined',
        activeIntro: !!document.querySelector('aside[aria-label="Welcome intro"]'),
      };
    })()`,
    returnByValue: true,
  });
  console.log('DIAGNOSTIC RESULT:', res.result.value);
  ws.close();
  chrome.kill();
}
test().catch(console.error);
