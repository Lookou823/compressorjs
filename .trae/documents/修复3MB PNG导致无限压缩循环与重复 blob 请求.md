## 根因定位
- Worker 模式的数据准备在 `src/index.js:399–498` 的 `prepareDataForWorker` 中，会对 `data.url` 为 `blob:` 的情况执行 `fetch` 读取 Blob（`src/index.js:430–433`），从而在重复压缩（或 Worker 回退）时触发持续的 `blob:` 网络请求。
- 初始化阶段即便打算走 Worker，也会预先生成并传递 `blob:` URL（`src/index.js:254–290`），导致在 Worker 失败回退或重入时反复消费该 `blob:` URL。
- 每次压缩完成后都会在 `cleanup` 中递减 Worker 引用计数并终止全局 Worker（`src/index.js:1013–1021`），如果业务端因 3MB PNG 未降尺寸而再次尝试压缩（常见于外层重试逻辑），会频繁地重建 Worker，从而重复产生 Worker 脚本的 `blob:` URL 加载。

## 修复方案
- 方案 A（消除不必要的 blob URL 与重复 fetch）：
  - 在 `init()` 中，当计划使用 Worker 且无需 EXIF 处理时，不再创建 `URL.createObjectURL(file)`；改为传递原始 `File/Blob`（新增 `raw` 字段）给 `load()`。
  - 在 `prepareDataForWorker()` 中，始终优先使用原始 `File/Blob`，移除对 `data.url` 为 `blob:` 的 `fetch` 分支，避免任何 `blob:` 网络请求。
  - 在非 Worker 路径（主线程）真正需要显示或绘制时再按需生成 `blob:` URL（惰性创建），并在 `done/cleanup` 处严格回收。
- 方案 B（降低 Worker 重建频率）：
  - 调整 `cleanup()` 的 Worker 终止策略：引用计数归零后增加一个短 TTL（如 5–10 秒）或会话级持久化，以避免连续压缩时频繁终止/重建 Worker（保持与现有 API 兼容）。

## 具体代码改动点
- `src/index.js:254–290` 的 `init()`：
  - 判断 `shouldUseWorker` 并传入 `{ raw: file }`，不创建 `blob:` URL。
- `src/index.js:399–498` 的 `prepareDataForWorker()`：
  - 强制使用 `this.file` 或 `data.raw`，删除 `data.url.startsWith('blob:')` 的 `fetch` 路径（`src/index.js:430–433`）。
- `src/index.js:352–390` 的 `proceedWithLoad()` 与主线程分支：
  - 当未提供 `data.url` 且走主线程时，再惰性生成 `URL.createObjectURL(this.file)`。
- `src/index.js:1013–1021` 的 `cleanup()`：
  - 增加可选 TTL（保持默认立即清理为兼容，提供开关或微调常量）。

## 预期行为
- 上传 3MB PNG：
  - 不再出现持续的 `blob:` 网络请求；Worker 模式直接消费原始 `File/Blob`，主线程仅在必要时一次性创建并回收 `blob:` URL。
  - 连续压缩尝试不会频繁重建 Worker，稳定性提升；正常上传流程不受影响，API 完全兼容。

## 测试建议
- 功能回归：
  - 3MB PNG、7MB PNG（触发 `convertSize`）与 JPEG/WebP 路径分别压缩，验证成功回调与大小变化。
- 网络验证：
  - 在 DevTools Network 观察 `blob:` 请求：3MB PNG 场景仅出现一次或不出现（Worker 模式），无重复刷屏。
- Worker 生命周期：
  - 连续发起 5–10 次压缩，确认 Worker 未被频繁终止重建（有 TTL 时）。
- 资源回收：
  - 验证 `URL.revokeObjectURL` 仅对确实创建过的 `image.src` 调用，避免泄漏。
- 回退路径：
  - 禁用 OffscreenCanvas/Worker 时走主线程，仍保持稳定且无循环。