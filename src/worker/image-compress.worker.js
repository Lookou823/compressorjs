/**
 * Image compression Web Worker
 * Handles canvas operations in a separate thread to avoid blocking the main thread
 */

// Import utilities (these will be bundled separately or inlined)
// Note: Worker cannot use ES6 imports directly, so we'll use a different approach

/**
 * Check if the given value is a positive number.
 */
function isPositiveNumber(value) {
  return value > 0 && value < Infinity;
}

/**
 * Normalize decimal number.
 */
function normalizeDecimalNumber(value, times = 100000000000) {
  const REGEXP_DECIMALS = /\.\d*(?:0|9){12}\d*$/;
  return REGEXP_DECIMALS.test(value) ? (Math.round(value * times) / times) : value;
}

/**
 * Get the max sizes in a rectangle under the given aspect ratio.
 */
function getAdjustedSizes({ aspectRatio, height, width }, type = 'none') {
  const isValidWidth = isPositiveNumber(width);
  const isValidHeight = isPositiveNumber(height);

  if (isValidWidth && isValidHeight) {
    const adjustedWidth = height * aspectRatio;

    if (((type === 'contain' || type === 'none') && adjustedWidth > width) || (type === 'cover' && adjustedWidth < width)) {
      height = width / aspectRatio;
    } else {
      width = height * aspectRatio;
    }
  } else if (isValidWidth) {
    height = width / aspectRatio;
  } else if (isValidHeight) {
    width = height * aspectRatio;
  }

  return { width, height };
}

/**
 * Check if the given value is a mime type of image.
 */
function isImageType(value) {
  const REGEXP_IMAGE_TYPE = /^image\/.+$/;
  return REGEXP_IMAGE_TYPE.test(value);
}

/**
 * Decode image in Worker using the best available API
 * @param {Blob|string} imageData - Image data (Blob, data URL, or URL)
 * @param {string} mimeType - Image MIME type
 * @returns {Promise<{imageBitmap: ImageBitmap, width: number, height: number}>}
 */
async function decodeImageInWorker(imageData, mimeType) {
  // Priority 1: Use createImageBitmap (most modern, works with Blob/ArrayBuffer)
  if (typeof createImageBitmap !== 'undefined') {
    let blob = imageData;
    
    // Handle different input types
    if (imageData instanceof Blob || imageData instanceof File) {
      // Already a Blob/File, use directly
      blob = imageData;
    } else if (imageData instanceof ArrayBuffer) {
      // ArrayBuffer from main thread (converted from data URL without decoding)
      blob = new Blob([imageData], { type: mimeType || 'image/jpeg' });
    } else if (typeof imageData === 'string' && imageData.startsWith('blob:')) {
      // Blob URL - fetch it (this doesn't decode, just gets the blob)
      const response = await fetch(imageData);
      blob = await response.blob();
    } else if (typeof imageData === 'string' && imageData.startsWith('data:')) {
      // Data URL - convert to Blob without triggering main thread decoding
      // This should rarely happen as we convert data URL to ArrayBuffer in main thread
      const response = await fetch(imageData);
      blob = await response.blob();
    } else {
      // Fallback: assume it's a URL string
      const response = await fetch(imageData);
      blob = await response.blob();
    }
    
    const imageBitmap = await createImageBitmap(blob);
    return {
      imageBitmap,
      width: imageBitmap.width,
      height: imageBitmap.height,
    };
  }

  // Priority 2: Use ImageDecoder API (Chrome 94+)
  if (typeof ImageDecoder !== 'undefined') {
    let arrayBuffer;

    if (imageData instanceof Blob || imageData instanceof File) {
      arrayBuffer = await imageData.arrayBuffer();
    } else if (imageData instanceof ArrayBuffer) {
      arrayBuffer = imageData;
    } else if (typeof imageData === 'string') {
      const response = await fetch(imageData);
      arrayBuffer = await (await response.blob()).arrayBuffer();
    } else {
      throw new Error('Unsupported image data format for ImageDecoder');
    }

    const decoder = new ImageDecoder({
      data: arrayBuffer,
      type: mimeType || 'image/jpeg',
    });
    const { image } = await decoder.decode();

    return {
      imageBitmap: image,
      width: typeof image.displayWidth === 'number' ? image.displayWidth : image.width,
      height: typeof image.displayHeight === 'number' ? image.displayHeight : image.height,
    };
  }

  // Priority 3: Fallback to Image + OffscreenCanvas (traditional method)
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;

    if (imageData instanceof Blob || imageData instanceof File) {
      img.src = URL.createObjectURL(imageData);
    } else if (imageData instanceof ArrayBuffer) {
      const blob = new Blob([imageData], { type: mimeType || 'image/jpeg' });
      img.src = URL.createObjectURL(blob);
    } else {
      img.src = imageData;
    }
  });

  // Create ImageBitmap from Image for consistency
  if (typeof createImageBitmap !== 'undefined') {
    const imageBitmap = await createImageBitmap(img);
    if (img.src.startsWith('blob:')) {
      URL.revokeObjectURL(img.src);
    }
    return {
      imageBitmap,
      width: img.naturalWidth,
      height: img.naturalHeight,
    };
  }

  // Last resort: return Image dimensions (will use Image directly in drawImage)
  return {
    imageBitmap: img,
    width: img.naturalWidth,
    height: img.naturalHeight,
  };
}

