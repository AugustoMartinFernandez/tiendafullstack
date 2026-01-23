interface FaqItem {
  question: string;
  answer: string;
}

interface FaqProps {
  title: string;
  items: FaqItem[];
}

export function FaqSection({ title, items }: FaqProps) {
  return (
    <section className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Resolvemos tus dudas antes de que compres.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-2">
          {items.map((faq) => (
            <div key={faq.question} className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <dt className="text-lg font-semibold leading-7 text-foreground">
                {faq.question}
              </dt>
              <dd className="mt-2 text-base leading-7 text-muted-foreground">
                {faq.answer}
              </dd>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}