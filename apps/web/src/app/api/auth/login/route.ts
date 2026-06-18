import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  // Use plain supabase-js (no SSR) to get tokens
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    return NextResponse.json({ error: error?.message ?? "Login failed" }, { status: 401 });
  }

  const { access_token, refresh_token, expires_in } = data.session;
  const projectRef = "ukkjamcqwcfxdhqpkcvx";

  // Build the session object that @supabase/ssr expects
  const sessionValue = JSON.stringify(data.session);

  const response = NextResponse.json({ success: true });

  // Set cookies exactly as @supabase/ssr reads them
  const cookieOptions = {
    path: "/",
    maxAge: expires_in,
    httpOnly: false,
    sameSite: "lax" as const,
    secure: false, // localhost
  };

  response.cookies.set(`sb-${projectRef}-auth-token`, sessionValue, cookieOptions);
  response.cookies.set(`sb-${projectRef}-auth-token-code-verifier`, "", {
    path: "/",
    maxAge: 0,
  });

  return response;
}
