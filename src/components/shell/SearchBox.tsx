import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Search } from "lucide-react";
import {
  flatten,
  search,
  type SearchKind,
  type SearchResult,
} from "@/lib/search";

const KIND_ACCENT: Record<SearchKind, string> = {
  unit: "bg-cyan text-navy",
  dept: "bg-paper text-ink",
  process: "bg-navy text-white",
  step: "bg-yellow text-navy",
};

/** Does this element already own the keys we want to grab? */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

/**
 * Header search across units, departments, processes and Level 1 steps.
 *
 * Built as an ARIA combobox: focus stays in the input and `aria-activedescendant`
 * moves the cursor through the options, so the whole feature works from the
 * keyboard — `/` or ⌘K to focus, arrows to walk, Enter to go, Escape to leave.
 */
export function SearchBox() {
  const [query, setQuery] = useState("");
  // The cursor is stored with the query it belongs to, so a new query resets
  // it during render instead of in an effect.
  const [cursor, setCursor] = useState({ query: "", index: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const groups = useMemo(() => search(query), [query]);
  const results = useMemo(() => flatten(groups), [groups]);
  const showList = isOpen && results.length > 0;

  const activeIndex = cursor.query === query ? cursor.index : 0;
  const activeId = showList ? `search-option-${activeIndex}` : undefined;
  const setActiveIndex = (index: number) => setCursor({ query, index });

  /** Position of each result in the flat arrow-key order. */
  const indexById = useMemo(
    () => new Map(results.map((result, index) => [result.id, index])),
    [results],
  );

  // `/` and ⌘K reach the search from anywhere on the page.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isSlash = event.key === "/" && !event.metaKey && !event.ctrlKey;
      const isCommandK =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (!isSlash && !isCommandK) return;
      if (isTypingTarget(event.target)) return;

      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Keep the highlighted option in view when arrowing past the fold.
  useEffect(() => {
    if (!showList) return;
    listRef.current
      ?.querySelector(`#search-option-${activeIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, showList]);

  const go = (result: SearchResult) => {
    navigate(result.href);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      // Do not let this reach the detail panel's own Escape handler.
      event.stopPropagation();
      if (query) {
        setQuery("");
      } else {
        setIsOpen(false);
        inputRef.current?.blur();
      }
      return;
    }

    if (!showList) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((activeIndex + step + results.length) % results.length);
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActiveIndex(event.key === "Home" ? 0 : results.length - 1);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      const result = results[activeIndex];
      if (result) go(result);
    }
  };

  return (
    /*
     * Shown from 1200px up. Below that the tabs and toolbar leave it under
     * ~150px, which is too narrow to read a result in — the keyboard shortcut
     * would open a field you cannot use.
     */
    <div className="relative mx-3 hidden min-w-0 flex-1 items-center min-[1200px]:flex">
      <Search
        size={14}
        aria-hidden="true"
        className="pointer-events-none absolute left-2 text-muted"
      />
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls="search-listbox"
        aria-activedescendant={activeId}
        aria-autocomplete="list"
        aria-label="Cari unit, departemen, proses, atau langkah"
        placeholder="Cari unit, proses, langkah…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={onKeyDown}
        className="h-8 w-full max-w-96 min-w-36 border border-line bg-white pr-2 pl-7 text-label text-ink placeholder:text-muted"
      />

      {showList ? (
        <div
          ref={listRef}
          id="search-listbox"
          role="listbox"
          aria-label="Hasil pencarian"
          className="absolute top-full left-0 z-40 mt-1 max-h-[70vh] w-[30rem] max-w-[85vw] overflow-y-auto border border-line bg-white shadow-[0_8px_24px_rgba(18,18,58,0.16)]"
        >
          {groups.map((group) => (
            <div key={group.kind} role="group" aria-label={group.label}>
              <p
                aria-hidden="true"
                className="border-b border-line bg-paper px-3 py-1 text-badge font-demi text-muted"
              >
                {group.label}
              </p>

              {group.results.map((result) => {
                const index = indexById.get(result.id) ?? 0;
                const isActive = index === activeIndex;

                return (
                  <div
                    key={result.id}
                    id={`search-option-${index}`}
                    role="option"
                    aria-selected={isActive}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => go(result)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`flex cursor-pointer items-start gap-2 border-b border-line px-3 py-1.5 last:border-b-0 ${
                      isActive ? "bg-cyan/25" : "bg-white"
                    }`}
                  >
                    {result.badge ? (
                      <span
                        className={`mt-0.5 shrink-0 px-1 text-badge font-demi tabular-nums ${KIND_ACCENT[result.kind]}`}
                      >
                        {result.badge}
                      </span>
                    ) : null}
                    <span className="flex min-w-0 flex-col">
                      <span className="text-table leading-tight font-medium text-ink">
                        {result.label}
                      </span>
                      <span className="text-badge leading-tight text-muted">
                        {result.context}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
