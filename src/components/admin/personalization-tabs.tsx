"use client";

import React, { useState } from "react";
import { HomeConfig } from "@/lib/actions/settings";
import { HeroEditor } from "./hero-editor";
import { BenefitsEditor } from "./benefits-editor";
import { FaqEditor } from "./faq-editor";

type Props = {
  initialData: HomeConfig | null;
};

export default function PersonalizationTabs({ initialData }: Props) {
  const [active, setActive] = useState<"hero" | "benefits" | "faq">("hero");

  const heroData = initialData?.hero ?? undefined;
  const benefitsData = initialData?.benefits ?? undefined;
  const faqsData = initialData?.faqs ?? undefined;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setActive("hero")} className={`px-4 py-2 rounded ${active === "hero" ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>Hero</button>
        <button onClick={() => setActive("benefits")} className={`px-4 py-2 rounded ${active === "benefits" ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>Beneficios</button>
        <button onClick={() => setActive("faq")} className={`px-4 py-2 rounded ${active === "faq" ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>FAQ</button>
      </div>

      <div className="mt-4">
        {active === "hero" && <HeroEditor initialData={heroData as any} />}
        {active === "benefits" && <BenefitsEditor initialData={benefitsData as any} />}
        {active === "faq" && <FaqEditor initialData={faqsData as any} />}
      </div>
    </div>
  );
}