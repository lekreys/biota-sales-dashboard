import { useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

export interface TabDef<T extends string> {
  id: T;
  label: string;
}

interface Props<T extends string> {
  tabs: TabDef<T>[];
  active: T;
  onChange: (id: T) => void;
}

/** Accessible tab list (arrow keys, Home/End) with a sliding indicator behind the active tab. */
export function Tabs<T extends string>({ tabs, active, onChange }: Props<T>) {
  const refs = useRef<Partial<Record<T, HTMLButtonElement | null>>>({});
  const [indicator, setIndicator] = useState({ left: 0, top: 0, width: 0, height: 0 });

  useLayoutEffect(() => {
    const update = () => {
      const el = refs.current[active];
      if (el) setIndicator({ left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [active, tabs]);

  function onKeyDown(e: KeyboardEvent) {
    const i = tabs.findIndex((t) => t.id === active);
    const keys: Record<string, number> = {
      ArrowRight: (i + 1) % tabs.length,
      ArrowLeft: (i - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const next = tabs[keys[e.key]].id;
    onChange(next);
    refs.current[next]?.focus();
  }

  return (
    <div className="tabs" role="tablist" aria-label="Bagian dashboard" onKeyDown={onKeyDown}>
      {/* The indicator box covers the active tab; CSS draws it as an underline. */}
      <span
        className="tab-indicator"
        style={{
          transform: `translate(${indicator.left}px, ${indicator.top}px)`,
          width: indicator.width,
          height: indicator.height,
        }}
        aria-hidden
      />
      {tabs.map((t) => (
        <button
          key={t.id}
          ref={(el) => {
            refs.current[t.id] = el;
          }}
          role="tab"
          id={`tab-${t.id}`}
          aria-controls={`panel-${t.id}`}
          aria-selected={t.id === active}
          tabIndex={t.id === active ? 0 : -1}
          className={`tab${t.id === active ? ' active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
