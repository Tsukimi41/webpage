import { dev } from 'astro';

// Use the API so the test runner owns a foreground server in agent environments too.
const server = await dev({ server: { host: '127.0.0.1', port: 4321 }, devToolbar: { enabled: false } });
const stop = async () => { await server.stop(); process.exit(0); };
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
