const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegram(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
    }),
  });
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, drop, username } = req.body;

  try {
    let message = '';

    if (type === 'new_drop') {
      const conditionText =
        drop.condition === 'block'
          ? `⛏ <b>Block Height:</b> #${drop.unlockBlock?.toLocaleString()}`
          : drop.condition === 'payment'
          ? `₿ <b>Trigger Payment:</b> <code>${drop.triggerAddress}</code>`
          : `⚡ <b>Block #${drop.unlockBlock?.toLocaleString()} + BTC Payment</b>`;

      message = `🔐 <b>NEW DEAD DROP LOCKED</b>

📌 <b>${drop.title}</b>
${drop.desc}

<b>Unlock Condition:</b>
${conditionText}

🌐 <a href="https://satoshivault.vercel.app">View on SatoshiVault</a>

<i>A secret has been locked on Bitcoin L1. It will auto-reveal when conditions are met.</i>`;
    }

    else if (type === 'drop_unlocked') {
      message = `🔓 <b>DEAD DROP UNLOCKED!</b>

📌 <b>${drop.title}</b>
${drop.desc}

✅ Unlock conditions have been met on Bitcoin L1.
The creator can now reveal the secret.

🌐 <a href="https://satoshivault.vercel.app">Read the secret on SatoshiVault</a>

<i>This drop was verified and unlocked by Bitcoin L1 smart contract.</i>`;
    }

    else if (type === 'drop_revealed') {
      message = `🌐 <b>SECRET REVEALED!</b>

📌 <b>${drop.title}</b>

The secret message has been submitted and verified on-chain.

🔗 SHA-256: <code>${drop.hash?.substring(0, 32)}...</code>

🌐 <a href="https://satoshivault.vercel.app">Read it on SatoshiVault</a>`;
    }

    else if (type === 'new_watcher') {
      message = `👁 <b>New Watcher</b>

<b>${drop.title}</b> has a new subscriber${username ? ` (${username})` : ''}.`;
    }

    else if (type === 'price_alert') {
      message = `📉 <b>DROP PRICE CHANGE</b>

<b>${drop.title}</b>
Previous unlock block: #${drop.oldBlock?.toLocaleString()}
New unlock block: #${drop.newBlock?.toLocaleString()}

🌐 <a href="https://satoshivault.vercel.app">View on SatoshiVault</a>`;
    }

    if (message) {
      const result = await sendTelegram(message);
      return res.status(200).json({ ok: true, telegram: result });
    }

    return res.status(400).json({ error: 'Unknown notification type' });

  } catch (err) {
    console.error('Telegram notify error:', err);
    return res.status(500).json({ error: err.message });
  }
}
