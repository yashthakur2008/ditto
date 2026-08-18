"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

type Props = {
  label: string;
  description?: string;
  required?: boolean;
  options: string[];
  value: string;
  onChange: (next: string) => void;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
};

/**
 * Accessible combobox with listbox popup and inline filtering.
 * Follows the WAI-ARIA Authoring Practices "Combobox with List Autocomplete,
 * Manual Selection" pattern: typing filters, arrow keys move the
 * aria-activedescendant, Enter selects, Esc closes.
 */
export function Combobox({
  label,
  description,
  required,
  options,
  value,
  onChange,
  error,
  placeholder = "Start typing to search…",
  autoComplete = "off",
}: Props) {
  const reactId = useId();
  const inputId = `cb-${reactId}`;
  const listId = `${inputId}-list`;
  const descId = description ? `${inputId}-desc` : undefined;
  const errorId = error ? `${inputId}-err` : undefined;
  const describedBy =
    [descId, errorId].filter(Boolean).join(" ") || undefined;

  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sync external value → query when not actively editing
  useEffect(() => {
    if (document.activeElement !== inputRef.current) setQuery(value);
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.toLowerCase().includes(q));
  }, [query, options]);

  // Reset activeIndex when filtered list changes
  useEffect(() => {
    if (!open) return;
    setActiveIndex(filtered.length > 0 ? 0 : -1);
  }, [filtered, open]);

  // Scroll active option into view
  useEffect(() => {
    if (!open || activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  // Click outside closes
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        // Restore query to the committed value if user clicked away mid-type
        setQuery(value);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open, value]);

  function commit(option: string) {
    onChange(option);
    setQuery(option);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex((i) =>
        filtered.length === 0 ? -1 : (i + 1) % filtered.length,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(filtered.length - 1);
        return;
      }
      setActiveIndex((i) =>
        filtered.length === 0
          ? -1
          : (i - 1 + filtered.length) % filtered.length,
      );
    } else if (e.key === "Home") {
      if (open && filtered.length) {
        e.preventDefault();
        setActiveIndex(0);
      }
    } else if (e.key === "End") {
      if (open && filtered.length) {
        e.preventDefault();
        setActiveIndex(filtered.length - 1);
      }
    } else if (e.key === "Enter") {
      if (open && activeIndex >= 0 && activeIndex < filtered.length) {
        e.preventDefault();
        commit(filtered[activeIndex]);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
        setQuery(value);
      }
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        className="font-[family-name:var(--font-display)] text-[var(--color-ink)] text-[0.95rem] font-semibold"
      >
        {label}
        {required ? (
          <span className="ml-2 text-[var(--color-ink-muted)] text-sm font-normal">
            (Required)
          </span>
        ) : null}
      </label>
      {description ? (
        <p
          id={descId}
          className="text-[var(--color-ink-muted)] text-sm leading-relaxed"
        >
          {description}
        </p>
      ) : null}
      <div ref={containerRef} className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && activeIndex >= 0
              ? `${listId}-opt-${activeIndex}`
              : undefined
          }
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          autoComplete={autoComplete}
          spellCheck={false}
          placeholder={placeholder}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKey}
          className="field-input pr-10"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]"
        >
          {open ? "▴" : "▾"}
        </span>
        {open ? (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={label}
            className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-30 max-h-72 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-white py-1 shadow-[0_8px_24px_-12px_rgba(60,40,20,0.18)]"
          >
            {filtered.length === 0 ? (
              <li
                role="option"
                aria-selected="false"
                className="px-4 py-3 text-[var(--color-ink-muted)]"
              >
                No matches. Try a different spelling.
              </li>
            ) : (
              filtered.map((opt, i) => {
                const isActive = i === activeIndex;
                const optId = `${listId}-opt-${i}`;
                return (
                  <li
                    key={opt}
                    id={optId}
                    role="option"
                    data-index={i}
                    aria-selected={isActive}
                    onMouseDown={(e) => {
                      e.preventDefault(); // keep focus on input
                      commit(opt);
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`cursor-pointer px-4 py-2 ${
                      isActive
                        ? "bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]"
                        : "text-[var(--color-ink-soft)]"
                    }`}
                  >
                    {opt}
                  </li>
                );
              })
            )}
          </ul>
        ) : null}
      </div>
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-[var(--color-alert)] text-sm"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
