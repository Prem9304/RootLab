// app/api/wrk/stop/route.js
import { NextResponse } from "next/server";

export async function POST() {
  try {
    if (global.__wrkProcess) {
      global.__wrkProcess.kill("SIGKILL");
      global.__wrkProcess = null;
      return NextResponse.json({ status: "killed" });
    }
    return NextResponse.json({ status: "no_process" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
