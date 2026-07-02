export const config = { runtime: 'edge' };

export default function handler(req: Request) {
  const country = req.headers.get('x-vercel-ip-country') ?? null;
  const cityRaw = req.headers.get('x-vercel-ip-city') ?? null;
  const region  = req.headers.get('x-vercel-ip-region') ?? null;

  let city = cityRaw;
  if (cityRaw) {
    try { city = decodeURIComponent(cityRaw); } catch { city = cityRaw; }
  }

  return Response.json(
    { country, city, region },
    { headers: { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' } }
  );
}
