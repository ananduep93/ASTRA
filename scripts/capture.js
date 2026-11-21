const { spawn } = require('child_process');
const fs = require('fs');

async function capture({ url, width = 360, height = 780, waitTime = 1200, skipIntro = false, scrollSelector = null, scrollY = 0, outputPath }) {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9333 + Math.floor(Math.random() * 500);

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    `--window-size=${width},${height}`,
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ]);

  try {
    let versionData = null;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 100));
      try {
        const res = await fetch(`http://127.0.0.1:${port}/json/version`);
        if (res.ok) {
          versionData = await res.json();
          break;
        }
      } catch (e) {}
    }

    if (!versionData) throw new Error('Chrome failed to start');

    const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
    const pages = await listRes.json();
    const page = pages.find((p) => p.type === 'page');
    if (!page) throw new Error('No page found');

    const ws = new WebSocket(page.webSocketDebuggerUrl);

    let id = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        const cb = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) cb.reject(new Error(JSON.stringify(msg.error)));
        else cb.resolve(msg.result);
      }
    };

    await new Promise((resolve) => ws.onopen = resolve);

    const send = (method, params = {}) => {
      const msgId = id++;
      return new Promise((resolve, reject) => {
        callbacks.set(msgId, { resolve, reject });
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    };

    await send('Page.enable');
    await send('DOM.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: width < 600,
    });

    await send('Page.navigate', { url });

    if (skipIntro) {
      await send('Runtime.evaluate', {
        expression: `try { sessionStorage.setItem('astra_intro_seen', 'true'); } catch(e) {}`,
      });
      await send('Page.navigate', { url });
      await new Promise((r) => setTimeout(r, 1200));
    } else {
      await new Promise((r) => setTimeout(r, waitTime));
    }

    if (scrollSelector) {
      await send('Runtime.evaluate', {
        expression: `(() => {
          const el = document.querySelector('${scrollSelector}');
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        })()`,
      });
      await new Promise((r) => setTimeout(r, 400));
    } else if (scrollY > 0) {
      await send('Runtime.evaluate', {
        expression: `window.scrollTo({ top: ${scrollY}, behavior: 'instant' })`,
      });
      await new Promise((r) => setTimeout(r, 400));
    }

    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outputPath, Buffer.from(data, 'base64'));
    console.log('Saved screenshot to:', outputPath);

    ws.close();
  } finally {
    chrome.kill('SIGKILL');
  }
}

const args = process.argv.slice(2);
const command = args[0];

if (command === 'snap') {
  const target = args[1]; // 'intro', 'intro-weare', 'intro-final', 'hero', 'arts', 'fun'
  const targetMap = {
    intro: { waitTime: 400, scrollY: 0, out: 'intro-360px.png' },
    'intro-weare': { waitTime: 1000, scrollY: 0, out: 'intro-weare-360px.png' },
    'intro-final': { waitTime: 2100, scrollY: 0, out: 'intro-final-360px.png' },
    hero: { skipIntro: true, scrollY: 0, out: 'step1-hero-360px.png' },
    arts: { skipIntro: true, scrollSelector: '#category-arts', out: 'step1-arts-360px.png' },
    fun: { skipIntro: true, scrollSelector: '#category-fun', out: 'step1-fun-360px.png' },
  };

  const conf = targetMap[target];
  if (!conf) {
    console.error('Unknown target:', target);
    process.exit(1);
  }

  const outPath = `C:/Users/admin/.gemini/antigravity/brain/72f4ac67-f5ca-4b7a-a8ae-a1de4f8fae2a/${conf.out}`;
  capture({
    url: 'http://localhost:3000',
    width: 360,
    height: 780,
    waitTime: conf.waitTime || 1200,
    skipIntro: conf.skipIntro || false,
    scrollSelector: conf.scrollSelector,
    scrollY: conf.scrollY,
    outputPath: outPath,
  }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
