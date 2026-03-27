"use client";

import { FRAME_TEMPLATES } from "@/constants/frameTemplates";
import type { ApplyTarget, CanvasRatio, FrameStyleSettings } from "@/types/frameTemplate";

interface TemplatePanelProps {
  activeTemplateId: string;
  settings: FrameStyleSettings;
  isApplying: boolean;
  onTemplateChange: (templateId: string) => Promise<void>;
  onSettingChange: <K extends keyof FrameStyleSettings>(
    key: K,
    value: FrameStyleSettings[K]
  ) => Promise<void>;
  onApply: (target: ApplyTarget) => Promise<void>;
}

const ratioOptions: CanvasRatio[] = ["origin", "3:4", "1:1"];

export function TemplatePanel({
  activeTemplateId,
  settings,
  isApplying,
  onTemplateChange,
  onSettingChange,
  onApply
}: TemplatePanelProps) {
  return (
    <aside className="h-[70vh] overflow-y-auto rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-base font-semibold">边框模板</h2>

      <div className="mt-3 space-y-2">
        {FRAME_TEMPLATES.map((template) => {
          const active = template.id === activeTemplateId;
          return (
            <button
              key={template.id}
              type="button"
              onClick={async () => onTemplateChange(template.id)}
              className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                active ? "border-rose-300 bg-rose-50" : "border-slate-200"
              }`}
            >
              {template.name}
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <label className="block">
          <span className="mb-1 block text-slate-600">画布比例</span>
          <select
            value={settings.ratio}
            className="w-full rounded border border-slate-300 px-2 py-1"
            onChange={async (event) =>
              onSettingChange("ratio", event.target.value as CanvasRatio)
            }
          >
            {ratioOptions.map((ratio) => (
              <option key={ratio} value={ratio}>
                {ratio}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-slate-600">背景色</span>
          <input
            type="color"
            value={settings.backgroundColor}
            onChange={async (event) => onSettingChange("backgroundColor", event.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-slate-600">边框颜色</span>
          <input
            type="color"
            value={settings.borderColor}
            onChange={async (event) => onSettingChange("borderColor", event.target.value)}
          />
        </label>

        <RangeField
          label="边框粗细"
          value={settings.borderWidth}
          min={0}
          max={48}
          onChange={async (value) => onSettingChange("borderWidth", value)}
        />
        <RangeField
          label="圆角"
          value={settings.borderRadius}
          min={0}
          max={80}
          onChange={async (value) => onSettingChange("borderRadius", value)}
        />
        <RangeField
          label="外边距"
          value={settings.outerMargin}
          min={0}
          max={120}
          onChange={async (value) => onSettingChange("outerMargin", value)}
        />
        <RangeField
          label="内边距"
          value={settings.innerPadding}
          min={0}
          max={80}
          onChange={async (value) => onSettingChange("innerPadding", value)}
        />
      </div>

      <div className="mt-5 space-y-2">
        <button
          type="button"
          onClick={async () => onApply("current")}
          disabled={isApplying}
          className="w-full rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:bg-slate-400"
        >
          应用到当前页
        </button>
        <button
          type="button"
          onClick={async () => onApply("selected")}
          disabled={isApplying}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:text-slate-400"
        >
          应用到已勾选页面
        </button>
        <button
          type="button"
          onClick={async () => onApply("all")}
          disabled={isApplying}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:text-slate-400"
        >
          应用到全部页面
        </button>
      </div>
    </aside>
  );
}

interface RangeFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => Promise<void>;
}

function RangeField({ label, value, min, max, onChange }: RangeFieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-slate-600">
        {label}：{value}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        className="w-full"
        onChange={async (event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
