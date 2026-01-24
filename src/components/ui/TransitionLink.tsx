// src/components/ui/transition-link.tsx
"use client";

import Link, { LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

interface TransitionLinkProps extends LinkProps {
  children: ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  title?: string;
}

export function TransitionLink({ children, href, onClick, ...props }: TransitionLinkProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);

    // Si el navegador no soporta la API, dejamos que Next.js maneje la navegación normal
    if (!document.startViewTransition) {
      return;
    }

    // Prevenimos la navegación por defecto de Next.js para controlarla nosotros
    e.preventDefault();

    document.startViewTransition(async () => {
      router.push(href.toString());
      
      // Pequeño hack: Esperamos un momento para asegurar que React comience el renderizado
      // y el navegador capture el nuevo estado.
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
  };

  return (
    <Link {...props} href={href} onClick={handleClick}>
      {children}
    </Link>
  );
}
