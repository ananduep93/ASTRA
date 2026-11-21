const { spawn } = require('child_process');

async function testFont() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9935',
    'about:blank',
  ]);
  await new Promise((r) => setTimeout(r, 1000));
  const list = await (await fetch('http://127.0.0.1:9935/json/list')).json();
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
  await send('Page.navigate', { url: 'http://localhost:3000' });
  await new Promise((r) => setTimeout(r, 2000));

  const viewports = [360, 390, 768, 1280];
  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp,
      height: 800,
      deviceScaleFactor: 1,
      mobile: vp < 768,
    });
    await new Promise((r) => setTimeout(r, 200));

    const res = await send('Runtime.evaluate', {
      expression: `(() => {
        const vp = ${vp};
        const padding = vp < 640 ? 32 : (vp < 1024 ? 48 : 64);
        const maxContent = Math.min(1200, vp - padding);

        // Test clamped font sizes
        const testEl = document.createElement('h1');
        testEl.className = 'font-display tracking-tight leading-[0.88] select-none';
        testEl.style.fontSize = 'clamp(4.2rem, 20.2vw, 16.2rem)';
        testEl.style.display = 'inline-block';
        testEl.style.whiteSpace = 'nowrap';
        testEl.textContent = 'ASTRA';
        document.body.appendChild(testEl);

        const rect = testEl.getBoundingClientRect();
        const comp = window.getComputedStyle(testEl);
        const data = {
          vp,
          maxContent,
          fontSize: comp.fontSize,
          textWidth: Math.round(rect.width),
          fits: rect.width <= maxContent,
          fillPercent: Math.round((rect.width / maxContent) * 100) + '%'
        };
        testEl.remove();
        return JSON.stringify(data);
      })()`,
      returnByValue: true,
    });
    console.log(JSON.parse(res.result.value));
  }

  ws.close();
  chrome.kill();
}
testFont().catch(console.error);
