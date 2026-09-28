import { Languages } from "lucide-react";
import { lang, LANG_LABELS, LANGS, setLang, t } from "@/lib/i18n";

/**
 * Indonesian / English switch (PRD 8.1, header).
 *
 * A segmented pair rather than a dropdown: there are exactly two languages, and
 * the one you are reading should be legible without opening anything. Switching
 * reloads the page — see `src/lib/i18n.ts` for why — so these are real buttons
 * with a `lang` attribute, letting a screen reader pronounce each label in its
 * own language.
 */
export function LanguageToggle() {
  return (
    <div
      role="group"
      aria-label={t("Pilih bahasa")}
      className="flex h-8 shrink-0 items-center border border-line bg-white"
    >
      <Languages
        size={13}
        aria-hidden="true"
        className="mx-1.5 shrink-0 text-muted"
      />
      {LANGS.map((code) => {
        const isActive = code === lang;
        return (
          <button
            key={code}
            type="button"
            lang={code}
            aria-pressed={isActive}
            title={LANG_LABELS[code].full}
            onClick={() => setLang(code)}
            className={`h-full w-8 border-l border-line text-label font-medium transition-colors ${
              isActive
                ? "bg-cobalt text-white"
                : "bg-white text-muted hover:bg-paper hover:text-ink"
            }`}
            style={{ transitionDuration: "var(--hover-duration)" }}
          >
            {LANG_LABELS[code].short}
          </button>
        );
      })}
    </div>
  );
}
