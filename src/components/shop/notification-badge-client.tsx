"use client";

import { useEffect, useState, useRef } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { Bell } from "lucide-react";

interface Props {
  initialCount?: number;
}

export function NotificationBadgeClient({ initialCount = 0 }: Props) {
  const { user } = useAuth();
  const [count, setCount] = useState(initialCount);
  const [isShaking, setIsShaking] = useState(false);
  const prevCountRef = useRef(initialCount);

  useEffect(() => {
    if (!user) return;

    // Suscripción en tiempo real a notificaciones no leídas
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newCount = snapshot.size;
      
      // Si el número de notificaciones aumentó, activamos la sacudida
      if (newCount > prevCountRef.current) {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 600); // Duración de la animación
      }
      
      prevCountRef.current = newCount;
      setCount(newCount);
    }, (error) => {
      console.error("Error en notificaciones realtime:", error);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="relative">
      <style>{`
        @keyframes bell-shake {
          0% { transform: rotate(0); }
          15% { transform: rotate(15deg); }
          30% { transform: rotate(-15deg); }
          45% { transform: rotate(10deg); }
          60% { transform: rotate(-10deg); }
          75% { transform: rotate(5deg); }
          85% { transform: rotate(-5deg); }
          100% { transform: rotate(0); }
        }
      `}</style>
      <Bell 
        className={`h-6 w-6 group-hover:scale-110 transition-transform ${isShaking ? "text-indigo-600" : ""}`} 
        style={{ animation: isShaking ? "bell-shake 0.6s ease-in-out" : "none" }}
      />
      
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-in zoom-in">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </div>
  );
}
