import { Truck, ShieldCheck, Zap } from "lucide-react";

// Definimos qué datos recibe esta sección
interface Feature {
  title: string;
  description: string;
  iconName: "truck" | "shield" | "zap"; // Limitamos los iconos por ahora
}

interface AboutProps {
  title: string;
  description: string;
  features: Feature[];
}

export function AboutSection({ title, description, features }: AboutProps) {
  // Un mapa simple para elegir el ícono según el nombre
  const iconMap = {
    truck: Truck,
    shield: ShieldCheck,
    zap: Zap,
  };

  return (
    <section className="bg-secondary/30 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary">
            Sobre Nosotros
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = iconMap[feature.iconName];
              return (
                <div key={feature.title} className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                    <Icon className="h-5 w-5 flex-none text-primary" aria-hidden="true" />
                    {feature.title}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </section>
  );
}