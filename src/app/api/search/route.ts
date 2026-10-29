import { NextResponse, type NextRequest } from "next/server";
import { quickSearch } from "@/lib/works/queries";

export const dynamic = "force-dynamic";

// Public search used by the header search box. Only published writing is searched.
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 100);
  try {
    const results = await quickSearch(q);
    return NextResponse.json(results, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Search failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Search is temporarily unavailable." }, { status: 500 });
  }
}
