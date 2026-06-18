import { NextResponse } from "next/server";
import { smsConfigured, emailConfigured } from "@/lib/notifications";

export async function GET() {
  return NextResponse.json({
    sms: smsConfigured(),
    email: emailConfigured(),
    push: false, // Expo push wiring TODO
  });
}
