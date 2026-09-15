import { getDictionary, LOCALES, type Locale } from "@/lib/i18n/get-dictionary";
import { DictionaryProvider } from "@/lib/i18n/dictionary-context";
import { NavBar } from "@/components/NavBar";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { LangSetter } from "@/components/LangSetter";
import Link from "next/link";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!LOCALES.includes(params.locale as Locale)) notFound();
  const dict = getDictionary(params.locale);
  const locale = params.locale as Locale;

  return (
    <DictionaryProvider dict={dict} locale={locale}>
      <LangSetter locale={locale} />
      <a href="#main" className="skip-link">
        {locale === "ca" ? "Vés al contingut principal" : "Ir al contenido principal"}
      </a>
      <NavBar />
      <DisclaimerBanner />
      <main id="main">{children}</main>
      <footer>
        {locale === "ca"
          ? "MOLLET EN ALERTA · Plataforma ciutadana independent · No oficial de l'Ajuntament de Mollet del Vallès"
          : "MOLLET EN ALERTA · Plataforma ciudadana independiente · No oficial del Ayuntamiento de Mollet del Vallès"}
        {" · "}
        <Link href={`/${locale}/transparencia`}>{dict.transparency.sources}</Link>
      </footer>
    </DictionaryProvider>
  );
}
