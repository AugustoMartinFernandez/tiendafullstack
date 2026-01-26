"use client";

import { useAuth } from "@/context/auth-context";
import { LoginButton } from "@/components/ui/login-button";
import { clientLogout } from "@/lib/auth-client";
import Link from "next/link";
import { useState } from "react";
import { User, LogOut, Package, UserCircle, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function UserMenu() {
  const { user, profile, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-1 pr-3 rounded-full border border-gray-100 bg-white">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-4 rounded-md" />
      </div>
    );
  }

  if (!user) return <LoginButton />;

  // Helper para obtener inicial
  const getInitial = () => {
    if (profile?.displayName) return profile.displayName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pr-3 rounded-full border border-gray-100 hover:bg-gray-50 transition-all bg-white"
      >
        <div className="relative h-8 w-8 overflow-hidden rounded-full bg-indigo-100 border border-indigo-50">
          {profile?.profilePhoto ? (
            <img src={profile.profilePhoto} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-bold text-xs">
              {getInitial()}
            </div>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 py-2 z-40 animate-in fade-in zoom-in-95 origin-top-right">
            <div className="px-4 py-3 border-b border-gray-50 mb-2">
              <p className="text-sm font-black text-gray-900 truncate">{profile?.displayName || "Usuario"}</p>
              <p className="text-xs font-medium text-gray-500 truncate">{user.email}</p>
            </div>
            
            <Link 
              href="/perfil" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              <UserCircle className="h-4 w-4" /> Mi Perfil
            </Link>
            
            <Link 
              href="/mis-pedidos" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              <Package className="h-4 w-4" /> Mis Pedidos
            </Link>

            <div className="border-t border-gray-50 mt-2 pt-2">
              <button
                onClick={() => {
                  clientLogout();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" /> Cerrar Sesión
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
