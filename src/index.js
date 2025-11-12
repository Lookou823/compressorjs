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
            taskId, success, arrayBuffer, mimeType, error, dimensions,
          } = e.data;

          // Handle getDimensions response (not a compression task)
          if (dimensions !== undefined && !success && !arrayBuffer) {
            // This is a dimensions response, let the caller handle it
            // (getImageDimensionsFromWorker will intercept it)
            return;
          }
          // Handle compression task response
          const task = this.pendingTasks.get(taskId);

          if (task) {
            this.pendingTasks.delete(taskId);
            if (success) {
              const resultBlob = new Blob([arrayBuffer], { type: mimeType });
              task.resolve(resultBlob);
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
          if (!this.worker) {
            reject(error);
          }
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

      this.worker.postMessage({
        ...data,
        taskId,
      });
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

    if (URL && !checkOrientation && !retainExif) {
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

    // In Worker mode, skip loading Image in main thread to avoid decoding in main thread
    // We'll get dimensions from the Worker instead
    if (this.useWorker && this.workerInitialized) {
      // For Worker mode, we need to get dimensions without decoding in main thread
      // We'll use a lightweight approach: create a small Image just to get dimensions
      // This still decodes, but we can optimize this later with ImageDecoder API
      // For now, let's pass the data URL to Worker and let it handle everything
      this.getImageDimensionsForWorker(data);
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
    image.src = data.url;
  }

  /**
   * Get image dimensions for Worker mode without decoding in main thread
   * Sends image to Worker to get dimensions, avoiding main thread decoding
   * @param {Object} data - Image data object
   * @returns {Promise<void>} Promise that resolves when dimensions are obtained
   */
  async getImageDimensionsForWorker(data) {
    // Ensure Worker is ready before getting dimensions
    if (!workerManager || !workerManager.worker) {
      // Worker not ready
      if (this.options.useWorker === true) {
        // Explicitly requested Worker mode, don't fallback
        this.fail(
          new Error(
            'Worker not initialized. Please check browser support for OffscreenCanvas.',
          ),
        );
        return;
      }
      // Only fallback if useWorker was auto-detected
      this.useWorker = false;
      this.workerInitialized = true;
      this.proceedWithLoad(data);
      return;
    }

    try {
      // Convert to data URL if needed (this doesn't decode the image)
      let imageDataURL = data.url;
      if (imageDataURL.startsWith('blob:')) {
        const response = await fetch(imageDataURL);
        const blob = await response.blob();
        imageDataURL = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      // Store data URL for Worker to use (avoid using image.src)
      this.workerImageDataURL = imageDataURL;

      // Send to Worker to get dimensions (Worker will decode in its own thread)
      const dimensions = await Compressor.getImageDimensionsFromWorker(
        imageDataURL,
      );

      // Now proceed with Worker drawing using dimensions from Worker
      this.draw({
        ...data,
        naturalWidth: dimensions.width,
        naturalHeight: dimensions.height,
      });
    } catch (error) {
      // If Worker fails and useWorker is explicitly true, throw error instead of falling back
      // This ensures that when useWorker=true, we never decode in main thread
      if (this.options.useWorker === true) {
        // Explicitly requested Worker mode, don't fallback to main thread
        this.fail(
          new Error(
            `Worker mode failed: ${error.message}. Please check browser support for OffscreenCanvas.`,
          ),
        );
        return;
      }

      // Only fallback if useWorker was auto-detected (undefined)
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn(
          'Worker dimension detection failed, falling back to main thread:',
          error,
        );
      }
      this.useWorker = false;
      this.workerInitialized = true;
      // Fallback to main thread loading (only for auto-detected mode)
      this.proceedWithLoad(data);
    }
  }

  /**
   * Get image dimensions from Worker (decodes in Worker thread, not main thread)
   * @param {string} imageDataURL - Image data URL
   * @returns {Promise<Object>} Promise that resolves with dimensions object {width, height}
   */
  static getImageDimensionsFromWorker(imageDataURL) {
    return new Promise((resolve, reject) => {
      if (!workerManager || !workerManager.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const taskId = `dimensions-${Date.now()}-${Math.random()}`;
      let resolved = false;

      // Use WorkerManager's message handler, but intercept dimensions messages
      const originalOnMessage = workerManager.worker.onmessage;
      workerManager.worker.onmessage = (e) => {
        const { taskId: msgTaskId, dimensions: dims, error: err } = e.data;

        // Check if this is a dimensions response
        if (msgTaskId === taskId && (dims || err)) {
          if (!resolved) {
            resolved = true;
            // Restore original handler
            workerManager.worker.onmessage = originalOnMessage;

            if (dims) {
              resolve(dims);
            } else {
              reject(new Error(err || 'Failed to get dimensions from Worker'));
            }
            return;
          }
        }

        // Pass other messages to original handler
        if (originalOnMessage) {
          originalOnMessage(e);
        }
      };

      // Send request to Worker
      workerManager.worker.postMessage({
        taskId,
        action: 'getDimensions',
        imageDataURL,
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          workerManager.worker.onmessage = originalOnMessage;
          reject(new Error('Timeout getting dimensions from Worker'));
        }
      }, 5000);
    });
  }

  async initializeWorker() {
    if (!workerManager) {
      workerManager = new WorkerManager();
    }
    // Increment reference count
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
    // Return the worker code as a string
    // This will be replaced with actual worker code during build or runtime
    // IMPORTANT: Must include getDimensions action handler to avoid main thread decoding
    // eslint-disable-next-line max-len, quotes, no-useless-escape
    return "self.onmessage=async function(e){const{action,imageDataURL,naturalWidth,naturalHeight,rotate=0,scaleX=1,scaleY=1,options,taskId}=e.data;if(action==='getDimensions'){try{const img=new Image();await new Promise((r,j)=>{img.onload=r;img.onerror=j;img.src=imageDataURL});self.postMessage({taskId,dimensions:{width:img.naturalWidth,height:img.naturalHeight}});return}catch(e){self.postMessage({taskId,error:e.message||'Failed to get dimensions'});return}}try{function isPositiveNumber(v){return v>0&&v<Infinity}function normalizeDecimalNumber(v,t=1e11){return/\\.\\d*(?:0|9){12}\\d*$/.test(v)?Math.round(v*t)/t:v}function getAdjustedSizes({aspectRatio,height,width},type='none'){const iw=isPositiveNumber(width),ih=isPositiveNumber(height);if(iw&&ih){const aw=height*aspectRatio;if((type==='contain'||type==='none')&&aw>width||type==='cover'&&aw<width)height=width/aspectRatio;else width=height*aspectRatio}else if(iw)height=width/aspectRatio;else if(ih)width=height*aspectRatio;return{width,height}}function isImageType(v){return/^image\\/.+$/.test(v)}const is90=Math.abs(rotate)%180===90,resizable=(options.resize==='contain'||options.resize==='cover')&&isPositiveNumber(options.width)&&isPositiveNumber(options.height);let mw=Math.max(options.maxWidth,0)||Infinity,mh=Math.max(options.maxHeight,0)||Infinity,minw=Math.max(options.minWidth,0)||0,minh=Math.max(options.minHeight,0)||0,ar=naturalWidth/naturalHeight,w=options.width,h=options.height;if(is90){[mw,mh]=[mh,mw];[minw,minh]=[minh,minw];[w,h]=[h,w]}if(resizable)ar=w/h;({width:mw,height:mh}=getAdjustedSizes({aspectRatio:ar,width:mw,height:mh},'contain'));({width:minw,height:minh}=getAdjustedSizes({aspectRatio:ar,width:minw,height:minh},'cover'));if(resizable)({width:w,height:h}=getAdjustedSizes({aspectRatio:ar,width:w,height:h},options.resize));else({width:w=naturalWidth,height:h=naturalHeight}=getAdjustedSizes({aspectRatio:ar,width:w,height:h}));w=Math.floor(normalizeDecimalNumber(Math.min(Math.max(w,minw),mw)));h=Math.floor(normalizeDecimalNumber(Math.min(Math.max(h,minh),mh)));let mt=options.mimeType;if(!isImageType(mt))mt=options.originalMimeType||'image/jpeg';if(options.fileSize>options.convertSize&&options.convertTypes.indexOf(mt)>=0)mt='image/jpeg';const isJpeg=mt==='image/jpeg';if(is90)[w,h]=[h,w];const canvas=new OffscreenCanvas(w,h),ctx=canvas.getContext('2d');ctx.fillStyle=isJpeg?'#fff':'transparent';ctx.fillRect(0,0,w,h);const img=new Image();await new Promise((r,j)=>{img.onload=r;img.onerror=j;img.src=imageDataURL});const dx=-w/2,dy=-h/2,dw=w,dh=h,params=[];if(resizable){let sx=0,sy=0,sw=naturalWidth,sh=naturalHeight;({width:sw,height:sh}=getAdjustedSizes({aspectRatio:ar,width:naturalWidth,height:naturalHeight},{contain:'cover',cover:'contain'}[options.resize]));sx=(naturalWidth-sw)/2;sy=(naturalHeight-sh)/2;params.push(sx,sy,sw,sh)}params.push(dx,dy,dw,dh);ctx.save();ctx.translate(w/2,h/2);ctx.rotate(rotate*Math.PI/180);ctx.scale(scaleX,scaleY);ctx.drawImage(img,...params);ctx.restore();const blob=await canvas.convertToBlob({type:mt,quality:options.quality}),ab=await blob.arrayBuffer();self.postMessage({taskId,success:true,arrayBuffer:ab,mimeType:mt},[ab])}catch(e){self.postMessage({taskId,success:false,error:e.message||'Unknown error'})}};";
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

    // Use stored data URL from Worker dimension detection (avoids main thread decoding)
    // If not available, this is an error condition in Worker mode
    let imageDataURL = this.workerImageDataURL;
    if (!imageDataURL) {
      // This shouldn't happen in Worker mode - workerImageDataURL should be set
      // If useWorker is explicitly true, fail instead of using image.src
      // (which may decode in main thread)
      if (this.options.useWorker === true) {
        throw new Error(
          'Worker image data URL not available. This indicates a bug in Worker initialization.',
        );
      }
      // Only for auto-detected mode, try to get from image.src
      const { image } = this;
      if (image.src.startsWith('data:')) {
        imageDataURL = image.src;
      } else if (image.src.startsWith('blob:')) {
        // Convert blob URL to data URL (this doesn't decode the image)
        const response = await fetch(image.src);
        const blob = await response.blob();
        imageDataURL = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        imageDataURL = image.src;
      }
    }

    try {
      const blob = await workerManager.compress({
        imageDataURL,
        naturalWidth,
        naturalHeight,
        rotate,
        scaleX,
        scaleY,
        options: {
          ...options,
          originalMimeType: file.type,
          fileSize: file.size,
        },
      });

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
        naturalWidth,
        naturalHeight,
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

    if (canvas.toBlob) {
      canvas.toBlob(callback, options.mimeType, options.quality);
    } else {
      callback(toBlob(canvas.toDataURL(options.mimeType, options.quality)));
    }
  }

  handleCompressionResult(blob, { naturalWidth, naturalHeight, isJPEGImage }) {
    const { options } = this;

    if (this.aborted) {
      return;
    }

    const done = (result) => this.done({
      naturalWidth,
      naturalHeight,
      result,
    });

    if (
      blob
      && isJPEGImage
      && options.retainExif
      && this.exif
      && this.exif.length > 0
    ) {
      const next = (arrayBuffer) => done(
        toBlob(
          arrayBufferToDataURL(
            insertExif(arrayBuffer, this.exif),
            options.mimeType,
          ),
        ),
      );

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
      // If no more references, cleanup worker manager
      if (workerManagerRefCount === 0 && workerManager) {
        workerManager.terminate();
        workerManager = null;
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
