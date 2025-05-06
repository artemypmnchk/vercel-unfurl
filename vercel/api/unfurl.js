// Vercel Serverless Function for Pachca Unfurling Bot
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { message_id, url } = req.body || {};
    if (!message_id || !url) {
      res.status(400).json({ error: 'Missing message_id or url' });
      return;
    }

    // Fetch link metadata (simple example: fetch <title> from page)
    const page = await fetch(url).then(r => r.text());
    const titleMatch = page.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : url;

    // Compose preview
    const preview = {
      link_previews: {
        [url]: {
          title,
          description: '',
          image_url: ''
        }
      }
    };

    // Send preview to Pachca API
    const apiRes = await fetch(`https://api.pachca.com/api/shared/v1/messages/${message_id}/link_previews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PACHCA_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preview)
    });

    if (!apiRes.ok) {
      const err = await apiRes.text();
      res.status(502).json({ error: 'Pachca API error', details: err });
      return;
    }

    res.status(200).json({ status: 'ok' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
