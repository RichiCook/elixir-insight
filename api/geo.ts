export const config = { runtime: 'edge' };

export default function handler(req: Request) {
  const country = req.headers.get('x-vercel-ip-country') ?? null;
  const cityRaw = req.headers.get('x-vercel-ip-city');
  const city = cityRaw ? decodeURIComponent(cityRaw) : null;
  const region = req.headers.get('x-vercel-ip-region') ?? null;
  return Response.json(
    { country, city, region },
    { headers: { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' } }
  );
}
