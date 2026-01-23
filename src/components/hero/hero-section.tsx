import Link from "next/link";

// Estas son las "propiedades" que el Admin podrá cambiar después
interface HeroProps {
  title: string;
  subtitle: string;
  badgeText?: string; // El "?" significa que es opcional
  buttonText: string;
  buttonUrl: string;
  imageUrl: string;
}

export function HeroSection({
  title,
  subtitle,
  badgeText,
  buttonText,
  buttonUrl,
  imageUrl,
}: HeroProps) {
  return (
    <div className="relative overflow-hidden bg-background pt-16 pb-32 space-y-24">
      {/* Contenedor Principal */}
      <div className="relative">
        <div className="lg:mx-auto lg:grid lg:max-w-7xl lg:grid-flow-col-dense lg:grid-cols-2 lg:gap-24 lg:px-8">
          
          {/* Columna Izquierda: Texto */}
          <div className="mx-auto max-w-xl px-6 lg:mx-0 lg:max-w-none lg:px-0 lg:py-16">
            <div>
              {/* Badge Opcional (Ej: "Nueva Colección") */}
              {badgeText && (
                <div className="mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {badgeText}
                  </span>
                </div>
              )}

              <div className="mt-2">
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                  {title}
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                  {subtitle}
                </p>
                <div className="mt-6">
                  <Link
                    href={buttonUrl}
                    className="inline-flex rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors"
                  >
                    {buttonText}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Imagen */}
          <div className="mt-12 sm:mt-16 lg:mt-0">
            <div className="-mr-48 pl-6 md:-mr-16 lg:relative lg:m-0 lg:h-full lg:px-0">
              <img
                className="w-full rounded-xl shadow-xl ring-1 ring-black/5 lg:absolute lg:left-0 lg:h-full lg:w-auto lg:max-w-none"
                src={imageUrl}
                alt="Imagen de portada"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}