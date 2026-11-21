const { spawn } = require('child_process');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/admin/.gemini/antigravity/brain/72f4ac67-f5ca-4b7a-a8ae-a1de4f8fae2a';

async function testPage(width, height, isMobile, prefix) {
  console.log(`\n=== Testing ${prefix} (${width}x${height}) ===`);
  const port = 9600 + Math.floor(Math.random() * 300);
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
      console.log(`Saved screenshot: ${prefix}-${name}.png`);
    };

    const evalJs = async (expr) => {
      const res = await send('Runtime.evaluate', {
        expression: expr,
        returnByValue: true,
      });
      return res?.result?.value;
    };

    // 1. First test intro handoff moments on 360px and 1280px
    if (width === 360 || width === 1280) {
      await send('Page.navigate', { url: 'http://localhost:3000/?intro=1' });
      await new Promise((r) => setTimeout(r, 2200));

      // Moment 1: Bars rising
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
      await new Promise((r) => setTimeout(r, 200));
      await takeScreenshot('intro-1-bars-rising');

      // Moment 2: ASTRA centered with counter (no skip button)
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
      await new Promise((r) => setTimeout(r, 200));
      await takeScreenshot('intro-2-astra-counter');

      // Moment 3: Curtains lifting & handoff gliding
      await evalJs(`(() => {
        if (window.__introTimeline) {
          window.__introTimeline.pause();
          window.__introTimeline.seek(2.15, false);
        }
        return true;
      })()`);
      await new Promise((r) => setTimeout(r, 200));
      await takeScreenshot('intro-3-curtains-lifting');

      // Finish intro cleanly
      await evalJs(`(() => {
        if (window.__introTimeline) {
          window.__introTimeline.progress(1);
        }
        return true;
      })()`);
      await new Promise((r) => setTimeout(r, 600));
    } else {
      // For other viewports, skip intro to capture static hero
      await send('Page.navigate', { url: 'http://localhost:3000' });
      await send('Runtime.evaluate', {
        expression: `try { sessionStorage.setItem('astra_intro_seen', 'true'); } catch(e) {}`,
      });
      await send('Page.navigate', { url: 'http://localhost:3000' });
      await new Promise((r) => setTimeout(r, 1200));
    }

    // Inspect hero metrics
    const heroMetrics = await evalJs(`(() => {
      const astra = document.getElementById('hero-astra');
      const astraRect = astra ? astra.getBoundingClientRect() : null;
      const tbaSticker = document.querySelector('span:has(> text), span');
      const chips = Array.from(document.querySelectorAll('a[href*="#category-"]')).map(el => ({
        text: el.textContent.trim(),
        height: el.getBoundingClientRect().height,
        width: el.getBoundingClientRect().width,
      }));
      const primaryBtn = document.querySelector('a[href="/register"]');
      const marquee = document.querySelector('[class*="animate-[marquee"]');

      return {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
        astraWidth: astraRect ? Math.round(astraRect.width) : null,
        astraHeight: astraRect ? Math.round(astraRect.height) : null,
        chipsCount: chips.length,
        chipsMinHeight: Math.min(...chips.map(c => c.height)),
        primaryBtnWidth: primaryBtn ? Math.round(primaryBtn.getBoundingClientRect().width) : null,
      };
    })()`);
    console.log('Hero Metrics:', heroMetrics);

    // Capture hero screenshot
    await takeScreenshot('hero');

    ws.close();
    chrome.kill();
  } catch (err) {
    chrome.kill();
    throw err;
  }
}

async function main() {
  await testPage(360, 800, true, 'hero-360px');
  await testPage(390, 844, true, 'hero-390px');
  await testPage(1280, 800, false, 'hero-1280px');
  console.log('\nAll tests and screenshots completed successfully!');
}

main().catch(console.error);
