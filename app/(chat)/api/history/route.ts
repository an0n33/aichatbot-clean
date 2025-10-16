export async function GET() {
  return Response.json(
    { items: [], cursor: null },
    { status: 200, headers: { "cache-control": "no-store" } }
  );
}
