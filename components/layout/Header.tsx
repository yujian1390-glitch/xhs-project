import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold text-slate-900">
          文档转小红书图片工具
        </Link>
        <nav className="flex items-center gap-4 text-sm text-slate-600">
          <Link href="/">上传</Link>
          <Link href="/editor">编辑器</Link>
        </nav>
      </div>
    </header>
  );
}
