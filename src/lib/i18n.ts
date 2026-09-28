/**
 * Language selection — Indonesian and English.
 *
 * The language is read once, before React mounts, and does not change while the
 * app runs: switching writes the URL and reloads. That is deliberate. The
 * catalogue in `src/data` is a set of module-level constants computed at import
 * time, so a language that could change mid-session would mean rebuilding every
 * index on the fly or threading a language through every component that reads
 * one. A reload costs a repaint on a click nobody makes twice a minute, and it
 * is the only option that cannot leave half a page in the other language.
 */

export const LANGS = ["id", "en"] as const;

export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = "id";

/** Shareable state lives in the URL, and the language is part of what a link means. */
export const LANG_PARAM = "lang";

const STORAGE_KEY = "tni-bpmn.lang";

/** BCP-47 tag for `Intl` formatting — dates, numbers, collation. */
export const LOCALE: Record<Lang, string> = {
  id: "id-ID",
  en: "en-GB",
};

export const LANG_LABELS: Record<Lang, { short: string; full: string }> = {
  id: { short: "ID", full: "Bahasa Indonesia" },
  en: { short: "EN", full: "English" },
};

function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LANGS as readonly string[]).includes(value);
}

/** Reading storage throws in a locked-down browser; the default is fine there. */
function storedLang(): Lang | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isLang(stored) ? stored : null;
  } catch {
    return null;
  }
}

function rememberLang(next: Lang): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* Not being able to remember the choice is not a reason to refuse it. */
  }
}

/**
 * A link that names a language wins, so a shared URL opens the way its sender
 * saw it. Otherwise fall back to the last choice made on this browser.
 */
export function readLang(search = window.location.search): Lang {
  const fromUrl = new URLSearchParams(search).get(LANG_PARAM);
  if (isLang(fromUrl)) return fromUrl;
  return storedLang() ?? DEFAULT_LANG;
}

/** The language this page load is rendering in. Constant for the session. */
export const lang: Lang = typeof window === "undefined" ? DEFAULT_LANG : readLang();

/**
 * Switch language: remember the choice, put it in the URL so the address bar
 * stays shareable, and reload so every module re-reads the catalogue.
 */
export function setLang(next: Lang): void {
  if (next === lang) return;
  rememberLang(next);

  const url = new URL(window.location.href);
  if (next === DEFAULT_LANG) url.searchParams.delete(LANG_PARAM);
  else url.searchParams.set(LANG_PARAM, next);

  /* assign, not replace: Back should undo a language switch like any other. */
  window.location.assign(url.toString());
}

/** Picks the active language out of a translated pair. */
export function pick<T>(pair: Record<Lang, T>): T {
  return pair[lang];
}

/* ------------------------------------------------------------ Translation */

/**
 * Source text → the same sentence in each language.
 *
 * Keyed by the string as it appears in the code or the shipped JSON, so a call
 * site reads as the sentence it renders and a missing entry is obvious in
 * review. Both sides are stored rather than just the English, because the
 * source is not uniformly Indonesian: the map's flow labels shipped in English
 * ("Corporate strategy & business plan") while the outputs beside them shipped
 * in Indonesian. A one-way dictionary could only have fixed one of those, and
 * the Indonesian view would have kept its English patches.
 *
 * Strings that are the same in both languages — unit and department names, ISO
 * standards, system names, process codes — are not in here at all, because they
 * are never translated. `scripts/i18n-fields.mjs` is where that line is drawn.
 *
 * `npm test` fails if any translatable string is missing either side, which is
 * what stops one language leaking into the other.
 */
import dictionary from "@/data/translations.json";

const TRANSLATIONS: Record<string, Record<string, string>> = dictionary;

/**
 * Put one string into the reader's language.
 *
 * A string with no entry falls back to the source rather than rendering blank —
 * the completeness test, not a runtime throw, is what keeps that from shipping.
 */
export function t(source: string): string {
  return TRANSLATIONS[source]?.[lang] ?? source;
}

/** Entries the dictionary carries, for the completeness test. */
export function translationKeys(): string[] {
  return Object.keys(TRANSLATIONS);
}
