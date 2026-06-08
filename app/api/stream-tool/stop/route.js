// app/api/stream-tool/stop/route.js
import { NextResponse } from "next/server";

export async function POST() {
  try {
    if (global.__streamToolProcess) {
      global.__streamToolProcess.kill("SIGINT");
      global.__streamToolProcess = null;
      return NextResponse.json({ success: true, message: "Stream tool process stopped" });
    }
    return NextResponse.json({ success: true, message: "No process was running" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
