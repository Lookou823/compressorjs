/* eslint-disable max-classes-per-file */
import toBlob from 'blueimp-canvas-to-blob';
import isBlob from 'is-blob';
import DEFAULTS from './defaults';
import { WINDOW } from './constants';
import {
  arrayBufferToDataURL,
  getAdjustedSizes,
  imageTypeToExtension,
  isImageType,
  isPositiveNumber,
  normalizeDecimalNumber,
  parseOrientation,
  resetAndGetOrientation,
  getExif,
  insertExif,
} from './utilities';

const { ArrayBuffer, FileReader, Worker } = WINDOW;
const URL = WINDOW.URL || WINDOW.webkitURL;
const REGEXP_EXTENSION = /\.\w+$/;
const AnotherCompressor = WINDOW.Compressor;

/**
 * Check if OffscreenCanvas is supported
 * @returns {boolean} True if OffscreenCanvas is supported
 */
function isOffscreenCanvasSupported() {
  return (
    typeof OffscreenCanvas !== 'undefined' && typeof Worker !== 'undefined'
  );
}

/**
 * Worker manager for image compression
 */
class WorkerManager {
  constructor() {
    this.worker = null;
    this.workerURL = null;
    this.taskId = 0;
    this.pendingTasks = new Map();
  }

  /**
   * Initialize worker with blob URL
   * @param {string} workerCode - The worker code as a string
   * @returns {Promise<void>} Promise that resolves when worker is initialized
   */
  initWorker(workerCode) {
    if (this.worker) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.workerURL = URL.createObjectURL(blob);
        this.worker = new Worker(this.workerURL);

        this.worker.onmessage = (e) => {
          const {
            taskId, success, arrayBuffer, mimeType, error, naturalWidth, naturalHeight,
          } = e.data;

          // Handle compression task response
          const task = this.pendingTasks.get(taskId);

          if (task) {
            this.pendingTasks.delete(taskId);
            if (success) {
              const resultBlob = new Blob([arrayBuffer], { type: mimeType });
              // Return both blob and dimensions for handleCompressionResult
              task.resolve({
                blob: resultBlob,
                naturalWidth,
                naturalHeight,
              });
            } else {
              task.reject(new Error(error || 'Worker compression failed'));
            }
          }
        };

        // Handle worker errors (both initialization and runtime errors)
        this.worker.onerror = (errorEvent) => {
          const errorMessage = errorEvent.message || errorEvent.filename || 'Unknown worker error';
          const error = new Error(`Worker error: ${errorMessage}`);

          // Cleanup all pending tasks on worker error
          this.pendingTasks.forEach((task) => {
            task.reject(error);
          });
          this.pendingTasks.clear();

          // Reset worker state
          if (this.worker) {
            this.worker.terminate();
            this.worker = null;
          }
          if (this.workerURL) {
            URL.revokeObjectURL(this.workerURL);
            this.workerURL = null;
          }

          // Only reject initialization promise if worker is not yet initialized
          if (!this.worker) reject(error);
        };

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Compress image using worker
   * @param {Object} data - Compression data
   * @returns {Promise<Blob>} Promise that resolves with compressed image blob
   */
  compress(data) {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      this.taskId += 1;
      const { taskId } = this;

      // Add timeout for pending tasks to prevent memory leak
      const timeout = setTimeout(() => {
        if (this.pendingTasks.has(taskId)) {
          this.pendingTasks.delete(taskId);
          reject(new Error('Worker task timeout after 30 seconds'));
        }
      }, 30000); // 30 seconds timeout

      const wrappedResolve = (result) => {
        clearTimeout(timeout);
        resolve(result);
      };

      const wrappedReject = (error) => {
        clearTimeout(timeout);
        reject(error);
      };

      this.pendingTasks.set(taskId, {
        resolve: wrappedResolve,
        reject: wrappedReject,
      });

      // Prepare transfer list for Blob (transfer ArrayBuffer for performance)
      const transferList = [];
      if (data.imageData instanceof ArrayBuffer) {
        transferList.push(data.imageData);
      } else if (data.imageData instanceof Blob) {
        // Blob can be transferred, but we need to convert to ArrayBuffer first
        // For now, pass Blob directly (browser will handle serialization)
        // Alternatively, we could convert to ArrayBuffer here
      } else if (data.imageData && data.imageData.data && data.imageData.data.buffer) {
        // Legacy: ImageData transfer
        transferList.push(data.imageData.data.buffer);
      }

      this.worker.postMessage({
        ...data,
        taskId,
      }, transferList.length > 0 ? transferList : undefined);
    });
  }

  /**
   * Terminate worker
   */
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    if (this.workerURL) {
      URL.revokeObjectURL(this.workerURL);
      this.workerURL = null;
    }
    this.pendingTasks.clear();
  }
}

