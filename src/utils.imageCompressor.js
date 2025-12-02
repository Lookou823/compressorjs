import Compressor from '../src/index';

/**
 * 使用 Compressor 进行图片压缩（强制开启 Web Worker），入参与出参均为 File。
 *
 * - 默认开启 Worker 严格模式：`useWorker: true`
 * - 内部自动处理 PNG → JPEG 转换等逻辑（由 Compressor 本身负责）
 *
 * @param {File} file - 原始图片文件（必须是图片类型）
 * @param {Object} [options] - 额外透传给 Compressor 的可选配置（会覆盖默认配置）
 * @returns {Promise<File>} Promise，成功时返回压缩后的 File 对象（可能是原图或压缩结果）
 */
export function compressImage(file, options = {}) {
  return new Promise((resolve, reject) => {
    if (!(file instanceof File)) {
      reject(new Error('compressImage: 参数 file 必须是 File 实例'));
      return;
    }

    // 强制启用 Web Worker 能力（严格模式）
    const compressorOptions = {
      useWorker: true,
      // 可以根据需要调整默认质量等参数
      quality: 0.8,
      convertSize: 5000000,
      convertTypes: ['image/png'],
      // 允许调用方覆盖上述任何配置
      ...options,
      // success / error 由 Promise 接管，避免被调用方覆盖后丢失
      success(result) {
        // Compressor 保证 result 至少是 File 或 File-like 对象
        resolve(result);
      },
      error(err) {
        // 控制台输出主要用于调试，真实错误通过 reject 抛出
        if (process.env.NODE_ENV !== 'production' && console && console.error) {
          console.error('[compressImage] image compression error:', err);
        }
        reject(err);
      },
    };

    // 直接使用库内部的 Compressor 构造器
    // 其内部已实现：
    // - Web Worker 初始化与降级逻辑（useWorker 严格模式）
    // - EXIF 处理、尺寸与质量控制、类型转换等
    // - 内部 WorkerManager 的生命周期与内存管理
    // eslint-disable-next-line no-new
    new Compressor(file, compressorOptions);
  });
}


