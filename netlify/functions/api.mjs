import serverless from 'serverless-http';
import app from '../../server/src/app.js';

const expressHandler = serverless(app, { binary: ['image/*'] });

// Bridge the web Request/Response API to the Express app.
export default async (req) => {
  const url = new URL(req.url);
  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const body = hasBody ? Buffer.from(await req.arrayBuffer()).toString('base64') : '';
  const multiValueQueryStringParameters = {};
  for (const [key, value] of url.searchParams) (multiValueQueryStringParameters[key] ||= []).push(value);

  const result = await expressHandler({
    httpMethod: req.method,
    path: url.pathname,
    headers: Object.fromEntries(req.headers),
    multiValueQueryStringParameters,
    queryStringParameters: Object.fromEntries(url.searchParams),
    body,
    isBase64Encoded: hasBody
  }, {});

  const headers = new Headers();
  for (const [key, value] of Object.entries(result.headers || {})) headers.set(key, String(value));
  for (const [key, values] of Object.entries(result.multiValueHeaders || {})) for (const v of values) headers.append(key, String(v));
  const responseBody = result.isBase64Encoded ? Buffer.from(result.body || '', 'base64') : result.body;
  return new Response(req.method === 'HEAD' ? null : responseBody, { status: result.statusCode, headers });
};

export const config = { path: '/api/*' };
