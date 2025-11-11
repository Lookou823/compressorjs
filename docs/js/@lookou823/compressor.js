/*!
 * Lookou823Compressor.js v1.2.1-0
 * https://github.com/Lookou823/compressorjs#readme
 *
 * Copyright 2018-present Lookou823
 * Released under the MIT license
 *
 * Date: 2025-11-11T06:40:12.570Z
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Lookou823Compressor = factory());
})(this, (function () { 'use strict';

  function asyncGeneratorStep(n, t, e, r, o, a, c) {
    try {
      var i = n[a](c),
        u = i.value;
    } catch (n) {
      return void e(n);
    }
    i.done ? t(u) : Promise.resolve(u).then(r, o);
  }
  function _asyncToGenerator(n) {
    return function () {
      var t = this,
        e = arguments;
      return new Promise(function (r, o) {
        var a = n.apply(t, e);
        function _next(n) {
          asyncGeneratorStep(a, r, o, _next, _throw, "next", n);
        }
        function _throw(n) {
          asyncGeneratorStep(a, r, o, _next, _throw, "throw", n);
        }
        _next(void 0);
      });
    };
  }
  function _classCallCheck(a, n) {
    if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
  }
  function _defineProperties(e, r) {
    for (var t = 0; t < r.length; t++) {
      var o = r[t];
      o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o);
    }
  }
  function _createClass(e, r, t) {
    return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", {
      writable: !1
    }), e;
  }
  function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
      value: t,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[r] = t, e;
  }
  function _extends() {
    return _extends = Object.assign ? Object.assign.bind() : function (n) {
      for (var e = 1; e < arguments.length; e++) {
        var t = arguments[e];
        for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
      }
      return n;
    }, _extends.apply(null, arguments);
  }
  function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function (r) {
        return Object.getOwnPropertyDescriptor(e, r).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread2(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {
        _defineProperty(e, r, t[r]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
        Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
      });
    }
    return e;
  }
  function _regeneratorRuntime() {
    _regeneratorRuntime = function () {
      return e;
    };
    var t,
      e = {},
      r = Object.prototype,
      n = r.hasOwnProperty,
      o = Object.defineProperty || function (t, e, r) {
        t[e] = r.value;
      },
      i = "function" == typeof Symbol ? Symbol : {},
      a = i.iterator || "@@iterator",
      c = i.asyncIterator || "@@asyncIterator",
      u = i.toStringTag || "@@toStringTag";
    function define(t, e, r) {
      return Object.defineProperty(t, e, {
        value: r,
        enumerable: !0,
        configurable: !0,
        writable: !0
      }), t[e];
    }
    try {
      define({}, "");
    } catch (t) {
      define = function (t, e, r) {
        return t[e] = r;
      };
    }
    function wrap(t, e, r, n) {
      var i = e && e.prototype instanceof Generator ? e : Generator,
        a = Object.create(i.prototype),
        c = new Context(n || []);
      return o(a, "_invoke", {
        value: makeInvokeMethod(t, r, c)
      }), a;
    }
    function tryCatch(t, e, r) {
      try {
        return {
          type: "normal",
          arg: t.call(e, r)
        };
      } catch (t) {
        return {
          type: "throw",
          arg: t
        };
      }
    }
    e.wrap = wrap;
    var h = "suspendedStart",
      l = "suspendedYield",
      f = "executing",
      s = "completed",
      y = {};
    function Generator() {}
    function GeneratorFunction() {}
    function GeneratorFunctionPrototype() {}
    var p = {};
    define(p, a, function () {
      return this;
    });
    var d = Object.getPrototypeOf,
      v = d && d(d(values([])));
    v && v !== r && n.call(v, a) && (p = v);
    var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p);
    function defineIteratorMethods(t) {
      ["next", "throw", "return"].forEach(function (e) {
        define(t, e, function (t) {
          return this._invoke(e, t);
        });
      });
    }
    function AsyncIterator(t, e) {
      function invoke(r, o, i, a) {
        var c = tryCatch(t[r], t, o);
        if ("throw" !== c.type) {
          var u = c.arg,
            h = u.value;
          return h && "object" == typeof h && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) {
            invoke("next", t, i, a);
          }, function (t) {
            invoke("throw", t, i, a);
          }) : e.resolve(h).then(function (t) {
            u.value = t, i(u);
          }, function (t) {
            return invoke("throw", t, i, a);
          });
        }
        a(c.arg);
      }
      var r;
      o(this, "_invoke", {
        value: function (t, n) {
          function callInvokeWithMethodAndArg() {
            return new e(function (e, r) {
              invoke(t, n, e, r);
            });
          }
          return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
        }
      });
    }
    function makeInvokeMethod(e, r, n) {
      var o = h;
      return function (i, a) {
        if (o === f) throw Error("Generator is already running");
        if (o === s) {
          if ("throw" === i) throw a;
          return {
            value: t,
            done: !0
          };
        }
        for (n.method = i, n.arg = a;;) {
          var c = n.delegate;
          if (c) {
            var u = maybeInvokeDelegate(c, n);
            if (u) {
              if (u === y) continue;
              return u;
            }
          }
          if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) {
            if (o === h) throw o = s, n.arg;
            n.dispatchException(n.arg);
          } else "return" === n.method && n.abrupt("return", n.arg);
          o = f;
          var p = tryCatch(e, r, n);
          if ("normal" === p.type) {
            if (o = n.done ? s : l, p.arg === y) continue;
            return {
              value: p.arg,
              done: n.done
            };
          }
          "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg);
        }
      };
    }
    function maybeInvokeDelegate(e, r) {
      var n = r.method,
        o = e.iterator[n];
      if (o === t) return r.delegate = null, "throw" === n && e.iterator.return && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y;
      var i = tryCatch(o, e.iterator, r.arg);
      if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y;
      var a = i.arg;
      return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y);
    }
    function pushTryEntry(t) {
      var e = {
        tryLoc: t[0]
      };
      1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e);
    }
    function resetTryEntry(t) {
      var e = t.completion || {};
      e.type = "normal", delete e.arg, t.completion = e;
    }
    function Context(t) {
      this.tryEntries = [{
        tryLoc: "root"
      }], t.forEach(pushTryEntry, this), this.reset(!0);
    }
    function values(e) {
      if (e || "" === e) {
        var r = e[a];
        if (r) return r.call(e);
        if ("function" == typeof e.next) return e;
        if (!isNaN(e.length)) {
          var o = -1,
            i = function next() {
              for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next;
              return next.value = t, next.done = !0, next;
            };
          return i.next = i;
        }
      }
      throw new TypeError(typeof e + " is not iterable");
    }
    return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", {
      value: GeneratorFunctionPrototype,
      configurable: !0
    }), o(GeneratorFunctionPrototype, "constructor", {
      value: GeneratorFunction,
      configurable: !0
    }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) {
      var e = "function" == typeof t && t.constructor;
      return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name));
    }, e.mark = function (t) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t;
    }, e.awrap = function (t) {
      return {
        __await: t
      };
    }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () {
      return this;
    }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) {
      void 0 === i && (i = Promise);
      var a = new AsyncIterator(wrap(t, r, n, o), i);
      return e.isGeneratorFunction(r) ? a : a.next().then(function (t) {
        return t.done ? t.value : a.next();
      });
    }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () {
      return this;
    }), define(g, "toString", function () {
      return "[object Generator]";
    }), e.keys = function (t) {
      var e = Object(t),
        r = [];
      for (var n in e) r.push(n);
      return r.reverse(), function next() {
        for (; r.length;) {
          var t = r.pop();
          if (t in e) return next.value = t, next.done = !1, next;
        }
        return next.done = !0, next;
      };
    }, e.values = values, Context.prototype = {
      constructor: Context,
      reset: function (e) {
        if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t);
      },
      stop: function () {
        this.done = !0;
        var t = this.tryEntries[0].completion;
        if ("throw" === t.type) throw t.arg;
        return this.rval;
      },
      dispatchException: function (e) {
        if (this.done) throw e;
        var r = this;
        function handle(n, o) {
          return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o;
        }
        for (var o = this.tryEntries.length - 1; o >= 0; --o) {
          var i = this.tryEntries[o],
            a = i.completion;
          if ("root" === i.tryLoc) return handle("end");
          if (i.tryLoc <= this.prev) {
            var c = n.call(i, "catchLoc"),
              u = n.call(i, "finallyLoc");
            if (c && u) {
              if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
              if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
            } else if (c) {
              if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
            } else {
              if (!u) throw Error("try statement without catch or finally");
              if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
            }
          }
        }
      },
      abrupt: function (t, e) {
        for (var r = this.tryEntries.length - 1; r >= 0; --r) {
          var o = this.tryEntries[r];
          if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) {
            var i = o;
            break;
          }
        }
        i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null);
        var a = i ? i.completion : {};
        return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a);
      },
      complete: function (t, e) {
        if ("throw" === t.type) throw t.arg;
        return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y;
      },
      finish: function (t) {
        for (var e = this.tryEntries.length - 1; e >= 0; --e) {
          var r = this.tryEntries[e];
          if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y;
        }
      },
      catch: function (t) {
        for (var e = this.tryEntries.length - 1; e >= 0; --e) {
          var r = this.tryEntries[e];
          if (r.tryLoc === t) {
            var n = r.completion;
            if ("throw" === n.type) {
              var o = n.arg;
              resetTryEntry(r);
            }
            return o;
          }
        }
        throw Error("illegal catch attempt");
      },
      delegateYield: function (e, r, n) {
        return this.delegate = {
          iterator: values(e),
          resultName: r,
          nextLoc: n
        }, "next" === this.method && (this.arg = t), y;
      }
    }, e;
  }
  function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != typeof i) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
  }

  var canvasToBlob = {exports: {}};

  /*
   * JavaScript Canvas to Blob
   * https://github.com/blueimp/JavaScript-Canvas-to-Blob
   *
   * Copyright 2012, Sebastian Tschan
   * https://blueimp.net
   *
   * Licensed under the MIT license:
   * https://opensource.org/licenses/MIT
   *
   * Based on stackoverflow user Stoive's code snippet:
   * http://stackoverflow.com/q/4998908
   */
  (function (module) {
  if (typeof window === 'undefined') {
    return;
  }
    (function (window) {

      var CanvasPrototype = window.HTMLCanvasElement && window.HTMLCanvasElement.prototype;
      var hasBlobConstructor = window.Blob && function () {
        try {
          return Boolean(new Blob());
        } catch (e) {
          return false;
        }
      }();
      var hasArrayBufferViewSupport = hasBlobConstructor && window.Uint8Array && function () {
        try {
          return new Blob([new Uint8Array(100)]).size === 100;
        } catch (e) {
          return false;
        }
      }();
      var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
      var dataURIPattern = /^data:((.*?)(;charset=.*?)?)(;base64)?,/;
      var dataURLtoBlob = (hasBlobConstructor || BlobBuilder) && window.atob && window.ArrayBuffer && window.Uint8Array && function (dataURI) {
        var matches, mediaType, isBase64, dataString, byteString, arrayBuffer, intArray, i, bb;
        // Parse the dataURI components as per RFC 2397
        matches = dataURI.match(dataURIPattern);
        if (!matches) {
          throw new Error('invalid data URI');
        }
        // Default to text/plain;charset=US-ASCII
        mediaType = matches[2] ? matches[1] : 'text/plain' + (matches[3] || ';charset=US-ASCII');
        isBase64 = !!matches[4];
        dataString = dataURI.slice(matches[0].length);
        if (isBase64) {
          // Convert base64 to raw binary data held in a string:
          byteString = atob(dataString);
        } else {
          // Convert base64/URLEncoded data component to raw binary:
          byteString = decodeURIComponent(dataString);
        }
        // Write the bytes of the string to an ArrayBuffer:
        arrayBuffer = new ArrayBuffer(byteString.length);
        intArray = new Uint8Array(arrayBuffer);
        for (i = 0; i < byteString.length; i += 1) {
          intArray[i] = byteString.charCodeAt(i);
        }
        // Write the ArrayBuffer (or ArrayBufferView) to a blob:
        if (hasBlobConstructor) {
          return new Blob([hasArrayBufferViewSupport ? intArray : arrayBuffer], {
            type: mediaType
          });
        }
        bb = new BlobBuilder();
        bb.append(arrayBuffer);
        return bb.getBlob(mediaType);
      };
      if (window.HTMLCanvasElement && !CanvasPrototype.toBlob) {
        if (CanvasPrototype.mozGetAsFile) {
          CanvasPrototype.toBlob = function (callback, type, quality) {
            var self = this;
            setTimeout(function () {
              if (quality && CanvasPrototype.toDataURL && dataURLtoBlob) {
                callback(dataURLtoBlob(self.toDataURL(type, quality)));
              } else {
                callback(self.mozGetAsFile('blob', type));
              }
            });
          };
        } else if (CanvasPrototype.toDataURL && dataURLtoBlob) {
          if (CanvasPrototype.msToBlob) {
            CanvasPrototype.toBlob = function (callback, type, quality) {
              var self = this;
              setTimeout(function () {
                if ((type && type !== 'image/png' || quality) && CanvasPrototype.toDataURL && dataURLtoBlob) {
                  callback(dataURLtoBlob(self.toDataURL(type, quality)));
                } else {
                  callback(self.msToBlob(type));
                }
              });
            };
          } else {
            CanvasPrototype.toBlob = function (callback, type, quality) {
              var self = this;
              setTimeout(function () {
                callback(dataURLtoBlob(self.toDataURL(type, quality)));
              });
            };
          }
        }
      }
      if (module.exports) {
        module.exports = dataURLtoBlob;
      } else {
        window.dataURLtoBlob = dataURLtoBlob;
      }
    })(window);
  })(canvasToBlob);
  var toBlob = canvasToBlob.exports;

  var isBlob = function isBlob(value) {
    if (typeof Blob === 'undefined') {
      return false;
    }
    return value instanceof Blob || Object.prototype.toString.call(value) === '[object Blob]';
  };

  var DEFAULTS = {
    /**
     * Indicates if output the original image instead of the compressed one
     * when the size of the compressed image is greater than the original one's
     * @type {boolean}
     */
    strict: true,
    /**
     * Indicates if read the image's Exif Orientation information,
     * and then rotate or flip the image automatically.
     * @type {boolean}
     */
    checkOrientation: true,
    /**
     * Indicates if retain the image's Exif information after compressed.
     * @type {boolean}
     */
    retainExif: false,
    /**
     * The max width of the output image.
     * @type {number}
     */
    maxWidth: Infinity,
    /**
     * The max height of the output image.
     * @type {number}
     */
    maxHeight: Infinity,
    /**
     * The min width of the output image.
     * @type {number}
     */
    minWidth: 0,
    /**
     * The min height of the output image.
     * @type {number}
     */
    minHeight: 0,
    /**
     * The width of the output image.
     * If not specified, the natural width of the source image will be used.
     * @type {number}
     */
    width: undefined,
    /**
     * The height of the output image.
     * If not specified, the natural height of the source image will be used.
     * @type {number}
     */
    height: undefined,
    /**
     * Sets how the size of the image should be resized to the container
     * specified by the `width` and `height` options.
     * @type {string}
     */
    resize: "none",
    /**
     * The quality of the output image.
     * It must be a number between `0` and `1`,
     * and only available for `image/jpeg` and `image/webp` images.
     * Check out {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob canvas.toBlob}.
     * @type {number}
     */
    quality: 0.8,
    /**
     * The mime type of the output image.
     * By default, the original mime type of the source image file will be used.
     * @type {string}
     */
    mimeType: "auto",
    /**
     * Files whose file type is included in this list,
     * and whose file size exceeds the `convertSize` value will be converted to JPEGs.
     * @type {string｜Array}
     */
    convertTypes: ["image/png"],
    /**
     * PNG files over this size (5 MB by default) will be converted to JPEGs.
     * To disable this, just set the value to `Infinity`.
     * @type {number}
     */
    convertSize: 5000000,
    /**
     * The hook function to execute before draw the image into the canvas for compression.
     * @type {Function}
     * @param {CanvasRenderingContext2D} context - The 2d rendering context of the canvas.
     * @param {HTMLCanvasElement} canvas - The canvas for compression.
     * @example
     * function (context, canvas) {
     *   context.fillStyle = '#fff';
     * }
     */
    beforeDraw: null,
    /**
     * The hook function to execute after drew the image into the canvas for compression.
     * @type {Function}
     * @param {CanvasRenderingContext2D} context - The 2d rendering context of the canvas.
     * @param {HTMLCanvasElement} canvas - The canvas for compression.
     * @example
     * function (context, canvas) {
     *   context.filter = 'grayscale(100%)';
     * }
     */
    drew: null,
    /**
     * The hook function to execute when success to compress the image.
     * @type {Function}
     * @param {File} file - The compressed image File object.
     * @example
     * function (file) {
     *   console.log(file);
     * }
     */
    success: null,
    /**
     * The hook function to execute when fail to compress the image.
     * @type {Function}
     * @param {Error} err - An Error object.
     * @example
     * function (err) {
     *   console.log(err.message);
     * }
     */
    error: null,
    /**
     * Indicates whether to use Web Worker for image compression.
     * When enabled, canvas operations will be performed in a separate thread,
     * preventing blocking of the main thread.
     * @type {boolean}
     * @default undefined (auto-detected based on browser support)
     */
    useWorker: undefined,
    // Will be auto-detected based on browser support

    /**
     * Path to the worker file. If not provided, inline worker code will be used.
     * @type {string}
     * @default undefined
     */
    workerPath: undefined
  };

  var IS_BROWSER = typeof window !== 'undefined' && typeof window.document !== 'undefined';
  var WINDOW = IS_BROWSER ? window : {};

  /**
   * Check if the given value is a positive number.
   * @param {*} value - The value to check.
   * @returns {boolean} Returns `true` if the given value is a positive number, else `false`.
   */
  var isPositiveNumber = function isPositiveNumber(value) {
    return value > 0 && value < Infinity;
  };
  var slice = Array.prototype.slice;

  /**
   * Convert array-like or iterable object to an array.
   * @param {*} value - The value to convert.
   * @returns {Array} Returns a new array.
   */
  function toArray(value) {
    return Array.from ? Array.from(value) : slice.call(value);
  }
  var REGEXP_IMAGE_TYPE = /^image\/.+$/;

  /**
   * Check if the given value is a mime type of image.
   * @param {*} value - The value to check.
   * @returns {boolean} Returns `true` if the given is a mime type of image, else `false`.
   */
  function isImageType(value) {
    return REGEXP_IMAGE_TYPE.test(value);
  }

  /**
   * Convert image type to extension.
   * @param {string} value - The image type to convert.
   * @returns {boolean} Returns the image extension.
   */
  function imageTypeToExtension(value) {
    var extension = isImageType(value) ? value.substr(6) : '';
    if (extension === 'jpeg') {
      extension = 'jpg';
    }
    return ".".concat(extension);
  }
  var fromCharCode = String.fromCharCode;

  /**
   * Get string from char code in data view.
   * @param {DataView} dataView - The data view for read.
   * @param {number} start - The start index.
   * @param {number} length - The read length.
   * @returns {string} The read result.
   */
  function getStringFromCharCode(dataView, start, length) {
    var str = '';
    var i;
    length += start;
    for (i = start; i < length; i += 1) {
      str += fromCharCode(dataView.getUint8(i));
    }
    return str;
  }
  var btoa = WINDOW.btoa;

  /**
   * Transform array buffer to Data URL.
   * @param {ArrayBuffer} arrayBuffer - The array buffer to transform.
   * @param {string} mimeType - The mime type of the Data URL.
   * @returns {string} The result Data URL.
   */
  function arrayBufferToDataURL(arrayBuffer, mimeType) {
    var chunks = [];
    var chunkSize = 8192;
    var uint8 = new Uint8Array(arrayBuffer);
    while (uint8.length > 0) {
      // XXX: Babel's `toConsumableArray` helper will throw error in IE or Safari 9
      // eslint-disable-next-line prefer-spread
      chunks.push(fromCharCode.apply(null, toArray(uint8.subarray(0, chunkSize))));
      uint8 = uint8.subarray(chunkSize);
    }
    return "data:".concat(mimeType, ";base64,").concat(btoa(chunks.join('')));
  }

  /**
   * Get orientation value from given array buffer.
   * @param {ArrayBuffer} arrayBuffer - The array buffer to read.
   * @returns {number} The read orientation value.
   */
  function resetAndGetOrientation(arrayBuffer) {
    var dataView = new DataView(arrayBuffer);
    var orientation;

    // Ignores range error when the image does not have correct Exif information
    try {
      var littleEndian;
      var app1Start;
      var ifdStart;

      // Only handle JPEG image (start by 0xFFD8)
      if (dataView.getUint8(0) === 0xFF && dataView.getUint8(1) === 0xD8) {
        var length = dataView.byteLength;
        var offset = 2;
        while (offset + 1 < length) {
          if (dataView.getUint8(offset) === 0xFF && dataView.getUint8(offset + 1) === 0xE1) {
            app1Start = offset;
            break;
          }
          offset += 1;
        }
      }
      if (app1Start) {
        var exifIDCode = app1Start + 4;
        var tiffOffset = app1Start + 10;
        if (getStringFromCharCode(dataView, exifIDCode, 4) === 'Exif') {
          var endianness = dataView.getUint16(tiffOffset);
          littleEndian = endianness === 0x4949;
          if (littleEndian || endianness === 0x4D4D /* bigEndian */) {
            if (dataView.getUint16(tiffOffset + 2, littleEndian) === 0x002A) {
              var firstIFDOffset = dataView.getUint32(tiffOffset + 4, littleEndian);
              if (firstIFDOffset >= 0x00000008) {
                ifdStart = tiffOffset + firstIFDOffset;
              }
            }
          }
        }
      }
      if (ifdStart) {
        var _length = dataView.getUint16(ifdStart, littleEndian);
        var _offset;
        var i;
        for (i = 0; i < _length; i += 1) {
          _offset = ifdStart + i * 12 + 2;
          if (dataView.getUint16(_offset, littleEndian) === 0x0112 /* Orientation */) {
            // 8 is the offset of the current tag's value
            _offset += 8;

            // Get the original orientation value
            orientation = dataView.getUint16(_offset, littleEndian);

            // Override the orientation with its default value
            dataView.setUint16(_offset, 1, littleEndian);
            break;
          }
        }
      }
    } catch (e) {
      orientation = 1;
    }
    return orientation;
  }

  /**
   * Parse Exif Orientation value.
   * @param {number} orientation - The orientation to parse.
   * @returns {Object} The parsed result.
   */
  function parseOrientation(orientation) {
    var rotate = 0;
    var scaleX = 1;
    var scaleY = 1;
    switch (orientation) {
      // Flip horizontal
      case 2:
        scaleX = -1;
        break;

      // Rotate left 180°
      case 3:
        rotate = -180;
        break;

      // Flip vertical
      case 4:
        scaleY = -1;
        break;

      // Flip vertical and rotate right 90°
      case 5:
        rotate = 90;
        scaleY = -1;
        break;

      // Rotate right 90°
      case 6:
        rotate = 90;
        break;

      // Flip horizontal and rotate right 90°
      case 7:
        rotate = 90;
        scaleX = -1;
        break;

      // Rotate left 90°
      case 8:
        rotate = -90;
        break;
    }
    return {
      rotate: rotate,
      scaleX: scaleX,
      scaleY: scaleY
    };
  }
  var REGEXP_DECIMALS = /\.\d*(?:0|9){12}\d*$/;

  /**
   * Normalize decimal number.
   * Check out {@link https://0.30000000000000004.com/}
   * @param {number} value - The value to normalize.
   * @param {number} [times=100000000000] - The times for normalizing.
   * @returns {number} Returns the normalized number.
   */
  function normalizeDecimalNumber(value) {
    var times = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 100000000000;
    return REGEXP_DECIMALS.test(value) ? Math.round(value * times) / times : value;
  }

  /**
   * Get the max sizes in a rectangle under the given aspect ratio.
   * @param {Object} data - The original sizes.
   * @param {string} [type='contain'] - The adjust type.
   * @returns {Object} The result sizes.
   */
  function getAdjustedSizes(_ref) {
    var aspectRatio = _ref.aspectRatio,
      height = _ref.height,
      width = _ref.width;
    var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'none';
    var isValidWidth = isPositiveNumber(width);
    var isValidHeight = isPositiveNumber(height);
    if (isValidWidth && isValidHeight) {
      var adjustedWidth = height * aspectRatio;
      if ((type === 'contain' || type === 'none') && adjustedWidth > width || type === 'cover' && adjustedWidth < width) {
        height = width / aspectRatio;
      } else {
        width = height * aspectRatio;
      }
    } else if (isValidWidth) {
      height = width / aspectRatio;
    } else if (isValidHeight) {
      width = height * aspectRatio;
    }
    return {
      width: width,
      height: height
    };
  }

  /**
   * Get Exif information from the given array buffer.
   * @param {ArrayBuffer} arrayBuffer - The array buffer to read.
   * @returns {Array} The read Exif information.
   */
  function getExif(arrayBuffer) {
    var array = toArray(new Uint8Array(arrayBuffer));
    var length = array.length;
    var segments = [];
    var start = 0;
    while (start + 3 < length) {
      var value = array[start];
      var next = array[start + 1];

      // SOS (Start of Scan)
      if (value === 0xFF && next === 0xDA) {
        break;
      }

      // SOI (Start of Image)
      if (value === 0xFF && next === 0xD8) {
        start += 2;
      } else {
        var offset = array[start + 2] * 256 + array[start + 3];
        var end = start + offset + 2;
        var segment = array.slice(start, end);
        segments.push(segment);
        start = end;
      }
    }
    return segments.reduce(function (exifArray, current) {
      if (current[0] === 0xFF && current[1] === 0xE1) {
        return exifArray.concat(current);
      }
      return exifArray;
    }, []);
  }

  /**
   * Insert Exif information into the given array buffer.
   * @param {ArrayBuffer} arrayBuffer - The array buffer to transform.
   * @param {Array} exifArray - The Exif information to insert.
   * @returns {ArrayBuffer} The transformed array buffer.
   */
  function insertExif(arrayBuffer, exifArray) {
    var array = toArray(new Uint8Array(arrayBuffer));
    if (array[2] !== 0xFF || array[3] !== 0xE0) {
      return arrayBuffer;
    }
    var app0Length = array[4] * 256 + array[5];
    var newArrayBuffer = [0xFF, 0xD8].concat(exifArray, array.slice(4 + app0Length));
    return new Uint8Array(newArrayBuffer);
  }

  var ArrayBuffer$1 = WINDOW.ArrayBuffer,
    FileReader = WINDOW.FileReader,
    Worker = WINDOW.Worker;
  var URL = WINDOW.URL || WINDOW.webkitURL;
  var REGEXP_EXTENSION = /\.\w+$/;
  var AnotherCompressor = WINDOW.Compressor;

  /**
   * Check if OffscreenCanvas is supported
   */
  function isOffscreenCanvasSupported() {
    return typeof OffscreenCanvas !== "undefined" && typeof Worker !== "undefined";
  }

  /**
   * Worker manager for image compression
   */
  var WorkerManager = /*#__PURE__*/function () {
    function WorkerManager() {
      _classCallCheck(this, WorkerManager);
      this.worker = null;
      this.workerURL = null;
      this.taskId = 0;
      this.pendingTasks = new Map();
    }

    /**
     * Initialize worker with blob URL
     */
    return _createClass(WorkerManager, [{
      key: "initWorker",
      value: function initWorker(workerCode) {
        var _this = this;
        if (this.worker) {
          return Promise.resolve();
        }
        return new Promise(function (resolve, reject) {
          try {
            var blob = new Blob([workerCode], {
              type: "application/javascript"
            });
            _this.workerURL = URL.createObjectURL(blob);
            _this.worker = new Worker(_this.workerURL);
            _this.worker.onmessage = function (e) {
              var _e$data = e.data,
                taskId = _e$data.taskId,
                success = _e$data.success,
                arrayBuffer = _e$data.arrayBuffer,
                mimeType = _e$data.mimeType,
                error = _e$data.error;
              var task = _this.pendingTasks.get(taskId);
              if (task) {
                _this.pendingTasks.delete(taskId);
                if (success) {
                  var _blob = new Blob([arrayBuffer], {
                    type: mimeType
                  });
                  task.resolve(_blob);
                } else {
                  task.reject(new Error(error || "Worker compression failed"));
                }
              }
            };
            _this.worker.onerror = function (error) {
              reject(error);
            };
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      }

      /**
       * Compress image using worker
       */
    }, {
      key: "compress",
      value: function compress(data) {
        var _this2 = this;
        return new Promise(function (resolve, reject) {
          if (!_this2.worker) {
            reject(new Error("Worker not initialized"));
            return;
          }
          var taskId = ++_this2.taskId;
          _this2.pendingTasks.set(taskId, {
            resolve: resolve,
            reject: reject
          });
          _this2.worker.postMessage(_objectSpread2(_objectSpread2({}, data), {}, {
            taskId: taskId
          }));
        });
      }

      /**
       * Terminate worker
       */
    }, {
      key: "terminate",
      value: function terminate() {
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
    }]);
  }(); // Shared worker manager instance
  var workerManager = null;

  /**
   * Creates a new image compressor.
   * @class
   */
  var Compressor = /*#__PURE__*/function () {
    /**
     * The constructor of Compressor.
     * @param {File|Blob} file - The target image file for compressing.
     * @param {Object} [options] - The options for compressing.
     */
    function Compressor(file, options) {
      _classCallCheck(this, Compressor);
      this.file = file;
      this.exif = [];
      this.image = new Image();
      this.options = _objectSpread2(_objectSpread2({}, DEFAULTS), options);
      this.aborted = false;
      this.result = null;
      this.useWorker = false;
      this.workerInitialized = false;
      this.init();
    }
    return _createClass(Compressor, [{
      key: "init",
      value: function init() {
        var _this3 = this;
        var file = this.file,
          options = this.options;
        if (!isBlob(file)) {
          this.fail(new Error("The first argument must be a File or Blob object."));
          return;
        }
        var mimeType = file.type;
        if (!isImageType(mimeType)) {
          this.fail(new Error("The first argument must be an image File or Blob object."));
          return;
        }
        if (!URL || !FileReader) {
          this.fail(new Error("The current browser does not support image compression."));
          return;
        }
        if (!ArrayBuffer$1) {
          options.checkOrientation = false;
          options.retainExif = false;
        }
        var isJPEGImage = mimeType === "image/jpeg";
        var checkOrientation = isJPEGImage && options.checkOrientation;
        var retainExif = isJPEGImage && options.retainExif;
        if (URL && !checkOrientation && !retainExif) {
          this.load({
            url: URL.createObjectURL(file)
          });
        } else {
          var reader = new FileReader();
          this.reader = reader;
          reader.onload = function (_ref) {
            var target = _ref.target;
            var result = target.result;
            var data = {};
            var orientation = 1;
            if (checkOrientation) {
              // Reset the orientation value to its default value 1
              // as some iOS browsers will render image with its orientation
              orientation = resetAndGetOrientation(result);
              if (orientation > 1) {
                _extends(data, parseOrientation(orientation));
              }
            }
            if (retainExif) {
              _this3.exif = getExif(result);
            }
            if (checkOrientation || retainExif) {
              if (!URL ||
              // Generate a new URL with the default orientation value 1.
              orientation > 1) {
                data.url = arrayBufferToDataURL(result, mimeType);
              } else {
                data.url = URL.createObjectURL(file);
              }
            } else {
              data.url = result;
            }
            _this3.load(data);
          };
          reader.onabort = function () {
            _this3.fail(new Error("Aborted to read the image with FileReader."));
          };
          reader.onerror = function () {
            _this3.fail(new Error("Failed to read the image with FileReader."));
          };
          reader.onloadend = function () {
            _this3.reader = null;
          };
          if (checkOrientation || retainExif) {
            reader.readAsArrayBuffer(file);
          } else {
            reader.readAsDataURL(file);
          }
        }
      }
    }, {
      key: "load",
      value: function load(data) {
        var _this4 = this;
        this.file;
          this.image;
          var options = this.options;

        // Check if we should use Worker
        var shouldUseWorker = options.useWorker !== false && (options.useWorker === true || options.useWorker === undefined && isOffscreenCanvasSupported());
        if (shouldUseWorker && !this.workerInitialized) {
          this.initializeWorker().then(function () {
            _this4.useWorker = true;
            _this4.workerInitialized = true;
            _this4.proceedWithLoad(data);
          }).catch(function () {
            // Fallback to main thread if worker initialization fails
            _this4.useWorker = false;
            _this4.workerInitialized = true;
            _this4.proceedWithLoad(data);
          });
        } else {
          this.proceedWithLoad(data);
        }
      }
    }, {
      key: "proceedWithLoad",
      value: function proceedWithLoad(data) {
        var _this5 = this;
        var file = this.file,
          image = this.image;
        image.onload = function () {
          _this5.draw(_objectSpread2(_objectSpread2({}, data), {}, {
            naturalWidth: image.naturalWidth,
            naturalHeight: image.naturalHeight
          }));
        };
        image.onabort = function () {
          _this5.fail(new Error("Aborted to load the image."));
        };
        image.onerror = function () {
          _this5.fail(new Error("Failed to load the image."));
        };

        // Match all browsers that use WebKit as the layout engine in iOS devices,
        // such as Safari for iOS, Chrome for iOS, and in-app browsers.
        if (WINDOW.navigator && /(?:iPad|iPhone|iPod).*?AppleWebKit/i.test(WINDOW.navigator.userAgent)) {
          // Fix the `The operation is insecure` error (#57)
          image.crossOrigin = "anonymous";
        }
        image.alt = file.name;
        image.src = data.url;
      }
    }, {
      key: "initializeWorker",
      value: function () {
        var _initializeWorker = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
          var workerPath, workerCode, response;
          return _regeneratorRuntime().wrap(function _callee$(_context) {
            while (1) switch (_context.prev = _context.next) {
              case 0:
                if (!workerManager) {
                  workerManager = new WorkerManager();
                }

                // Try to load worker code
                // First, try to fetch from a configured path
                workerPath = this.options.workerPath;
                workerCode = null;
                if (!workerPath) {
                  _context.next = 16;
                  break;
                }
                _context.prev = 4;
                _context.next = 7;
                return fetch(workerPath);
              case 7:
                response = _context.sent;
                _context.next = 10;
                return response.text();
              case 10:
                workerCode = _context.sent;
                _context.next = 16;
                break;
              case 13:
                _context.prev = 13;
                _context.t0 = _context["catch"](4);
                // If fetch fails, try to use inline worker code
                console.warn("Failed to load worker from path, using inline code");
              case 16:
                // If no worker code loaded, use inline code
                if (!workerCode) {
                  workerCode = this.getInlineWorkerCode();
                }
                _context.next = 19;
                return workerManager.initWorker(workerCode);
              case 19:
              case "end":
                return _context.stop();
            }
          }, _callee, this, [[4, 13]]);
        }));
        function initializeWorker() {
          return _initializeWorker.apply(this, arguments);
        }
        return initializeWorker;
      }()
    }, {
      key: "getInlineWorkerCode",
      value: function getInlineWorkerCode() {
        // Return the worker code as a string
        // This will be replaced with actual worker code during build or runtime
        return "self.onmessage=async function(e){const{imageDataURL,naturalWidth,naturalHeight,rotate=0,scaleX=1,scaleY=1,options,taskId}=e.data;try{function isPositiveNumber(v){return v>0&&v<Infinity}function normalizeDecimalNumber(v,t=1e11){return/.\\d*(?:0|9){12}\\d*$/.test(v)?Math.round(v*t)/t:v}function getAdjustedSizes({aspectRatio,height,width},type='none'){const iw=isPositiveNumber(width),ih=isPositiveNumber(height);if(iw&&ih){const aw=height*aspectRatio;if((type==='contain'||type==='none')&&aw>width||type==='cover'&&aw<width)height=width/aspectRatio;else width=height*aspectRatio}else if(iw)height=width/aspectRatio;else if(ih)width=height*aspectRatio;return{width,height}}function isImageType(v){return/^image\\/.+$/.test(v)}const is90=Math.abs(rotate)%180===90,resizable=(options.resize==='contain'||options.resize==='cover')&&isPositiveNumber(options.width)&&isPositiveNumber(options.height);let mw=Math.max(options.maxWidth,0)||Infinity,mh=Math.max(options.maxHeight,0)||Infinity,minw=Math.max(options.minWidth,0)||0,minh=Math.max(options.minHeight,0)||0,ar=naturalWidth/naturalHeight,w=options.width,h=options.height;if(is90){[mw,mh]=[mh,mw];[minw,minh]=[minh,minw];[w,h]=[h,w]}if(resizable)ar=w/h;({width:mw,height:mh}=getAdjustedSizes({aspectRatio:ar,width:mw,height:mh},'contain'));({width:minw,height:minh}=getAdjustedSizes({aspectRatio:ar,width:minw,height:minh},'cover'));if(resizable)({width:w,height:h}=getAdjustedSizes({aspectRatio:ar,width:w,height:h},options.resize));else({width:w=naturalWidth,height:h=naturalHeight}=getAdjustedSizes({aspectRatio:ar,width:w,height:h}));w=Math.floor(normalizeDecimalNumber(Math.min(Math.max(w,minw),mw)));h=Math.floor(normalizeDecimalNumber(Math.min(Math.max(h,minh),mh)));let mt=options.mimeType;if(!isImageType(mt))mt=options.originalMimeType||'image/jpeg';if(options.fileSize>options.convertSize&&options.convertTypes.indexOf(mt)>=0)mt='image/jpeg';const isJpeg=mt==='image/jpeg';if(is90)[w,h]=[h,w];const canvas=new OffscreenCanvas(w,h),ctx=canvas.getContext('2d');ctx.fillStyle=isJpeg?'#fff':'transparent';ctx.fillRect(0,0,w,h);const img=new Image();await new Promise((r,j)=>{img.onload=r;img.onerror=j;img.src=imageDataURL});const dx=-w/2,dy=-h/2,dw=w,dh=h,params=[];if(resizable){let sx=0,sy=0,sw=naturalWidth,sh=naturalHeight;({width:sw,height:sh}=getAdjustedSizes({aspectRatio:ar,width:naturalWidth,height:naturalHeight},{contain:'cover',cover:'contain'}[options.resize]));sx=(naturalWidth-sw)/2;sy=(naturalHeight-sh)/2;params.push(sx,sy,sw,sh)}params.push(dx,dy,dw,dh);ctx.save();ctx.translate(w/2,h/2);ctx.rotate(rotate*Math.PI/180);ctx.scale(scaleX,scaleY);ctx.drawImage(img,...params);ctx.restore();const blob=await canvas.convertToBlob({type:mt,quality:options.quality}),ab=await blob.arrayBuffer();self.postMessage({taskId,success:true,arrayBuffer:ab,mimeType:mt},[ab])}catch(e){self.postMessage({taskId,success:false,error:e.message||'Unknown error'})}};";
      }
    }, {
      key: "draw",
      value: function () {
        var _draw = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(_ref2) {
          var naturalWidth, naturalHeight, _ref2$rotate, rotate, _ref2$scaleX, scaleX, _ref2$scaleY, scaleY;
          return _regeneratorRuntime().wrap(function _callee2$(_context2) {
            while (1) switch (_context2.prev = _context2.next) {
              case 0:
                naturalWidth = _ref2.naturalWidth, naturalHeight = _ref2.naturalHeight, _ref2$rotate = _ref2.rotate, rotate = _ref2$rotate === void 0 ? 0 : _ref2$rotate, _ref2$scaleX = _ref2.scaleX, scaleX = _ref2$scaleX === void 0 ? 1 : _ref2$scaleX, _ref2$scaleY = _ref2.scaleY, scaleY = _ref2$scaleY === void 0 ? 1 : _ref2$scaleY;
                this.file, this.image, this.options; // Use Worker if enabled and available
                if (!(this.useWorker && workerManager && workerManager.worker)) {
                  _context2.next = 4;
                  break;
                }
                return _context2.abrupt("return", this.drawWithWorker({
                  naturalWidth: naturalWidth,
                  naturalHeight: naturalHeight,
                  rotate: rotate,
                  scaleX: scaleX,
                  scaleY: scaleY
                }));
              case 4:
                return _context2.abrupt("return", this.drawOnMainThread({
                  naturalWidth: naturalWidth,
                  naturalHeight: naturalHeight,
                  rotate: rotate,
                  scaleX: scaleX,
                  scaleY: scaleY
                }));
              case 5:
              case "end":
                return _context2.stop();
            }
          }, _callee2, this);
        }));
        function draw(_x) {
          return _draw.apply(this, arguments);
        }
        return draw;
      }()
    }, {
      key: "drawWithWorker",
      value: function () {
        var _drawWithWorker = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(_ref3) {
          var naturalWidth, naturalHeight, _ref3$rotate, rotate, _ref3$scaleX, scaleX, _ref3$scaleY, scaleY, file, image, options, imageDataURL, response, blob, _blob2, resultMimeType, isJPEGImage;
          return _regeneratorRuntime().wrap(function _callee3$(_context3) {
            while (1) switch (_context3.prev = _context3.next) {
              case 0:
                naturalWidth = _ref3.naturalWidth, naturalHeight = _ref3.naturalHeight, _ref3$rotate = _ref3.rotate, rotate = _ref3$rotate === void 0 ? 0 : _ref3$rotate, _ref3$scaleX = _ref3.scaleX, scaleX = _ref3$scaleX === void 0 ? 1 : _ref3$scaleX, _ref3$scaleY = _ref3.scaleY, scaleY = _ref3$scaleY === void 0 ? 1 : _ref3$scaleY;
                file = this.file, image = this.image, options = this.options; // Convert image to data URL for worker
                if (!image.src.startsWith("data:")) {
                  _context3.next = 6;
                  break;
                }
                imageDataURL = image.src;
                _context3.next = 19;
                break;
              case 6:
                if (!image.src.startsWith("blob:")) {
                  _context3.next = 18;
                  break;
                }
                _context3.next = 9;
                return fetch(image.src);
              case 9:
                response = _context3.sent;
                _context3.next = 12;
                return response.blob();
              case 12:
                blob = _context3.sent;
                _context3.next = 15;
                return new Promise(function (resolve, reject) {
                  var reader = new FileReader();
                  reader.onload = function () {
                    return resolve(reader.result);
                  };
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                });
              case 15:
                imageDataURL = _context3.sent;
                _context3.next = 19;
                break;
              case 18:
                imageDataURL = image.src;
              case 19:
                _context3.prev = 19;
                _context3.next = 22;
                return workerManager.compress({
                  imageDataURL: imageDataURL,
                  naturalWidth: naturalWidth,
                  naturalHeight: naturalHeight,
                  rotate: rotate,
                  scaleX: scaleX,
                  scaleY: scaleY,
                  options: _objectSpread2(_objectSpread2({}, options), {}, {
                    originalMimeType: file.type,
                    fileSize: file.size
                  })
                });
              case 22:
                _blob2 = _context3.sent;
                // Determine if result is JPEG
                resultMimeType = options.mimeType;
                if (!isImageType(resultMimeType)) {
                  resultMimeType = file.type;
                }
                if (file.size > options.convertSize && options.convertTypes.indexOf(resultMimeType) >= 0) {
                  resultMimeType = "image/jpeg";
                }
                isJPEGImage = resultMimeType === "image/jpeg";
                this.handleCompressionResult(_blob2, {
                  naturalWidth: naturalWidth,
                  naturalHeight: naturalHeight,
                  isJPEGImage: isJPEGImage
                });
                _context3.next = 34;
                break;
              case 30:
                _context3.prev = 30;
                _context3.t0 = _context3["catch"](19);
                // Fallback to main thread on error
                this.useWorker = false;
                return _context3.abrupt("return", this.drawOnMainThread({
                  naturalWidth: naturalWidth,
                  naturalHeight: naturalHeight,
                  rotate: rotate,
                  scaleX: scaleX,
                  scaleY: scaleY
                }));
              case 34:
              case "end":
                return _context3.stop();
            }
          }, _callee3, this, [[19, 30]]);
        }));
        function drawWithWorker(_x2) {
          return _drawWithWorker.apply(this, arguments);
        }
        return drawWithWorker;
      }()
    }, {
      key: "drawOnMainThread",
      value: function drawOnMainThread(_ref4) {
        var _this6 = this;
        var naturalWidth = _ref4.naturalWidth,
          naturalHeight = _ref4.naturalHeight,
          _ref4$rotate = _ref4.rotate,
          rotate = _ref4$rotate === void 0 ? 0 : _ref4$rotate,
          _ref4$scaleX = _ref4.scaleX,
          scaleX = _ref4$scaleX === void 0 ? 1 : _ref4$scaleX,
          _ref4$scaleY = _ref4.scaleY,
          scaleY = _ref4$scaleY === void 0 ? 1 : _ref4$scaleY;
        var file = this.file,
          image = this.image,
          options = this.options;
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");
        var is90DegreesRotated = Math.abs(rotate) % 180 === 90;
        var resizable = (options.resize === "contain" || options.resize === "cover") && isPositiveNumber(options.width) && isPositiveNumber(options.height);
        var maxWidth = Math.max(options.maxWidth, 0) || Infinity;
        var maxHeight = Math.max(options.maxHeight, 0) || Infinity;
        var minWidth = Math.max(options.minWidth, 0) || 0;
        var minHeight = Math.max(options.minHeight, 0) || 0;
        var aspectRatio = naturalWidth / naturalHeight;
        var width = options.width,
          height = options.height;
        if (is90DegreesRotated) {
          var _ref5 = [maxHeight, maxWidth];
          maxWidth = _ref5[0];
          maxHeight = _ref5[1];
          var _ref6 = [minHeight, minWidth];
          minWidth = _ref6[0];
          minHeight = _ref6[1];
          var _ref7 = [height, width];
          width = _ref7[0];
          height = _ref7[1];
        }
        if (resizable) {
          aspectRatio = width / height;
        }
        var _getAdjustedSizes = getAdjustedSizes({
          aspectRatio: aspectRatio,
          width: maxWidth,
          height: maxHeight
        }, "contain");
        maxWidth = _getAdjustedSizes.width;
        maxHeight = _getAdjustedSizes.height;
        var _getAdjustedSizes2 = getAdjustedSizes({
          aspectRatio: aspectRatio,
          width: minWidth,
          height: minHeight
        }, "cover");
        minWidth = _getAdjustedSizes2.width;
        minHeight = _getAdjustedSizes2.height;
        if (resizable) {
          var _getAdjustedSizes3 = getAdjustedSizes({
            aspectRatio: aspectRatio,
            width: width,
            height: height
          }, options.resize);
          width = _getAdjustedSizes3.width;
          height = _getAdjustedSizes3.height;
        } else {
          var _getAdjustedSizes4 = getAdjustedSizes({
            aspectRatio: aspectRatio,
            width: width,
            height: height
          });
          var _getAdjustedSizes4$wi = _getAdjustedSizes4.width;
          width = _getAdjustedSizes4$wi === void 0 ? naturalWidth : _getAdjustedSizes4$wi;
          var _getAdjustedSizes4$he = _getAdjustedSizes4.height;
          height = _getAdjustedSizes4$he === void 0 ? naturalHeight : _getAdjustedSizes4$he;
        }
        width = Math.floor(normalizeDecimalNumber(Math.min(Math.max(width, minWidth), maxWidth)));
        height = Math.floor(normalizeDecimalNumber(Math.min(Math.max(height, minHeight), maxHeight)));
        var destX = -width / 2;
        var destY = -height / 2;
        var destWidth = width;
        var destHeight = height;
        var params = [];
        if (resizable) {
          var srcX = 0;
          var srcY = 0;
          var srcWidth = naturalWidth;
          var srcHeight = naturalHeight;
          var _getAdjustedSizes5 = getAdjustedSizes({
            aspectRatio: aspectRatio,
            width: naturalWidth,
            height: naturalHeight
          }, {
            contain: "cover",
            cover: "contain"
          }[options.resize]);
          srcWidth = _getAdjustedSizes5.width;
          srcHeight = _getAdjustedSizes5.height;
          srcX = (naturalWidth - srcWidth) / 2;
          srcY = (naturalHeight - srcHeight) / 2;
          params.push(srcX, srcY, srcWidth, srcHeight);
        }
        params.push(destX, destY, destWidth, destHeight);
        if (is90DegreesRotated) {
          var _ref8 = [height, width];
          width = _ref8[0];
          height = _ref8[1];
        }
        canvas.width = width;
        canvas.height = height;
        if (!isImageType(options.mimeType)) {
          options.mimeType = file.type;
        }
        var fillStyle = "transparent";

        // Converts PNG files over the `convertSize` to JPEGs.
        if (file.size > options.convertSize && options.convertTypes.indexOf(options.mimeType) >= 0) {
          options.mimeType = "image/jpeg";
        }
        var isJPEGImage = options.mimeType === "image/jpeg";
        if (isJPEGImage) {
          fillStyle = "#fff";
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
        context.rotate(rotate * Math.PI / 180);
        context.scale(scaleX, scaleY);
        context.drawImage.apply(context, [image].concat(params));
        context.restore();
        if (options.drew) {
          options.drew.call(this, context, canvas);
        }
        if (this.aborted) {
          return;
        }
        var callback = function callback(blob) {
          _this6.handleCompressionResult(blob, {
            naturalWidth: naturalWidth,
            naturalHeight: naturalHeight,
            isJPEGImage: isJPEGImage
          });
        };
        if (canvas.toBlob) {
          canvas.toBlob(callback, options.mimeType, options.quality);
        } else {
          callback(toBlob(canvas.toDataURL(options.mimeType, options.quality)));
        }
      }
    }, {
      key: "handleCompressionResult",
      value: function handleCompressionResult(blob, _ref9) {
        var _this7 = this;
        var naturalWidth = _ref9.naturalWidth,
          naturalHeight = _ref9.naturalHeight,
          isJPEGImage = _ref9.isJPEGImage;
        var options = this.options;
        if (this.aborted) {
          return;
        }
        var done = function done(result) {
          return _this7.done({
            naturalWidth: naturalWidth,
            naturalHeight: naturalHeight,
            result: result
          });
        };
        if (blob && isJPEGImage && options.retainExif && this.exif && this.exif.length > 0) {
          var next = function next(arrayBuffer) {
            return done(toBlob(arrayBufferToDataURL(insertExif(arrayBuffer, _this7.exif), options.mimeType)));
          };
          if (blob.arrayBuffer) {
            blob.arrayBuffer().then(next).catch(function () {
              _this7.fail(new Error("Failed to read the compressed image with Blob.arrayBuffer()."));
            });
          } else {
            var reader = new FileReader();
            this.reader = reader;
            reader.onload = function (_ref10) {
              var target = _ref10.target;
              next(target.result);
            };
            reader.onabort = function () {
              _this7.fail(new Error("Aborted to read the compressed image with FileReader."));
            };
            reader.onerror = function () {
              _this7.fail(new Error("Failed to read the compressed image with FileReader."));
            };
            reader.onloadend = function () {
              _this7.reader = null;
            };
            reader.readAsArrayBuffer(blob);
          }
        } else {
          done(blob);
        }
      }
    }, {
      key: "done",
      value: function done(_ref11) {
        var naturalWidth = _ref11.naturalWidth,
          naturalHeight = _ref11.naturalHeight,
          result = _ref11.result;
        var file = this.file,
          image = this.image,
          options = this.options;
        if (URL && image.src.indexOf("blob:") === 0) {
          URL.revokeObjectURL(image.src);
        }
        if (result) {
          // Returns original file if the result is greater than it and without size related options
          if (options.strict && !options.retainExif && result.size > file.size && options.mimeType === file.type && !(options.width > naturalWidth || options.height > naturalHeight || options.minWidth > naturalWidth || options.minHeight > naturalHeight || options.maxWidth < naturalWidth || options.maxHeight < naturalHeight)) {
            result = file;
          } else {
            var date = new Date();
            result.lastModified = date.getTime();
            result.lastModifiedDate = date;
            result.name = file.name;

            // Convert the extension to match its type
            if (result.name && result.type !== file.type) {
              result.name = result.name.replace(REGEXP_EXTENSION, imageTypeToExtension(result.type));
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
    }, {
      key: "fail",
      value: function fail(err) {
        var options = this.options;
        if (options.error) {
          options.error.call(this, err);
        } else {
          throw err;
        }
      }
    }, {
      key: "abort",
      value: function abort() {
        if (!this.aborted) {
          this.aborted = true;
          if (this.reader) {
            this.reader.abort();
          } else if (!this.image.complete) {
            this.image.onload = null;
            this.image.onabort();
          } else {
            this.fail(new Error("The compression process has been aborted."));
          }

          // Cancel pending worker tasks
          if (this.useWorker && workerManager) ;
        }
      }

      /**
       * Get the no conflict compressor class.
       * @returns {Compressor} The compressor class.
       */
    }], [{
      key: "noConflict",
      value: function noConflict() {
        window.Compressor = AnotherCompressor;
        return Compressor;
      }

      /**
       * Change the default options.
       * @param {Object} options - The new default options.
       */
    }, {
      key: "setDefaults",
      value: function setDefaults(options) {
        _extends(DEFAULTS, options);
      }
    }]);
  }();

  return Compressor;

}));
