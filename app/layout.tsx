import "./globals.css";

export const metadata = {
  title: "MOLLET EN ALERTA",
  description:
    "Plataforma ciutadana independent d'incidències i millora de Mollet del Vallès. No és una aplicació oficial de l'Ajuntament.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // L'atribut `lang` es corregeix a app/[locale]/layout.tsx (LangSetter) segons
  // l'idioma de la ruta. Aquí es deixa "ca" com a valor per defecte.
  return (
    <html lang="ca">
      <body>{children}</body>
    </html>
  );
}
