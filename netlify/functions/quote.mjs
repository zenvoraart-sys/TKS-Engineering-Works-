import quoteHandler from '../../api/quote.js';

// Adapts the shared Node-style handler in api/quote.js to Netlify Functions.
export default async (req) => {
  let body;
  if (req.method === 'POST') {
    try {
      body = await req.json();
    } catch {
      return Response.json({ message: 'Invalid request.' }, { status: 400 });
    }
  }
  const headers = new Headers();
  let result = new Response(null, { status: 500 });
  const res = {
    setHeader: (name, value) => headers.set(name, value),
    status: (code) => ({
      json: (data) => {
        result = Response.json(data, { status: code, headers });
        return result;
      },
    }),
  };
  await quoteHandler({ method: req.method, body }, res);
  return result;
};

export const config = { path: '/api/quote' };
