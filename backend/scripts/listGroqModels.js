// backend/scripts/listGroqModels.js
//
// One-off diagnostic: lists every model your GROQ_API_KEY can actually
// access right now. Run with: node backend/scripts/listGroqModels.js
// (requires GROQ_API_KEY to be set in your environment / .env)

import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
  if (!process.env.GROQ_API_KEY) {
    console.error('GROQ_API_KEY is not set. Add it to your .env first.');
    process.exit(1);
  }

  const response = await fetch('https://api.groq.com/openai/v1/models', {
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error(`Groq API error (${response.status}): ${text}`);
    process.exit(1);
  }

  const data = await response.json();

  console.log(`\nFound ${data.data.length} available models:\n`);

  data.data
    .filter((m) => m.active)
    .sort((a, b) => a.id.localeCompare(b.id))
    .forEach((m) => {
      console.log(`  ${m.id}  (owned by: ${m.owned_by}, context: ${m.context_window})`);
    });

  console.log('\nSet GROQ_MODEL in your .env to whichever one you want to use.\n');
}

listModels().catch((err) => {
  console.error('Failed to list models:', err.message);
  process.exit(1);
});