// Shared worker manager instance with reference counting
let workerManager = null;
let workerManagerRefCount = 0;
let workerCleanupTimer = null;

/**
 * Creates a new image compressor.
 * @class
 */
export default class Compressor {
  /**
   * The constructor of Compressor.
   * @param {File|Blob} file - The target image file for compressing.
   * @param {Object} [options] - The options for compressing.
   */
  constructor(file, options) {
    this.file = file;
    this.exif = [];
    this.image = new Image();
    this.options = {
      ...DEFAULTS,
      ...options,
    };
    this.aborted = false;
    this.result = null;
    this.useWorker = false;
    this.workerInitialized = false;
    this.reader = null;
    this.init();
  }

  init() {
    const { file, options } = this;

    if (!isBlob(file)) {
      this.fail(new Error('The first argument must be a File or Blob object.'));
      return;
    }

    const mimeType = file.type;

    if (!isImageType(mimeType)) {
      this.fail(
        new Error('The first argument must be an image File or Blob object.'),
      );
      return;
    }

    if (!URL || !FileReader) {
      this.fail(
        new Error('The current browser does not support image compression.'),
      );
      return;
    }

    if (!ArrayBuffer) {
      options.checkOrientation = false;
      options.retainExif = false;
    }

    const isJPEGImage = mimeType === 'image/jpeg';
    const checkOrientation = isJPEGImage && options.checkOrientation;
    const retainExif = isJPEGImage && options.retainExif;

    const shouldUseWorker = this.options.useWorker !== false
      && (this.options.useWorker === true
        || (this.options.useWorker === undefined && isOffscreenCanvasSupported()));

    if (shouldUseWorker && URL && !checkOrientation && !retainExif) {
      this.load({
        raw: file,
      });
    } else if (URL && !checkOrientation && !retainExif) {
      this.load({
        url: URL.createObjectURL(file),
      });
    } else {
      const reader = new FileReader();

      this.reader = reader;
      reader.onload = ({ target }) => {
        const { result } = target;
        const data = {};
        let orientation = 1;

        if (checkOrientation) {
          // Reset the orientation value to its default value 1
          // as some iOS browsers will render image with its orientation
          orientation = resetAndGetOrientation(result);

          if (orientation > 1) {
            Object.assign(data, parseOrientation(orientation));
          }
        }

        if (retainExif) {
          this.exif = getExif(result);
        }

        if (checkOrientation || retainExif) {
          if (
            !URL
            // Generate a new URL with the default orientation value 1.
            || orientation > 1
          ) {
            data.url = arrayBufferToDataURL(result, mimeType);
          } else {
            data.url = URL.createObjectURL(file);
          }
        } else {
          data.url = result;
        }

        this.load(data);
      };
      reader.onabort = () => {
        this.fail(new Error('Aborted to read the image with FileReader.'));
      };
      reader.onerror = () => {
        this.fail(new Error('Failed to read the image with FileReader.'));
      };
      reader.onloadend = () => {
        this.reader = null;
      };

      if (checkOrientation || retainExif) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsDataURL(file);
      }
    }
  }

  load(data) {
    const { options } = this;

    // Check if we should use Worker
    const shouldUseWorker = options.useWorker !== false
      && (options.useWorker === true
        || (options.useWorker === undefined && isOffscreenCanvasSupported()));

    if (shouldUseWorker && !this.workerInitialized) {
      this.initializeWorker()
        .then(() => {
          this.useWorker = true;
          this.workerInitialized = true;
          this.proceedWithLoad(data);
        })
        .catch((error) => {
          // If useWorker is explicitly true, don't fallback to main thread
          if (options.useWorker === true) {
            this.fail(
              new Error(
                `Worker initialization failed: ${
                  error.message || 'Unknown error'
                }. Please check browser support for OffscreenCanvas.`,
              ),
            );
            return;
          }
          // Only fallback if useWorker was auto-detected (undefined)
          this.useWorker = false;
          this.workerInitialized = true;
          this.proceedWithLoad(data);
        });
    } else {
      this.proceedWithLoad(data);
    }
  }

  proceedWithLoad(data) {
    const { image } = this;

    // In Worker mode, send raw data to Worker for decoding
    // Image decoding will happen in Worker thread, avoiding main thread blocking
    if (this.useWorker && this.workerInitialized) {
      // Send raw image data to Worker, Worker will decode and process
      this.prepareDataForWorker(data);
      return;
    }

    // Main thread mode: load Image normally
    image.onload = () => {
      this.draw({
        ...data,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
      });
    };
    image.onabort = () => {
      this.fail(new Error('Aborted to load the image.'));
    };
    image.onerror = () => {
      this.fail(new Error('Failed to load the image.'));
    };

    // Match all browsers that use WebKit as the layout engine in iOS devices,
    // such as Safari for iOS, Chrome for iOS, and in-app browsers.
    if (
      WINDOW.navigator
      && /(?:iPad|iPhone|iPod).*?AppleWebKit/i.test(WINDOW.navigator.userAgent)
    ) {
      // Fix the `The operation is insecure` error (#57)
      image.crossOrigin = 'anonymous';
    }

    image.alt = this.file.name;
    if (!data.url && URL && this.file) {
      data.url = URL.createObjectURL(this.file);
    }
    image.src = data.url;
  }

  /**
   * Prepare image data for Worker mode - send raw data to Worker for decoding
   * Image decoding will happen in Worker thread, avoiding main thread blocking
   * IMPORTANT: Never use Image.onload or fetch(data URL) in main thread to avoid decoding
   * @param {Object} data - Image data object
   * @returns {Promise<void>} Promise that resolves when data is prepared
   */
  async prepareDataForWorker(data) {
    // Ensure Worker is ready
    if (!workerManager || !workerManager.worker) {
      if (this.options.useWorker === true) {
        this.fail(
          new Error(
            'Worker not initialized. Please check browser support for OffscreenCanvas.',
          ),
        );
        return;
      }
      this.useWorker = false;
      this.workerInitialized = true;
      this.proceedWithLoad(data);
      return;
    }

    try {
      // In Worker mode, we must avoid ANY image decoding in main thread
      // This includes: Image.onload, fetch(data URL), or any operation that triggers decoding

      let imageDataForWorker = null;
      const imageMimeType = this.file.type;

      // Priority 1: Use original File/Blob (no decoding needed)
      if (this.file instanceof File || this.file instanceof Blob) {
        imageDataForWorker = this.file;
      } else if (data.raw instanceof File || data.raw instanceof Blob) {
        imageDataForWorker = data.raw;
      } else if (data.url) {
        if (data.url.startsWith('data:')) {
          const commaIndex = data.url.indexOf(',');
          if (commaIndex === -1) {
            throw new Error('Invalid data URL');
          }
          const metadata = data.url.substring(0, commaIndex);
          const payload = data.url.substring(commaIndex + 1);
          if (metadata.includes(';base64')) {
            const binaryString = atob(payload);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i += 1) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            imageDataForWorker = bytes.buffer;
          } else {
            const decoded = decodeURIComponent(payload);
            const encoder = new TextEncoder();
            imageDataForWorker = encoder.encode(decoded).buffer;
          }
        } else {
          imageDataForWorker = data.url;
        }
      }

      if (!imageDataForWorker) {
        throw new Error('No image data available for Worker');
      }

      // Store raw data for Worker (Worker will decode it)
      // NEVER set this.image.src in Worker mode to avoid main thread decoding
      this.workerImageData = imageDataForWorker;
      this.workerImageMimeType = imageMimeType;

      // Send raw data to Worker and let it decode and process
      // Worker will return dimensions after decoding
      this.draw({
        ...data,
        // Dimensions will be obtained from Worker after decoding
        naturalWidth: 0,
        naturalHeight: 0,
      });
    } catch (error) {
      if (this.options.useWorker === true) {
        this.fail(
          new Error(
            `Worker mode failed: ${error.message}. Please check browser support for OffscreenCanvas.`,
          ),
        );
        return;
      }

      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn(
          'Worker data preparation failed, falling back to main thread:',
          error,
        );
      }
      this.useWorker = false;
      this.workerInitialized = true;
      this.proceedWithLoad(data);
    }
  }

  async initializeWorker() {
    if (!workerManager) {
      workerManager = new WorkerManager();
    }
    // Increment reference count
    if (workerCleanupTimer) {
      clearTimeout(workerCleanupTimer);
      workerCleanupTimer = null;
    }
    workerManagerRefCount += 1;

    // Try to load worker code
    // First, try to fetch from a configured path
    const { workerPath } = this.options;
    let workerCode = null;

    if (workerPath) {
      try {
        const response = await fetch(workerPath);
        workerCode = await response.text();
      } catch (error) {
        // If fetch fails, try to use inline worker code
        // Failed to load worker from path, will use inline code
      }
    }

    // If no worker code loaded, use inline code
    if (!workerCode) {
      workerCode = Compressor.getInlineWorkerCode();
    }

    await workerManager.initWorker(workerCode);
  }

  static getInlineWorkerCode() {
    // Return the worker code as a string - matches src/worker/image-compress.worker.js
    // Worker decodes image in background thread, avoiding main thread blocking
    // Uses createImageBitmap (priority 1), ImageDecoder API (priority 2), or Image (fallback)
    // eslint-disable-next-line max-len, quotes, no-useless-escape
    return "function isPositiveNumber(value) {return value > 0 && value < Infinity;} function normalizeDecimalNumber(value, times = 100000000000) {const REGEXP_DECIMALS = /\\.\\d*(?:0|9){12}\\d*$/; return REGEXP_DECIMALS.test(value) ? (Math.round(value * times) / times) : value;} function getAdjustedSizes({aspectRatio, height, width}, type = 'none') {const isValidWidth = isPositiveNumber(width); const isValidHeight = isPositiveNumber(height); if (isValidWidth && isValidHeight) {const adjustedWidth = height * aspectRatio; if (((type === 'contain' || type === 'none') && adjustedWidth > width) || (type === 'cover' && adjustedWidth < width)) {height = width / aspectRatio;} else {width = height * aspectRatio;}} else if (isValidWidth) {height = width / aspectRatio;} else if (isValidHeight) {width = height * aspectRatio;} return {width, height};} function isImageType(value) {const REGEXP_IMAGE_TYPE = /^image\\/.+$/; return REGEXP_IMAGE_TYPE.test(value);} async function decodeImageInWorker(imageData, mimeType) {if (typeof createImageBitmap !== 'undefined') {let blob = imageData; if (typeof imageData === 'string' && imageData.startsWith('data:')) {const response = await fetch(imageData); blob = await response.blob();} else if (typeof imageData === 'string' && imageData.startsWith('blob:')) {const response = await fetch(imageData); blob = await response.blob();} const imageBitmap = await createImageBitmap(blob); return {imageBitmap, width: imageBitmap.width, height: imageBitmap.height,};} if (typeof ImageDecoder !== 'undefined') {let arrayBuffer; if (imageData instanceof Blob) {arrayBuffer = await imageData.arrayBuffer();} else if (typeof imageData === 'string' && imageData.startsWith('data:')) {const response = await fetch(imageData); arrayBuffer = await (await response.blob()).arrayBuffer();} else {throw new Error('Unsupported image data format for ImageDecoder');} const decoder = new ImageDecoder({data: arrayBuffer, type: mimeType || 'image/jpeg',}); const {image} = await decoder.decode(); const imageBitmap = await createImageBitmap(image); return {imageBitmap, width: image.displayWidth, height: image.displayHeight,};} const img = new Image(); await new Promise((resolve, reject) => {img.onload = resolve; img.onerror = reject; if (imageData instanceof Blob) {img.src = URL.createObjectURL(imageData);} else {img.src = imageData;}}); if (typeof createImageBitmap !== 'undefined') {const imageBitmap = await createImageBitmap(img); if (img.src.startsWith('blob:')) {URL.revokeObjectURL(img.src);} return {imageBitmap, width: img.naturalWidth, height: img.naturalHeight,};} return {imageBitmap: img, width: img.naturalWidth, height: img.naturalHeight,};} self.onmessage = async function (e) {const {imageData, imageMimeType, rotate = 0, scaleX = 1, scaleY = 1, options, taskId,} = e.data; try {const {imageBitmap, width: naturalWidth, height: naturalHeight} = await decodeImageInWorker( imageData, imageMimeType, ); const is90DegreesRotated = Math.abs(rotate) % 180 === 90; const resizable = (options.resize === 'contain' || options.resize === 'cover') && isPositiveNumber(options.width) && isPositiveNumber(options.height); let maxWidth = Math.max(options.maxWidth, 0) || Infinity; let maxHeight = Math.max(options.maxHeight, 0) || Infinity; let minWidth = Math.max(options.minWidth, 0) || 0; let minHeight = Math.max(options.minHeight, 0) || 0; let aspectRatio = naturalWidth / naturalHeight; let {width, height} = options; if (is90DegreesRotated) {[maxWidth, maxHeight] = [maxHeight, maxWidth]; [minWidth, minHeight] = [minHeight, minWidth]; [width, height] = [height, width];} if (resizable) {aspectRatio = width / height;} ({width: maxWidth, height: maxHeight} = getAdjustedSizes({aspectRatio, width: maxWidth, height: maxHeight,}, 'contain')); ({width: minWidth, height: minHeight} = getAdjustedSizes({aspectRatio, width: minWidth, height: minHeight,}, 'cover')); if (resizable) {({width, height} = getAdjustedSizes({aspectRatio, width, height,}, options.resize));} else {({width = naturalWidth, height = naturalHeight} = getAdjustedSizes({aspectRatio, width, height,}));} width = Math.floor(normalizeDecimalNumber(Math.min(Math.max(width, minWidth), maxWidth))); height = Math.floor(normalizeDecimalNumber(Math.min(Math.max(height, minHeight), maxHeight))); let {mimeType} = options; if (!isImageType(mimeType)) {mimeType = options.originalMimeType || 'image/jpeg';} if (options.fileSize > options.convertSize && options.convertTypes.indexOf(mimeType) >= 0) {mimeType = 'image/jpeg';} const isJPEGImage = mimeType === 'image/jpeg'; if (is90DegreesRotated) {[width, height] = [height, width];} const canvas = new OffscreenCanvas(width, height); const context = canvas.getContext('2d'); const fillStyle = isJPEGImage ? '#fff' : 'transparent'; context.fillStyle = fillStyle; context.fillRect(0, 0, width, height); const destX = -width / 2; const destY = -height / 2; const destWidth = width; const destHeight = height; const params = []; if (resizable) {let srcX = 0; let srcY = 0; let srcWidth = naturalWidth; let srcHeight = naturalHeight; ({width: srcWidth, height: srcHeight} = getAdjustedSizes({aspectRatio, width: naturalWidth, height: naturalHeight,}, {contain: 'cover', cover: 'contain',}[options.resize])); srcX = (naturalWidth - srcWidth) / 2; srcY = (naturalHeight - srcHeight) / 2; params.push(srcX, srcY, srcWidth, srcHeight);} params.push(destX, destY, destWidth, destHeight); context.save(); context.translate(width / 2, height / 2); context.rotate((rotate * Math.PI) / 180); context.scale(scaleX, scaleY); if (imageBitmap instanceof ImageBitmap) {context.drawImage(imageBitmap, ...params);} else {context.drawImage(imageBitmap, ...params); if (imageBitmap.src && imageBitmap.src.startsWith('blob:')) {URL.revokeObjectURL(imageBitmap.src);}} context.restore(); const blob = await canvas.convertToBlob({type: mimeType, quality: options.quality,}); const arrayBuffer = await blob.arrayBuffer(); self.postMessage({taskId, success: true, arrayBuffer, mimeType, naturalWidth, naturalHeight,}, [arrayBuffer]);} catch (error) {self.postMessage({taskId, success: false, error: error.message || 'Unknown error occurred in worker',});}};";
  }

  async draw({
    naturalWidth,
    naturalHeight,
    rotate = 0,
    scaleX = 1,
    scaleY = 1,
  }) {
    // Use Worker if enabled and available
    if (this.useWorker && workerManager && workerManager.worker) {
      return this.drawWithWorker({
        naturalWidth,
        naturalHeight,
        rotate,
        scaleX,
        scaleY,
      });
    }

    // Fallback to main thread
    return this.drawOnMainThread({
      naturalWidth,
      naturalHeight,
      rotate,
      scaleX,
      scaleY,
    });
  }

  async drawWithWorker({
    naturalWidth,
    naturalHeight,
    rotate = 0,
    scaleX = 1,
    scaleY = 1,
  }) {
    const { file, options } = this;

    // Use stored raw image data (Blob or data URL) for Worker to decode
    // Worker will decode the image and process it, all in background thread
    const imageData = this.workerImageData;
    const imageMimeType = this.workerImageMimeType || file.type;

    if (!imageData) {
      // This shouldn't happen in Worker mode - workerImageData should be set
      if (this.options.useWorker === true) {
        throw new Error(
          'Worker image data not available. This indicates a bug in Worker initialization.',
        );
      }
      // Only for auto-detected mode, fallback to main thread
      this.useWorker = false;
      return this.drawOnMainThread({
        naturalWidth,
        naturalHeight,
        rotate,
        scaleX,
        scaleY,
      });
    }

    try {
      // Send raw image data to Worker
      // Worker will decode the image, extract dimensions, and compress
      // IMPORTANT: Filter out functions from options (they cannot be cloned by postMessage)
      const {
        success, error, beforeDraw, drew, ...serializableOptions
      } = options;

      const result = await workerManager.compress({
        imageData, // Blob or data URL - Worker will decode it
        imageMimeType,
        rotate,
        scaleX,
        scaleY,
        options: {
          ...serializableOptions,
          originalMimeType: file.type,
          fileSize: file.size,
        },
      });

      // Extract blob and dimensions from Worker result
      const blob = result.blob || result; // Support both new format and legacy
      const workerNaturalWidth = result.naturalWidth || naturalWidth;
      const workerNaturalHeight = result.naturalHeight || naturalHeight;

      // Determine if result is JPEG
      let resultMimeType = options.mimeType;
      if (!isImageType(resultMimeType)) {
        resultMimeType = file.type;
      }
      if (
        file.size > options.convertSize
        && options.convertTypes.indexOf(resultMimeType) >= 0
      ) {
        resultMimeType = 'image/jpeg';
      }
      const isJPEGImage = resultMimeType === 'image/jpeg';

      this.handleCompressionResult(blob, {
        naturalWidth: workerNaturalWidth,
        naturalHeight: workerNaturalHeight,
        isJPEGImage,
      });
      return undefined; // Explicit return for async method
    } catch (error) {
      // If useWorker is explicitly true, don't fallback to main thread
      if (this.options.useWorker === true) {
        this.fail(
          new Error(
            `Worker compression failed: ${
              error.message || 'Unknown error'
            }. Please check browser support for OffscreenCanvas.`,
          ),
        );
        return undefined;
      }
      // Only fallback if useWorker was auto-detected (undefined)
      this.useWorker = false;
      return this.drawOnMainThread({
        naturalWidth,
        naturalHeight,
        rotate,
        scaleX,
        scaleY,
      });
    }
  }

  drawOnMainThread({
    naturalWidth,
    naturalHeight,
    rotate = 0,
    scaleX = 1,
    scaleY = 1,
  }) {
    const { file, image, options } = this;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const is90DegreesRotated = Math.abs(rotate) % 180 === 90;
    const resizable = (options.resize === 'contain' || options.resize === 'cover')
      && isPositiveNumber(options.width)
      && isPositiveNumber(options.height);
    let maxWidth = Math.max(options.maxWidth, 0) || Infinity;
    let maxHeight = Math.max(options.maxHeight, 0) || Infinity;
    let minWidth = Math.max(options.minWidth, 0) || 0;
    let minHeight = Math.max(options.minHeight, 0) || 0;
    let aspectRatio = naturalWidth / naturalHeight;
    let { width, height } = options;

    if (is90DegreesRotated) {
      [maxWidth, maxHeight] = [maxHeight, maxWidth];
      [minWidth, minHeight] = [minHeight, minWidth];
      [width, height] = [height, width];
    }

    if (resizable) {
      aspectRatio = width / height;
    }

    ({ width: maxWidth, height: maxHeight } = getAdjustedSizes(
      {
        aspectRatio,
        width: maxWidth,
        height: maxHeight,
      },
      'contain',
    ));
    ({ width: minWidth, height: minHeight } = getAdjustedSizes(
      {
        aspectRatio,
        width: minWidth,
        height: minHeight,
      },
      'cover',
    ));

    if (resizable) {
      ({ width, height } = getAdjustedSizes(
        {
          aspectRatio,
          width,
          height,
        },
        options.resize,
      ));
    } else {
      ({ width = naturalWidth, height = naturalHeight } = getAdjustedSizes({
        aspectRatio,
        width,
        height,
      }));
    }

    width = Math.floor(
      normalizeDecimalNumber(Math.min(Math.max(width, minWidth), maxWidth)),
    );
    height = Math.floor(
      normalizeDecimalNumber(Math.min(Math.max(height, minHeight), maxHeight)),
    );

    const destX = -width / 2;
    const destY = -height / 2;
    const destWidth = width;
    const destHeight = height;
    const params = [];

    if (resizable) {
      let srcX = 0;
      let srcY = 0;
      let srcWidth = naturalWidth;
      let srcHeight = naturalHeight;

      ({ width: srcWidth, height: srcHeight } = getAdjustedSizes(
        {
          aspectRatio,
          width: naturalWidth,
          height: naturalHeight,
        },
        {
          contain: 'cover',
          cover: 'contain',
        }[options.resize],
      ));
      srcX = (naturalWidth - srcWidth) / 2;
      srcY = (naturalHeight - srcHeight) / 2;

      params.push(srcX, srcY, srcWidth, srcHeight);
    }

    params.push(destX, destY, destWidth, destHeight);

    if (is90DegreesRotated) {
      [width, height] = [height, width];
    }

    canvas.width = width;
    canvas.height = height;

    if (!isImageType(options.mimeType)) {
      options.mimeType = file.type;
    }

    let fillStyle = 'transparent';

    // Converts PNG files over the `convertSize` to JPEGs.
    if (
      file.size > options.convertSize
      && options.convertTypes.indexOf(options.mimeType) >= 0
    ) {
      options.mimeType = 'image/jpeg';
    }

    const isJPEGImage = options.mimeType === 'image/jpeg';

    if (isJPEGImage) {
      fillStyle = '#fff';
    }

    // Override the default fill color (#000, black)
    context.fillStyle = fillStyle;
    context.fillRect(0, 0, width, height);

    if (options.beforeDraw) {
      options.beforeDraw.call(this, context, canvas);
    }

    if (this.aborted) {
      return;
    }

    context.save();
    context.translate(width / 2, height / 2);
    context.rotate((rotate * Math.PI) / 180);
    context.scale(scaleX, scaleY);
    context.drawImage(image, ...params);
    context.restore();

    if (options.drew) {
      options.drew.call(this, context, canvas);
    }

    if (this.aborted) {
      return;
    }

    const callback = (blob) => {
      this.handleCompressionResult(blob, {
        naturalWidth,
        naturalHeight,
        isJPEGImage,
      });
    };

    // Ensure quality is applied correctly
    // Quality only works for JPEG and WebP, for other formats it's ignored
    const quality = (isJPEGImage || options.mimeType === 'image/webp')
      ? options.quality
      : undefined;

    if (canvas.toBlob) {
      // toBlob signature: toBlob(callback, mimeType, quality)
      canvas.toBlob(callback, options.mimeType, quality);
    } else {
      // toDataURL signature: toDataURL(mimeType, quality)
      // quality is only used for JPEG and WebP
      const dataURL = quality !== undefined
        ? canvas.toDataURL(options.mimeType, quality)
        : canvas.toDataURL(options.mimeType);
      callback(toBlob(dataURL));
    }
  }

  handleCompressionResult(blob, { naturalWidth, naturalHeight, isJPEGImage }) {
    const { options } = this;

    if (this.aborted) {
      return;
    }

    const done = (result) => this.done({ naturalWidth, naturalHeight, result });

    if (
      blob
      && isJPEGImage
      && options.retainExif
      && this.exif
      && this.exif.length > 0
    ) {
      const next = (arrayBuffer) => {
        done(
          toBlob(
            arrayBufferToDataURL(
              insertExif(arrayBuffer, this.exif),
              options.mimeType,
            ),
          ),
        );
      };

      if (blob.arrayBuffer) {
        blob
          .arrayBuffer()
          .then(next)
          .catch(() => {
            this.fail(
              new Error(
                'Failed to read the compressed image with Blob.arrayBuffer().',
              ),
            );
          });
      } else {
        const reader = new FileReader();

        this.reader = reader;
        reader.onload = ({ target }) => {
          next(target.result);
        };
        reader.onabort = () => {
          this.fail(
            new Error('Aborted to read the compressed image with FileReader.'),
          );
        };
        reader.onerror = () => {
          this.fail(
            new Error('Failed to read the compressed image with FileReader.'),
          );
        };
        reader.onloadend = () => {
          this.reader = null;
        };
        reader.readAsArrayBuffer(blob);
      }
    } else {
      done(blob);
    }
  }

  done({ naturalWidth, naturalHeight, result }) {
    const { file, image, options } = this;

    // Cleanup Blob URL
    if (URL && image.src.indexOf('blob:') === 0) {
      URL.revokeObjectURL(image.src);
    }

    // Cleanup resources after completion
    this.cleanup();

    if (result) {
      // Returns original file if the result is greater than it and without size related options
      if (
        options.strict
        && !options.retainExif
        && result.size > file.size
        && options.mimeType === file.type
        && !(
          options.width > naturalWidth
          || options.height > naturalHeight
          || options.minWidth > naturalWidth
          || options.minHeight > naturalHeight
          || options.maxWidth < naturalWidth
          || options.maxHeight < naturalHeight
        )
      ) {
        result = file;
      } else {
        const date = new Date();

        result.lastModified = date.getTime();
        result.lastModifiedDate = date;
        result.name = file.name;

        // Convert the extension to match its type
        if (result.name && result.type !== file.type) {
          result.name = result.name.replace(
            REGEXP_EXTENSION,
            imageTypeToExtension(result.type),
          );
        }
      }
    } else {
      // Returns original file if the result is null in some cases.
      result = file;
    }

    this.result = result;

    if (options.success) {
      options.success.call(this, result);
    }
  }

  fail(err) {
    const { options } = this;

    // Cleanup resources on error
    this.cleanup();

    if (options.error) {
      options.error.call(this, err);
    } else {
      throw err;
    }
  }

  /**
   * Cleanup resources (Blob URLs, event listeners, etc.)
   */
  cleanup() {
    // Cleanup Blob URL
    if (
      URL
      && this.image
      && this.image.src
      && this.image.src.indexOf('blob:') === 0
    ) {
      URL.revokeObjectURL(this.image.src);
    }

    // Cleanup all Image event listeners
    if (this.image) {
      this.image.onload = null;
      this.image.onabort = null;
      this.image.onerror = null;
    }

    // Cleanup FileReader
    if (this.reader) {
      this.reader.onload = null;
      this.reader.onabort = null;
      this.reader.onerror = null;
      this.reader.onloadend = null;
    }

    // Decrement worker manager reference count
    if (this.useWorker && workerManager && workerManagerRefCount > 0) {
      workerManagerRefCount -= 1;
      if (workerManagerRefCount === 0 && workerManager && !workerCleanupTimer) {
        workerCleanupTimer = setTimeout(() => {
          if (workerManagerRefCount === 0 && workerManager) {
            workerManager.terminate();
            workerManager = null;
          }
          workerCleanupTimer = null;
        }, 5000);
      }
    }
  }

  abort() {
    if (!this.aborted) {
      this.aborted = true;

      if (this.reader) {
        this.reader.abort();
      } else if (!this.image.complete) {
        // Cleanup all event listeners instead of just onload
        this.image.onload = null;
        this.image.onabort = null;
        this.image.onerror = null;
        // Don't call onabort() as it may trigger error handling
      } else {
        this.fail(new Error('The compression process has been aborted.'));
      }

      // Cleanup resources
      this.cleanup();
    }
  }

  /**
   * Get the no conflict compressor class.
   * @returns {Compressor} The compressor class.
   */
  static noConflict() {
    window.Compressor = AnotherCompressor;
    return Compressor;
  }

  /**
   * Change the default options.
   * @param {Object} options - The new default options.
   */
  static setDefaults(options) {
    Object.assign(DEFAULTS, options);
  }

  /**
   * Cleanup global worker manager instance.
   * Call this when you're done with all compression tasks to free resources.
   */
  static cleanup() {
    if (workerManager) {
      workerManager.terminate();
      workerManager = null;
      workerManagerRefCount = 0;
    }
  }
}
