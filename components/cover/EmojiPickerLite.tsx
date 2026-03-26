"use client";

interface EmojiPickerLiteProps {
  value: string;
  options: string[];
  onChange: (emoji: string) => void;
}

export function EmojiPickerLite({ value, options, onChange }: EmojiPickerLiteProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {options.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onChange(emoji)}
          className={`rounded border px-2 py-1 text-lg ${
            value === emoji ? "border-rose-300 bg-rose-50" : "border-slate-300 bg-white"
          }`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
