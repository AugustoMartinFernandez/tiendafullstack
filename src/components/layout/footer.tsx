const footerNavigation = {
  shop: [
    { name: "Remeras", href: "#" },
    { name: "Pantalones", href: "#" },
    { name: "Accesorios", href: "#" },
    { name: "Nuevos", href: "#" },
  ],
  company: [
    { name: "Sobre Nosotros", href: "#" },
    { name: "Términos", href: "#" },
    { name: "Privacidad", href: "#" },
  ],
  legal: [
    { name: "Política de Reembolso", href: "#" },
    { name: "Envíos", href: "#" },
  ],
};

export function Footer({ storeName }: { storeName: string }) {
  return (
    <footer className="bg-muted/30" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {storeName}
            </span>
            <p className="text-sm leading-6 text-muted-foreground">
              Haciendo que tu estilo hable por vos. Envíos a todo el país.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-foreground">
                  Tienda
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  {footerNavigation.shop.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className="text-sm leading-6 text-muted-foreground hover:text-foreground"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-foreground">
                  Empresa
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  {footerNavigation.company.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className="text-sm leading-6 text-muted-foreground hover:text-foreground"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-border pt-8 sm:mt-20 lg:mt-24">
          <p className="text-xs leading-5 text-muted-foreground">
            &copy; {new Date().getFullYear()} {storeName}, Inc. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}