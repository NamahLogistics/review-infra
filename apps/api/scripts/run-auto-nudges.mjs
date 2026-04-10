const baseUrl = process.env.API_BASE_URL;
const cronSecret = process.env.CRON_SECRET;

if (!baseUrl || !cronSecret) {
  console.error('Missing API_BASE_URL or CRON_SECRET');
  process.exit(1);
}

const res = await fetch(`${baseUrl}/cron/run-auto-nudges`, {
  method: 'POST',
  headers: {
    'x-cron-secret': cronSecret,
  },
});

const text = await res.text();
console.log(text);

if (!res.ok) {
  process.exit(1);
}
