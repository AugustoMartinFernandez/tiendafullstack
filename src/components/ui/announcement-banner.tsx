"use client";
import { useState } from "react";
import { X } from "lucide-react";

interface BannerProps {
  text: string;
  linkText?: string;
  linkUrl?: string;
}

export function AnnouncementBanner({ text, linkText, linkUrl }: BannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative isolate flex items-center gap-x-6 overflow-hidden bg-primary px-6 py-2.5 sm:px-3.5 sm:before:flex-1">
      {/* Fondo decorativo (opcional) */}
      <div
        className="absolute left-[max(-7rem,calc(50%-52rem))] top-1/2 -z-10 -translate-y-1/2 transform-gpu blur-2xl"
        aria-hidden="true"
      >
        <div
          className="aspect-577/310 w-144.25 bg-linear-to-r from-[#ff80b5] to-[#9089fc] opacity-30"
          style={{
            clipPath:
              "polygon(74.8% 41.9%, 97.2% 73.2%, 100% 34.9%, 92.5% 0.4%, 87.5% 0%, 75% 28.6%, 58.5% 54.6%, 50.1% 56.8%, 46.9% 44%, 48.3% 17.4%, 24.7% 53.9%, 0% 27.9%, 11.9% 74.2%, 24.9% 54.1%, 68.6% 100%, 74.8% 41.9%)",
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-sm leading-6 text-primary-foreground">
          <strong className="font-semibold">Novedad</strong>
          <svg
            viewBox="0 0 2 2"
            className="mx-2 inline h-0.5 w-0.5 fill-current"
            aria-hidden="true"
          >
            <circle cx={1} cy={1} r={1} />
          </svg>
          {text}
        </p>
        {linkText && linkUrl && (
          <a
            href={linkUrl}
            className="flex-none rounded-full bg-primary-foreground/10 px-3.5 py-1 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-foreground/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {linkText} <span aria-hidden="true">&rarr;</span>
          </a>
        )}
      </div>
      <div className="flex flex-1 justify-end">
        <button
          type="button"
          className="-m-3 p-3 focus-visible:-outline-offset-4"
          onClick={() => setIsVisible(false)}
        >
          <span className="sr-only">Cerrar</span>
          <X className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}