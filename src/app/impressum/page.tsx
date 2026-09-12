import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Impressum – FamilienReisePlaner",
};

export default function ImpressumPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 pt-10 pb-16">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Impressum</h1>

      <section className="mb-6">
        <h2 className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Angaben gemäß § 5 TMG
        </h2>
        <p className="text-foreground">
          Sebastian Rentsch
          <br />
          Mittelweg 2
          <br />
          38176 Wendeburg
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
        </h2>
        <p className="text-foreground">Sebastian Rentsch (Anschrift wie oben)</p>
      </section>

      <Link href="/" className="text-sm text-zinc-500 hover:text-foreground dark:text-zinc-400">
        ← Zurück
      </Link>
    </div>
  );
}
