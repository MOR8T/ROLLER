"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { pillClass } from "@/components/sections/home-kit";
import { cn } from "@/lib/utils";

/**
 * The city picker in the "Шоурумы" heading row — imzo.uz's control, rebuilt.
 *
 * ── Why not a native `<select>` ─────────────────────────────────────────────
 *
 * A native select cannot be styled below its box: the popup is drawn by the
 * operating system, so the rounded panel, the hover states and the check on the
 * chosen row are all out of reach. imzo.uz solves this the usual way — a real
 * `<select>` kept in the DOM for form semantics, with a `<div>` list painted
 * over it — and inherits the usual bug: the two can disagree, and only the one
 * nobody can see is the one assistive technology reads.
 *
 * This is the ARIA 1.2 select-only combobox instead: one control, no hidden
 * twin. The button *is* the combobox, the list *is* the listbox, and the state
 * a screen reader announces is the state on the screen because there is only
 * one of them. Nothing here is submitted with a form, so the native element was
 * only ever going to be dead weight.
 *
 * ── The keyboard contract ───────────────────────────────────────────────────
 *
 *   on the button   ↓ ↑ Enter Space   open, focus lands in the list
 *   in the list     ↓ ↑               move the highlight
 *                   Home End          first, last
 *                   Enter Space       choose it, focus returns to the button
 *                   Esc Tab           close it, unchanged
 *   anywhere        pointer outside   close it, unchanged
 *
 * The highlight is `aria-activedescendant`, not focus: focus stays on the list
 * so that the browser never scrolls the page to an option, and the reader still
 * announces each row as it is passed.
 */
export function CitySelect({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  /** Accessible name — the visible text is the chosen city, not the purpose. */
  label: string;
  className?: string;
}) {
  const uid = useId();
  const listId = `${uid}-list`;

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.id === value),
  );
  const [activeIndex, setActiveIndex] = useState(selectedIndex);

  // Opening always starts from the current choice, however the highlight was
  // left last time.
  function openList(from = selectedIndex) {
    setActiveIndex(from);
    setOpen(true);
  }

  function close({ refocus = true } = {}) {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  }

  function choose(index: number) {
    onChange(options[index].id);
    close();
  }

  // The list is not in the button's DOM subtree for focus purposes once it is
  // open, so "did the pointer land outside" is a question about the wrapper.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={label}
        onClick={() => (open ? close({ refocus: false }) : openList())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openList();
          }
        }}
        className={pillClass("light", "justify-between gap-3 pr-5")}
      >
        {options[selectedIndex]?.label}
        <ChevronDown
          className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${uid}-option-${activeIndex}`}
          onKeyDown={(event) => {
            switch (event.key) {
              case "ArrowDown":
                event.preventDefault();
                setActiveIndex((index) => Math.min(index + 1, options.length - 1));
                break;
              case "ArrowUp":
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
                break;
              case "Home":
                event.preventDefault();
                setActiveIndex(0);
                break;
              case "End":
                event.preventDefault();
                setActiveIndex(options.length - 1);
                break;
              case "Enter":
              case " ":
                event.preventDefault();
                choose(activeIndex);
                break;
              case "Escape":
                event.preventDefault();
                close();
                break;
              case "Tab":
                // Not prevented: Tab should still move on, it just must not
                // leave an open list behind it.
                close({ refocus: false });
                break;
            }
          }}
          // `min-w-full` rather than `w-full`: a long city name sets the width
          // of the panel, and the trigger — which shows one name at a time —
          // has no business being that wide.
          className="absolute top-[calc(100%+0.5rem)] left-0 z-20 min-w-full overflow-hidden rounded-2xl border border-brand-black/12 bg-brand-white py-2 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.28)] focus:outline-none"
        >
          {options.map((option, index) => {
            const selected = option.id === value;

            return (
              <li
                key={option.id}
                id={`${uid}-option-${index}`}
                role="option"
                aria-selected={selected}
                onClick={() => choose(index)}
                onPointerMove={() => setActiveIndex(index)}
                className={cn(
                  "cursor-pointer px-6 py-3 text-sm whitespace-nowrap transition-colors",
                  index === activeIndex ? "bg-neutral-100" : "bg-transparent",
                  selected ? "font-semibold text-brand-black" : "text-brand-black/70",
                )}
              >
                {option.label}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
