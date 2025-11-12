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
 * Convert image data URL to ImageData
 */
function imageDataURLToImageData(dataURL) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = new OffscreenCanvas(img.width, img.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      resolve(imageData);
    };
    img.onerror = reject;
    img.src = dataURL;
  });
}

/**
 * Main worker message handler
 */
self.onmessage = async function (e) {
  const {
    action,
    imageDataURL,
    naturalWidth,
    naturalHeight,
    rotate = 0,
    scaleX = 1,
    scaleY = 1,
    options,
    taskId,
  } = e.data;

  // Handle getDimensions action (to avoid decoding in main thread)
  if (action === 'getDimensions') {
    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageDataURL;
      });

      self.postMessage({
        taskId,
        dimensions: {
          width: img.naturalWidth,
          height: img.naturalHeight,
        },
      });
      return;
    } catch (error) {
      self.postMessage({
        taskId,
        error: error.message || 'Failed to get dimensions',
      });
      return;
    }
  }

  // Normal compression flow
  try {
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

    // Load and draw image
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageDataURL;
    });

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
    context.save();
    context.translate(width / 2, height / 2);
    context.rotate((rotate * Math.PI) / 180);
    context.scale(scaleX, scaleY);
    context.drawImage(img, ...params);
    context.restore();

    // Convert to blob
    const blob = await canvas.convertToBlob({
      type: mimeType,
      quality: options.quality,
    });

    // Convert blob to ArrayBuffer for transfer
    const arrayBuffer = await blob.arrayBuffer();

    // Send result back to main thread
    self.postMessage({
      taskId,
      success: true,
      arrayBuffer,
      mimeType,
    }, [arrayBuffer]);
  } catch (error) {
    // Send error back to main thread
    self.postMessage({
      taskId,
      success: false,
      error: error.message || 'Unknown error occurred in worker',
    });
  }
};
