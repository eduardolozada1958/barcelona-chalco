import { useState } from 'react';
import { MaterialIcon } from '@/components/MaterialIcon';

/** Emojis útiles para avisos del club (deportes, éxitos, fechas, alertas). */
const PRESET_EMOJIS = [
  '⚽', '🏆', '🥇', '🔥', '⭐', '✨', '💪', '🎯', '👏', '🙌',
  '📢', '📣', '✅', '❗', '⚠️', '❤️', '🎉', '🎊', '📅', '⏰',
  '🏟️', '🥅', '👟', '👕', '🚌', '📸', '🎥', '☀️', '🌧️', '❄️',
  '🏃', '🧤', '📍', '🇲🇽', '1️⃣', '2️⃣', '3️⃣', '➡️', '⬆️', '📌',
];

interface EmojiPickerBarProps {
  /** Texto del botón para abrir/cerrar el panel */
  label?: string;
  onPick: (emoji: string) => void;
}

export function EmojiPickerBar({ label = 'Emojis', onPick }: EmojiPickerBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs font-label-caps text-on-surface-variant hover:text-primary border border-outline-variant/40 rounded-lg px-2 py-1 bg-surface-container/40"
        aria-expanded={open}
      >
        <MaterialIcon name="sentiment_satisfied" size={16} className="text-primary" />
        {label}
        <MaterialIcon name={open ? 'expand_less' : 'expand_more'} size={18} />
      </button>
      {open ? (
        <div className="mt-2 p-2 rounded-lg border border-outline-variant/25 bg-surface-container-low/80 max-h-40 overflow-y-auto flex flex-wrap gap-1 shadow-inner">
          {PRESET_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="w-9 h-9 text-xl leading-none rounded-md hover:bg-primary/15 border border-transparent hover:border-primary/30 transition-colors"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onPick(emoji);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
