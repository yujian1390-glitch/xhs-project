# 离线可跑预览方案

无需安装 npm 依赖。

## 启动方式

在仓库根目录执行：

```bash
python3 -m http.server 4173
```

然后访问：

- http://localhost:4173/offline-preview/

## 功能范围

- PDF 拖拽/点击上传
- PDF 解析与页数识别
- 缩略图列表（默认勾选前 9 页）
- 当前页大图预览
- 6 个边框模板 + 参数调节
- 应用到当前 / 已勾选 / 全部

> 说明：该方案不依赖 npm，但使用了浏览器端 ESM CDN 加载 `pdfjs-dist`。
