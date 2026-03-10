// api/poll.js
// Called by Vercel Cron every 5 minutes to check for newly unlocked drops
// Add to vercel.json: { "crons": [{ "path": "/api/poll", "schedule": "*/5 * * * *" }] }

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';

async function sendTelegram(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
    }),
  });
}

async function getCurrentBlock() {
  try {
    const res = await fetch('https://regtest.opnet.org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
    });
    const data = await res.json();
    return parseInt(data.result, 16);
  } catch (e) {
    return 0;
  }
}

export default async function handler(req, res) {
  // Allow GET for manual testing, otherwise only cron
  const currentBlock = await getCurrentBlock();

  // In production this would query the contract for all drops
  // and check which ones just became unlockable
  // For now we simulate the logic

  const unlocked = [];

  // TODO: Replace with real contract call:
  // const count = await contract.getDropCount();
  // for each drop, call checkUnlock(dropId) and track newly unlocked

  if (unlocked.length > 0) {
    for (const drop of unlocked) {
      await sendTelegram(`🔓 <b>DEAD DROP UNLOCKED!</b>

📌 <b>${drop.title}</b>

✅ Unlock conditions met at block #${currentBlock.toLocaleString()}

🌐 <a href="https://satoshivault.vercel.app">Read on SatoshiVault</a>`);
    }
  }

  return res.status(200).json({
    ok: true,
    currentBlock,
    checked: new Date().toISOString(),
    unlocked: unlocked.length,
  });
}
