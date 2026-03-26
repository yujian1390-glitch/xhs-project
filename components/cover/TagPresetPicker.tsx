"use client";

interface TagPresetPickerProps {
  selected: string[];
  options: string[];
  onToggle: (tag: string) => void;
}

export function TagPresetPicker({ selected, options, onToggle }: TagPresetPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((tag) => {
        const active = selected.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onToggle(tag)}
            className={`rounded-full border px-3 py-1 text-xs ${
              active ? "border-rose-300 bg-rose-50 text-rose-700" : "border-slate-300 bg-white text-slate-600"
            }`}
          >
            #{tag}
          </button>
        );
      })}
    </div>
  );
}
