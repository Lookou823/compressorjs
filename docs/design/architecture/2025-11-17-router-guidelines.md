# 路由规范

## 项目说明

compressorjs-worker-version 是一个**纯 JavaScript 库项目**，不涉及前端路由（如 React Router、Vue Router 等）。

## 为什么不需要路由

### 1. 库项目特性

- **无页面概念**: 这是一个工具库，不包含页面或路由
- **无导航需求**: 库本身不涉及页面跳转
- **单一功能**: 专注于图片压缩功能

### 2. 使用场景

**作为库被调用**:
- 在其他项目中使用
- 不控制页面路由
- 由调用方管理路由

## 在框架项目中使用时的路由处理

### 1. React + React Router

**在路由组件中使用**:
```javascript
import { useParams } from 'react-router-dom';
import Compressor from '@liuyongdi/compressorjs';

function ImageUploadPage() {
  const { id } = useParams();
  
  const handleCompress = (file) => {
    new Compressor(file, {
      success(result) {
        // 压缩成功后可以导航到其他页面
        navigate(`/preview/${id}`);
      },
    });
  };
  
  return <input type="file" onChange={(e) => handleCompress(e.target.files[0])} />;
}
```

### 2. Vue + Vue Router

**在路由组件中使用**:
```javascript
export default {
  methods: {
    handleCompress(file) {
      new Compressor(file, {
        success: (result) => {
          // 压缩成功后可以导航到其他页面
          this.$router.push(`/preview/${this.$route.params.id}`);
        },
      });
    },
  },
};
```

### 3. 原生 JavaScript + History API

**使用 History API**:
```javascript
function handleCompress(file) {
  new Compressor(file, {
    success(result) {
      // 压缩成功后可以导航到其他页面
      window.history.pushState({}, '', '/preview');
      updatePage();
    },
  });
}
```

## 总结

1. **库本身**: 不涉及路由，无需路由配置
2. **框架集成**: 由调用方（React Router/Vue Router）管理路由
3. **导航控制**: 在回调函数中处理路由跳转（如需要）
