"use client";

import { DEFAULT_COVER_LAYOUT, EMOJI_PRESETS, TAG_PRESETS } from "@/constants/coverLayouts";
import { EmojiPickerLite } from "@/components/cover/EmojiPickerLite";
import { TagPresetPicker } from "@/components/cover/TagPresetPicker";
import type { CoverDraft } from "@/types/cover";

interface CoverPanelProps {
  draft: CoverDraft;
  layoutOptions: Array<{ id: CoverDraft["layout"]; name: string }>;
  onDraftChange: (next: CoverDraft) => void;
}

const defaultTitle = "3 分钟看懂这份 PDF";
const defaultSubtitle = "提炼重点 + 可直接复用";

export function CoverPanel({ draft, layoutOptions, onDraftChange }: CoverPanelProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold">首图编辑（仅第 1 页）</h3>

      <div className="mt-3 space-y-3 text-sm">
        <label className="block">
          <span className="mb-1 block text-slate-600">首图布局</span>
          <select
            value={draft.layout}
            onChange={(event) => onDraftChange({ ...draft, layout: event.target.value as CoverDraft["layout"] })}
            className="w-full rounded border border-slate-300 px-2 py-1"
          >
            {layoutOptions.map((layout) => (
              <option key={layout.id} value={layout.id}>
                {layout.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-slate-600">主标题</span>
          <textarea
            value={draft.title}
            onChange={(event) => onDraftChange({ ...draft, title: event.target.value })}
            rows={3}
            className="w-full rounded border border-slate-300 px-2 py-1"
            placeholder={defaultTitle}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-slate-600">副标题</span>
          <textarea
            value={draft.subtitle}
            onChange={(event) => onDraftChange({ ...draft, subtitle: event.target.value })}
            rows={2}
            className="w-full rounded border border-slate-300 px-2 py-1"
            placeholder={defaultSubtitle}
          />
        </label>

        <div>
          <span className="mb-1 block text-slate-600">Emoji</span>
          <EmojiPickerLite
            value={draft.emoji}
            options={EMOJI_PRESETS}
            onChange={(emoji) => onDraftChange({ ...draft, emoji })}
          />
        </div>

        <div>
          <span className="mb-1 block text-slate-600">标签</span>
          <TagPresetPicker
            selected={draft.tags}
            options={TAG_PRESETS}
            onToggle={(tag) => {
              const exists = draft.tags.includes(tag);
              onDraftChange({
                ...draft,
                tags: exists ? draft.tags.filter((item) => item !== tag) : [...draft.tags, tag]
              });
            }}
          />
        </div>

        <button
          type="button"
          className="rounded border border-slate-300 px-3 py-1 text-xs"
          onClick={() =>
            onDraftChange({
              title: defaultTitle,
              subtitle: defaultSubtitle,
              emoji: "✨",
              tags: ["干货"],
              layout: DEFAULT_COVER_LAYOUT.id
            })
          }
        >
          恢复默认文案
        </button>
      </div>
    </section>
  );
}
