import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { EditorSidebar } from "@/components/editor/EditorSidebar";

export function EditorPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">编辑器</h1>
      <p className="text-sm text-slate-600">这里是编辑器空壳页面，后续补充布局与导出能力。</p>
      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <EditorSidebar />
        <EditorCanvas />
      </div>
    </section>
  );
}
