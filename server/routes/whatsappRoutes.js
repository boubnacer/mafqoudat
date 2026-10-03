const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const whatsappService = require('../services/whatsappService');

/**
 * WhatsApp Linking & Administration Routes
 *
 * GET  /whatsapp/scan     -> Visual web page for scanning the QR code
 * GET  /whatsapp/scan.js  -> Self-hosted frontend script (bypasses any inline CSP restrictions)
 * GET  /whatsapp/qr.png   -> Serves live QR code as a PNG image
 * GET  /whatsapp/qr.svg   -> Serves live QR code as an SVG vector
 * GET  /whatsapp/status   -> JSON status with connection state and metadata
 * POST /whatsapp/clear    -> Drops stored session from MongoDB and requests fresh QR
 */

// Route-level CSP override to ensure styles, fonts, and scripts execute cleanly
router.use((req, res, next) => {
  res.removeHeader('Content-Security-Policy');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self';"
  );
  next();
});

// 1. Direct PNG QR code generator
router.get('/qr.png', async (req, res) => {
  try {
    const status = whatsappService.getStatus();
    if (!status.qr) {
      return res.status(404).send('QR code not available or device already connected');
    }
    const buffer = await QRCode.toBuffer(status.qr, {
      type: 'png',
      width: 320,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(buffer);
  } catch (err) {
    console.error('[WhatsApp Route] Failed to generate qr.png:', err);
    res.status(500).send('Error generating QR image');
  }
});

// 2. Direct SVG QR code generator
router.get('/qr.svg', async (req, res) => {
  try {
    const status = whatsappService.getStatus();
    if (!status.qr) {
      return res.status(404).send('QR code not available or device already connected');
    }
    const svg = await QRCode.toString(status.qr, {
      type: 'svg',
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(svg);
  } catch (err) {
    console.error('[WhatsApp Route] Failed to generate qr.svg:', err);
    res.status(500).send('Error generating SVG image');
  }
});

// 3. Self-hosted client JavaScript (zero external CDN, zero CSP blocking)
router.get('/scan.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.send(`
(function() {
  var lastTimestamp = null;
  var badge = document.getElementById('statusBadge');
  var statusText = document.getElementById('statusText');
  var scanSection = document.getElementById('scanSection');
  var connectedSection = document.getElementById('connectedSection');
  var qrImg = document.getElementById('qrImg');
  var qrLoading = document.getElementById('qrLoading');

  window.checkStatus = async function() {
    try {
      var res = await fetch('/whatsapp/status?_t=' + Date.now());
      if (!res.ok) return;
      var data = await res.json();

      if (data.isConnected) {
        badge.className = 'badge-status badge-connected';
        statusText.textContent = 'Connected & Active';
        scanSection.style.display = 'none';
        connectedSection.style.display = 'block';
      } else {
        badge.className = 'badge-status badge-waiting';
        statusText.textContent = 'Waiting for scan...';
        scanSection.style.display = 'block';
        connectedSection.style.display = 'none';

        if (data.hasQR) {
          qrLoading.style.display = 'none';
          qrImg.style.display = 'block';
          if (data.lastQRTimestamp !== lastTimestamp) {
            lastTimestamp = data.lastQRTimestamp;
            qrImg.src = '/whatsapp/qr.png?_t=' + data.lastQRTimestamp;
          }
        } else {
          qrLoading.style.display = 'flex';
          qrImg.style.display = 'none';
        }
      }
    } catch (err) {
      console.warn('Status poll error:', err);
    }
  };

  window.clearSession = async function() {
    if (!confirm('Are you sure you want to reset the WhatsApp session?')) {
      return;
    }
    try {
      statusText.textContent = 'Resetting session...';
      badge.className = 'badge-status badge-waiting';
      qrImg.style.display = 'none';
      qrLoading.style.display = 'flex';
      await fetch('/whatsapp/clear', { method: 'POST' });
      lastTimestamp = null;
      setTimeout(window.checkStatus, 1500);
    } catch (err) {
      alert('Failed to reset: ' + err.message);
    }
  };

  // Immediate check then poll every 2.5s
  window.checkStatus();
  setInterval(window.checkStatus, 2500);
})();
`);
});

// 4. HTML Scan Portal
router.get('/scan', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mafqoudat — WhatsApp Device Link</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: rgba(22, 30, 49, 0.85);
      --border: rgba(255, 255, 255, 0.1);
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --primary: #25D366;
      --card-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.6);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--bg);
      background-image: 
        radial-gradient(at 0% 0%, rgba(37, 211, 102, 0.12) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(56, 189, 248, 0.1) 0px, transparent 50%);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    .container {
      width: 100%;
      max-width: 500px;
    }

    .brand-header {
      text-align: center;
      margin-bottom: 1.75rem;
    }

    .brand-header h1 {
      font-size: 1.85rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
    }

    .brand-header h1 span {
      background: linear-gradient(135deg, #25D366, #38bdf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-header p {
      color: var(--text-muted);
      font-size: 0.95rem;
      margin-top: 0.35rem;
    }

    .card {
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--border);
      border-radius: 1.25rem;
      padding: 2rem;
      box-shadow: var(--card-shadow);
      text-align: center;
    }

    .badge-status {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.9rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }

    .badge-waiting {
      background: rgba(234, 179, 8, 0.15);
      color: #facc15;
      border: 1px solid rgba(234, 179, 8, 0.3);
    }

    .badge-connected {
      background: rgba(37, 211, 102, 0.15);
      color: #4ade80;
      border: 1px solid rgba(37, 211, 102, 0.3);
    }

    .badge-status .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
      box-shadow: 0 0 10px currentColor;
      animation: pulse 1.8s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }

    .qr-frame {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      padding: 1.25rem;
      border-radius: 1rem;
      margin: 0.5rem auto 1.5rem auto;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
      min-width: 280px;
      min-height: 280px;
    }

    .qr-frame img {
      display: block;
      border-radius: 6px;
      width: 260px;
      height: 260px;
      image-rendering: pixelated;
    }

    .qr-spinner {
      color: #64748b;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.9rem;
    }

    .spinner-icon {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(0,0,0,0.1);
      border-top-color: #25D366;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .instructions {
      text-align: left;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 0.75rem;
      padding: 1rem 1.25rem;
      font-size: 0.9rem;
      color: #cbd5e1;
      margin-bottom: 1.5rem;
    }

    .instructions ol {
      padding-left: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .instructions strong {
      color: #fff;
    }

    .connected-box {
      display: none;
      padding: 1rem 0;
    }

    .connected-box .check-circle {
      width: 72px;
      height: 72px;
      background: rgba(37, 211, 102, 0.15);
      border: 2px solid #25D366;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      color: #25D366;
      font-size: 2.2rem;
    }

    .connected-box h3 {
      font-size: 1.35rem;
      color: #f8fafc;
      margin-bottom: 0.5rem;
    }

    .connected-box p {
      color: var(--text-muted);
      font-size: 0.92rem;
      line-height: 1.5;
    }

    .btn-danger {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
      padding: 0.65rem 1.25rem;
      font-size: 0.9rem;
      font-weight: 500;
      border-radius: 0.6rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .btn-danger:hover {
      background: rgba(239, 68, 68, 0.25);
      color: #fff;
    }

    .direct-link {
      margin-top: 1rem;
      font-size: 0.82rem;
      color: var(--text-muted);
    }
    .direct-link a {
      color: #38bdf8;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand-header">
      <h1>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #25D366;">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
        <span>Mafqoudat</span> WhatsApp
      </h1>
      <p>Multi-Device Service Connection & Auth</p>
    </div>

    <div class="card">
      <div id="statusBadge" class="badge-status badge-waiting">
        <span class="pulse-dot"></span>
        <span id="statusText">Checking WhatsApp connection...</span>
      </div>

      <!-- SCANNING UI (Shown when disconnected) -->
      <div id="scanSection">
        <div class="qr-frame">
          <img id="qrImg" src="/whatsapp/qr.png" alt="Scan WhatsApp QR" style="display: none;" />
          <div id="qrLoading" class="qr-spinner">
            <div class="spinner-icon"></div>
            <span>Generating QR code...</span>
          </div>
        </div>

        <div class="instructions">
          <ol>
            <li>Open <strong>WhatsApp</strong> on your phone</li>
            <li>Tap <strong>Settings</strong> (or <strong>Menu ⋮</strong>)</li>
            <li>Select <strong>Linked Devices</strong> &rarr; <strong>Link a Device</strong></li>
            <li>Point your camera at this QR code to link</li>
          </ol>
        </div>

        <div class="direct-link">
          Can't see the code? Open the <a href="/whatsapp/qr.png" target="_blank">direct QR image</a>.
        </div>
      </div>

      <!-- CONNECTED UI (Shown when connected) -->
      <div id="connectedSection" class="connected-box">
        <div class="check-circle">&#10003;</div>
        <h3>WhatsApp Connected!</h3>
        <p>Your session is active and securely saved in MongoDB.<br>Match notifications and social publishing alerts will be delivered automatically.</p>
      </div>

      <div style="margin-top: 1.25rem;">
        <button id="resetBtn" class="btn-danger" onclick="clearSession()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          Reset / Re-link
        </button>
      </div>
    </div>
  </div>

  <!-- External self-hosted script complies with strict CSP (scriptSrc: 'self') -->
  <script src="/whatsapp/scan.js"></script>
</body>
</html>`);
});

// 5. JSON Status endpoint
router.get('/status', (req, res) => {
  try {
    const status = whatsappService.getStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Failed to get status' });
  }
});

// 6. Clear session & force reconnect
router.post('/clear', async (req, res) => {
  try {
    await whatsappService.clearSession();
    res.json({ success: true, message: 'Session cleared and reconnect initiated' });
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Failed to clear session' });
  }
});

// 7. Internal authenticated send endpoint (used by worker/local instances when WhatsApp is disabled locally)
router.post('/send-internal', async (req, res) => {
  try {
    const secret = req.headers['x-internal-secret'];
    const expectedSecret = process.env.INTERNAL_API_SECRET || process.env.JWT_SECRET;
    if (!secret || !expectedSecret || secret !== expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { jid, message } = req.body;
    if (!jid || !message) {
      return res.status(400).json({ error: 'Missing jid or message' });
    }

    if (!whatsappService.isConnected()) {
      return res.status(503).json({ error: 'WhatsApp service not connected on this instance' });
    }

    const sent = await whatsappService.queueMessageDirect(jid, message);
    return res.json({ success: !!sent });
  } catch (err) {
    console.error('[WhatsApp Route] /send-internal error:', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Internal error' });
  }
});

module.exports = router;
