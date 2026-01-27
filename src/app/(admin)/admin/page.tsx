import { getHomeConfig } from "@/lib/db";
import { updateHomeConfig } from "@/lib/actions/settings";

export default async function AdminPage() {
  // 1. Leemos la configuración actual para mostrarla en el formulario
  const config = await getHomeConfig();

  return (
    <div className="min-h-screen bg-muted/20 p-8">
      <div className="mx-auto max-w-2xl bg-background border border-border rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          Editor del Home
        </h1>

        {/* El formulario llama a la Server Action que creamos antes */}
        <form action={async (formData) => {
          "use server";
          await updateHomeConfig(formData);
        }} className="space-y-6">
          
          {/* Título */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Título Principal</label>
            <input
              name="title"
              defaultValue={config.hero.title}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {/* Subtítulo */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Subtítulo</label>
            <textarea
              name="subtitle"
              defaultValue={config.hero.subtitle}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {/* Badge (Etiqueta chica) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Etiqueta (Badge)</label>
              <input
                name="badgeText"
                defaultValue={config.hero.badgeText}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            
            {/* Texto Botón */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Texto Botón</label>
              <input
                name="buttonText"
                defaultValue={config.hero.buttonText}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* URL Imagen */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">URL de Imagen</label>
            <input
              name="imageUrl"
              defaultValue={config.hero.imageUrl}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">Pega el link de la foto aquí.</p>
          </div>

          {/* Campos ocultos (para mantener datos que no editamos hoy) */}
          <input type="hidden" name="buttonUrl" value={config.hero.buttonUrl} />

          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Guardar Cambios
          </button>
        </form>
      </div>
    </div>
  );
}