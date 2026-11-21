const { spawn } = require('child_process');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/admin/.gemini/antigravity/brain/72f4ac67-f5ca-4b7a-a8ae-a1de4f8fae2a';

async function snapDevice(width, height, isMobile, prefix) {
  console.log(`\n=== Capturing ${prefix} (${width}x${height}) ===`);
  const port = 9555 + Math.floor(Math.random() * 400);
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    `--window-size=${width},${height}`,
    'about:blank',
  ]);

  try {
    await new Promise((r) => setTimeout(r, 1000));
    const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
    const pages = await listRes.json();
    const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
    await new Promise((r) => (ws.onopen = r));

    let id = 1;
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const msgId = id++;
        const handler = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.id === msgId) {
            ws.removeEventListener('message', handler);
            if (msg.error) reject(new Error(JSON.stringify(msg.error)));
            else resolve(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: isMobile ? 2 : 1,
      mobile: isMobile,
    });

    const takeScreenshot = async (name) => {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      const filePath = `${ARTIFACT_DIR}/${prefix}-${name}.png`;
      fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
      console.log(`Saved: ${prefix}-${name}.png`);
    };

    const evalJs = async (expr) => {
      const res = await send('Runtime.evaluate', {
        expression: expr,
        returnByValue: true,
      });
      return res?.result?.value;
    };

    // Navigate to ?intro=1
    await send('Page.navigate', { url: 'http://localhost:3000/?intro=1' });
    await new Promise((r) => setTimeout(r, 2200));

    // Verify timeline exists
    const hasTl = await evalJs(`typeof window.__introTimeline !== 'undefined'`);
    console.log(`Has __introTimeline:`, hasTl);

    // MOMENT 1: Bars rising (0.35s)
    await evalJs(`(() => {
      if (window.__introTimeline) {
        window.__introTimeline.pause();
        window.__introTimeline.seek(0.35, false);
        const p = Math.round(window.__introTimeline.progress() * 100);
        const el = document.querySelector('[class*="tabular-nums"]');
        if (el) el.textContent = String(p).padStart(2, '0');
      }
      return true;
    })()`);
    await new Promise((r) => setTimeout(r, 300));
    await takeScreenshot('1-bars-rising');

    // MOMENT 2: ASTRA with counter (1.15s)
    await evalJs(`(() => {
      if (window.__introTimeline) {
        window.__introTimeline.pause();
        window.__introTimeline.seek(1.15, false);
        const p = Math.round(window.__introTimeline.progress() * 100);
        const el = document.querySelector('[class*="tabular-nums"]');
        if (el) el.textContent = String(p).padStart(2, '0');
      }
      return true;
    })()`);
    await new Promise((r) => setTimeout(r, 300));
    await takeScreenshot('2-astra-counter');

    // Metrics at moment 2
    const m2 = await evalJs(`(() => {
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
    console.log('Metrics at moment 2:', m2);

    // MOMENT 3: Curtains lifting (2.05s)
    await evalJs(`(() => {
      if (window.__introTimeline) {
        window.__introTimeline.pause();
        window.__introTimeline.seek(2.05, false);
      }
      return true;
    })()`);
    await new Promise((r) => setTimeout(r, 300));
    await takeScreenshot('3-curtains-lifting');

    // MOMENT 4: Final hero (progress=1 + finish)
    await evalJs(`(() => { if (window.__introTimeline) { window.__introTimeline.progress(1); } return true; })()`);
    await new Promise((r) => setTimeout(r, 600));

    // Metrics at final hero
    const m4 = await evalJs(`(() => {
      const heroAstra = document.getElementById('hero-astra');
      return {
        heroVisibility: heroAstra ? window.getComputedStyle(heroAstra).visibility : null,
        heroOpacity: heroAstra ? window.getComputedStyle(heroAstra).opacity : null,
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    })()`);
    console.log('Metrics at final hero:', m4);

    await takeScreenshot('4-final-hero');

    ws.close();
    chrome.kill();
  } catch (err) {
    chrome.kill();
    throw err;
  }
}

async function main() {
  await snapDevice(360, 780, true, 'curtain-360px');
  await snapDevice(1280, 800, false, 'curtain-1280px');
  console.log('\nAll 8 screenshots captured successfully!');
}

main().catch(console.error);
