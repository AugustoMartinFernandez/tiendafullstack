import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Borramos la cookie __session
    cookieStore.delete("__session");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API Logout] Error cerrando sesión:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
