"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";

export function LoginButton() {
  return (
    <Link 
      href="/login"
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-200 hover:shadow-indigo-300"
    >
      <LogIn className="h-4 w-4" />
      <span>Ingresar</span>
    </Link>
  );
}