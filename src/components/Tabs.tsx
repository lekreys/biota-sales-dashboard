import { useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

interface Props<T extends string> {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}

export function Tabs<T extends string>({ tabs, active, onChange }: Props<T>) {
  const buttons = useRef<Partial<Record<T, HTMLButtonElement | null>>>({});
  const [indicator, setIndicator] = useState({ left: 0, top: 0, width: 0, height: 0 });

  useLayoutEffect(() => {
    const update = () => {
      const button = buttons.current[active];
      if (button) {
        setIndicator({
          left: button.offsetLeft,
          top: button.offsetTop,
          width: button.offsetWidth,
          height: button.offsetHeight,
        });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [active, tabs]);

  function onKeyDown(e: KeyboardEvent) {
    const current = tabs.findIndex((tab) => tab.id === active);
    const targets: Record<string, number> = {
      ArrowRight: (current + 1) % tabs.length,
      ArrowLeft: (current - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    };
    if (!(e.key in targets)) return;
    e.preventDefault();
    const next = tabs[targets[e.key]].id;
    onChange(next);
    buttons.current[next]?.focus();
  }

  return (
    <div className="tabs" role="tablist" aria-label="Bagian dashboard" onKeyDown={onKeyDown}>
      <span
        className="tab-indicator"
        style={{
          transform: `translate(${indicator.left}px, ${indicator.top}px)`,
          width: indicator.width,
          height: indicator.height,
        }}
        aria-hidden
      />
      {tabs.map((tab) => (
        <button
          key={tab.id}
          ref={(el) => {
            buttons.current[tab.id] = el;
          }}
          role="tab"
          id={`tab-${tab.id}`}
          aria-controls={`panel-${tab.id}`}
          aria-selected={tab.id === active}
          tabIndex={tab.id === active ? 0 : -1}
          className={`tab${tab.id === active ? ' active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
