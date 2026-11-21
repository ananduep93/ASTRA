const { spawn } = require('child_process');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/admin/.gemini/antigravity/brain/72f4ac67-f5ca-4b7a-a8ae-a1de4f8fae2a';

async function runSession(width, height, isMobile, prefix) {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9444 + Math.floor(Math.random() * 500);

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
    const consoleLogs = [];

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        consoleLogs.push(msg.params);
      }
      if (msg.id && callbacks.has(msg.id)) {
        const cb = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) cb.reject(new Error(JSON.stringify(msg.error)));
        else cb.resolve(msg.result);
      }
    };

    await new Promise((resolve) => (ws.onopen = resolve));

    const send = (method, params = {}) => {
      const msgId = id++;
      return new Promise((resolve, reject) => {
        callbacks.set(msgId, { resolve, reject });
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    };

    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: isMobile ? 2 : 1,
      mobile: isMobile,
    });

    const takeShot = async (name) => {
      const { data } = await send('Page.captureScreenshot', { format: 'png' });
      const outPath = `${ARTIFACT_DIR}/${prefix}-${name}.png`;
      fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
      console.log(`Saved screenshot: ${outPath}`);
    };

    const evalJs = async (expr) => {
      const res = await send('Runtime.evaluate', {
        expression: expr,
        returnByValue: true,
        awaitPromise: true,
      });
      return res?.result?.value;
    };

    // 1. Navigate with ?intro=1 to force intro replay
    await send('Page.navigate', { url: 'http://localhost:3000/?intro=1' });
    // Wait 2s for page load, hydration, and timeline initialization
    await new Promise((r) => setTimeout(r, 2000));

    // MOMENT 1: Bars rising (0.35s)
    await evalJs(`if (window.__introTimeline) { window.__introTimeline.pause(); window.__introTimeline.seek(0.35); }`);
    await new Promise((r) => setTimeout(r, 300));
    await takeShot('1-bars-rising');

    // MOMENT 2: ASTRA with counter (1.15s)
    await evalJs(`if (window.__introTimeline) { window.__introTimeline.pause(); window.__introTimeline.seek(1.15); }`);
    await new Promise((r) => setTimeout(r, 300));
    await takeShot('2-astra-counter');

    // Check overflow and ASTRA bounding rect
    const astraMetrics = await evalJs(`(() => {
      const el = document.querySelector('#intro-astra, [class*="text-hero"]');
      const rect = el ? el.getBoundingClientRect() : null;
      return {
        viewportWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
        astraWidth: rect ? rect.width : null,
        astraLeft: rect ? rect.left : null,
      };
    })()`);
    console.log(`[${prefix}] Metrics at moment 2:`, astraMetrics);

    // MOMENT 3: Curtains lifting (2.05s)
    await evalJs(`if (window.__introTimeline) { window.__introTimeline.pause(); window.__introTimeline.seek(2.05); }`);
    await new Promise((r) => setTimeout(r, 300));
    await takeShot('3-curtains-lifting');

    // MOMENT 4: Final hero (play to completion + allow handoff to finish)
    await evalJs(`if (window.__introTimeline) { window.__introTimeline.seek(2.8); window.__introTimeline.play(); }`);
    await new Promise((r) => setTimeout(r, 800));

    // Check final hero state and overflow
    const finalHeroMetrics = await evalJs(`(() => {
      const heroAstra = document.getElementById('hero-astra');
      const heroRect = heroAstra ? heroAstra.getBoundingClientRect() : null;
      return {
        heroVisibility: heroAstra ? window.getComputedStyle(heroAstra).visibility : null,
        heroOpacity: heroAstra ? window.getComputedStyle(heroAstra).opacity : null,
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    })()`);
    console.log(`[${prefix}] Metrics at final hero:`, finalHeroMetrics);

    await takeShot('4-final-hero');

    ws.close();
  } finally {
    chrome.kill('SIGKILL');
  }
}

async function main() {
  console.log('--- Capturing 360px Mobile Moments ---');
  await runSession(360, 780, true, 'curtain-360px');

  console.log('\n--- Capturing 1280px Desktop Moments ---');
  await runSession(1280, 800, false, 'curtain-1280px');

  console.log('\nAll screenshots captured successfully!');
}

main().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
