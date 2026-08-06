import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const { data } = await supabase
    .from("games")
    .select("target_url")
    .eq("slug", slug)
    .single();

  if (!data?.target_url) {
    return new NextResponse("Game not found", { status: 404 });
  }

  try {
    const res = await fetch(data.target_url);
    const htmlContent = await res.text();

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Frame-Options": "ALLOWALL",
      },
    });
  } catch (err) {
    console.error("Error fetching game HTML:", err);
    return new NextResponse("Failed to load game", { status: 500 });
  }
}
