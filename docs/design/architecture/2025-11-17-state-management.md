# 状态管理规范

## 项目说明

compressorjs-worker-version 是一个**纯 JavaScript 库项目**，不涉及前端框架的状态管理（如 Redux、Vuex、MobX 等）。

## 内部状态管理

### 1. 实例状态

**Compressor 类内部状态**:
- 使用实例属性管理状态
- 状态变更通过方法控制
- 不依赖外部状态管理库

**状态属性**:
```javascript
class Compressor {
  constructor(file, options) {
    this.file = file;              // 输入文件
    this.options = { ...options };  // 配置选项
    this.aborted = false;          // 是否已中止
    this.result = null;             // 压缩结果
    this.useWorker = false;         // 是否使用 Worker
    this.workerInitialized = false; // Worker 是否已初始化
    this.exif = [];                // EXIF 数据
    this.image = new Image();       // Image 对象
    this.reader = null;             // FileReader 对象
  }
}
```

### 2. WorkerManager 状态

**任务队列管理**:
```javascript
class WorkerManager {
  constructor() {
    this.worker = null;           // Worker 实例
    this.workerURL = null;        // Worker Blob URL
    this.taskId = 0;              // 任务 ID 计数器
    this.pendingTasks = new Map(); // 待处理任务队列
  }
}
```

### 3. 状态转换

**状态转换规则**:
1. **初始化** → **加载中** → **处理中** → **完成/失败**
2. Worker 初始化失败时：**Worker 模式** → **主线程模式**
3. 用户中止时：任何状态 → **已中止**

**状态管理原则**:
- 状态变更必须通过明确的方法调用
- 状态变更后必须执行相应的清理操作
- 避免状态不一致的情况

## 为什么不需要外部状态管理

### 1. 库项目特性

- **无 UI 组件**: 这是一个工具库，不包含 UI 组件
- **无全局状态**: 每个 Compressor 实例独立管理自己的状态
- **无状态共享**: 不同实例之间不需要共享状态

### 2. 状态管理方式

**实例级状态**:
- 每个 `Compressor` 实例管理自己的状态
- 状态封装在类内部
- 通过方法暴露必要的状态

**模块级状态**:
- `WorkerManager` 使用模块级变量管理
- 通过引用计数管理生命周期
- 单例模式确保资源复用

### 3. 回调模式

**事件驱动**:
- 使用回调函数处理异步结果
- `success` 回调：处理成功结果
- `error` 回调：处理错误情况
- `beforeDraw`/`drew` 钩子：处理绘制过程

**示例**:
```javascript
new Compressor(file, {
  success(result) {
    // 成功时更新 UI 状态（由调用方管理）
    setCompressedImage(result);
  },
  error(err) {
    // 错误时更新 UI 状态（由调用方管理）
    setError(err.message);
  },
});
```

## 在框架中使用时的状态管理

### 1. React 中使用

**推荐方式**:
```javascript
function ImageCompressor() {
  const [compressed, setCompressed] = useState(null);
  const [error, setError] = useState(null);
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    new Compressor(file, {
      success(result) {
        setCompressed(result);
      },
      error(err) {
        setError(err.message);
      },
    });
  };
  
  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      {compressed && <img src={URL.createObjectURL(compressed)} />}
      {error && <div>Error: {error}</div>}
    </div>
  );
}
```

### 2. Vue 中使用

**推荐方式**:
```javascript
export default {
  data() {
    return {
      compressed: null,
      error: null,
    };
  },
  methods: {
    handleFileChange(e) {
      const file = e.target.files[0];
      new Compressor(file, {
        success: (result) => {
          this.compressed = result;
        },
        error: (err) => {
          this.error = err.message;
        },
      });
    },
  },
};
```

### 3. 原生 JavaScript 中使用

**推荐方式**:
```javascript
let compressedImage = null;
let errorMessage = null;

function handleFileChange(e) {
  const file = e.target.files[0];
  new Compressor(file, {
    success(result) {
      compressedImage = result;
      updateUI();
    },
    error(err) {
      errorMessage = err.message;
      updateUI();
    },
  });
}

function updateUI() {
  if (compressedImage) {
    document.getElementById('preview').src = URL.createObjectURL(compressedImage);
  }
  if (errorMessage) {
    document.getElementById('error').textContent = errorMessage;
  }
}
```

## 总结

1. **库内部**: 使用实例属性和模块级变量管理状态
2. **框架集成**: 由调用方（React/Vue/原生 JS）管理 UI 状态
3. **通信方式**: 通过回调函数传递结果
4. **无全局状态**: 不需要 Redux/Vuex 等状态管理库
