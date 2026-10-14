import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import quoteHandler from './api/quote.js';

const quoteApi = {
  name: 'quote-api',
  configureServer(server: import('vite').ViteDevServer) {
    server.middlewares.use('/api/quote', async (req, res) => {
      const chunks: Uint8Array[] = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 4_500_000) {
          res.statusCode = 413;
          res.end(JSON.stringify({ message: 'Request is too large.' }));
          return;
        }
        chunks.push(chunk);
      }
      try {
        (req as typeof req & { body?: unknown }).body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch {
        res.statusCode = 400;
        res.end(JSON.stringify({ message: 'Invalid request.' }));
        return;
      }
      const response = {
        setHeader: (name: string, value: string) => res.setHeader(name, value),
        status: (code: number) => {
          res.statusCode = code;
          return { json: (data: unknown) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); } };
        },
      };
      await quoteHandler(req as never, response as never);
    });
  },
};

export default defineConfig({
  plugins: [react(), quoteApi],
});