/**
 * Main worker message handler
 * @param {MessageEvent} e - Message event from main thread
 */
// eslint-disable-next-line no-restricted-globals
self.onmessage = async function (e) {
  const {
    imageData, // Blob, data URL, or URL - Worker will decode it
    imageMimeType,
    rotate = 0,
    scaleX = 1,
    scaleY = 1,
    options,
    taskId,
  } = e.data;

  // Worker decodes image in background thread, avoiding main thread blocking
  try {
    // Decode image in Worker thread
    const { imageBitmap, width: naturalWidth, height: naturalHeight } = await decodeImageInWorker(
      imageData,
      imageMimeType,
    );
    // Calculate dimensions (same logic as main thread)
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

    ({ width: maxWidth, height: maxHeight } = getAdjustedSizes({
      aspectRatio,
      width: maxWidth,
      height: maxHeight,
    }, 'contain'));

    ({ width: minWidth, height: minHeight } = getAdjustedSizes({
      aspectRatio,
      width: minWidth,
      height: minHeight,
    }, 'cover'));

    if (resizable) {
      ({ width, height } = getAdjustedSizes({
        aspectRatio,
        width,
        height,
      }, options.resize));
    } else {
      ({ width = naturalWidth, height = naturalHeight } = getAdjustedSizes({
        aspectRatio,
        width,
        height,
      }));
    }

    width = Math.floor(normalizeDecimalNumber(Math.min(Math.max(width, minWidth), maxWidth)));
    height = Math.floor(normalizeDecimalNumber(Math.min(Math.max(height, minHeight), maxHeight)));

    // Determine mime type
    let { mimeType } = options;
    if (!isImageType(mimeType)) {
      mimeType = options.originalMimeType || 'image/jpeg';
    }

    // Convert PNG to JPEG if needed
    if (options.fileSize > options.convertSize && options.convertTypes.indexOf(mimeType) >= 0) {
      mimeType = 'image/jpeg';
      if (options.debug) {
        // eslint-disable-next-line no-console
        console.log('[compressor-worker] convert by size threshold: PNG→JPEG');
      }
    }

    if (
      mimeType === 'image/png'
      && typeof options.quality === 'number'
      && options.quality < 1
      && options.pngToJpegForQuality === true
    ) {
      mimeType = 'image/jpeg';
      if (options.debug) {
        // eslint-disable-next-line no-console
        console.log('[compressor-worker] convert by quality intent: PNG→JPEG');
      }
    }

    const isJPEGImage = mimeType === 'image/jpeg';

    // Create OffscreenCanvas
    if (is90DegreesRotated) {
      [width, height] = [height, width];
    }

    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');

    // Fill background
    const fillStyle = isJPEGImage ? '#fff' : 'transparent';
    context.fillStyle = fillStyle;
    context.fillRect(0, 0, width, height);

    // imageBitmap is already decoded in Worker thread
    // Use it directly for drawing

    // Calculate draw parameters
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

      ({ width: srcWidth, height: srcHeight } = getAdjustedSizes({
        aspectRatio,
        width: naturalWidth,
        height: naturalHeight,
      }, {
        contain: 'cover',
        cover: 'contain',
      }[options.resize]));

      srcX = (naturalWidth - srcWidth) / 2;
      srcY = (naturalHeight - srcHeight) / 2;
      params.push(srcX, srcY, srcWidth, srcHeight);
    }

    params.push(destX, destY, destWidth, destHeight);

    // Apply transformations and draw
    // Image decoding and all Canvas operations happen in Worker thread
    context.save();
    context.translate(width / 2, height / 2);
    context.rotate((rotate * Math.PI) / 180);
    context.scale(scaleX, scaleY);

    // Draw decoded imageBitmap directly
    if (imageBitmap instanceof ImageBitmap) {
      context.drawImage(imageBitmap, ...params);
    } else {
      // Fallback for Image object
      context.drawImage(imageBitmap, ...params);
      if (imageBitmap.src && imageBitmap.src.startsWith('blob:')) {
        URL.revokeObjectURL(imageBitmap.src);
      }
    }

    context.restore();

    // Convert to blob
    const blob = await canvas.convertToBlob({
      type: mimeType,
      quality: options.quality,
    });

    // Convert blob to ArrayBuffer for transfer
    const arrayBuffer = await blob.arrayBuffer();

    // Send result back to main thread (include dimensions for handleCompressionResult)
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({
      taskId,
      success: true,
      arrayBuffer,
      mimeType,
      naturalWidth,
      naturalHeight,
    }, [arrayBuffer]);
  } catch (error) {
    // Send error back to main thread
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({
      taskId,
      success: false,
      error: error.message || 'Unknown error occurred in worker',
    });
  }
};
