const { babel } = require('@rollup/plugin-babel');
const changeCase = require('change-case');
const commonjs = require('@rollup/plugin-commonjs');
const createBanner = require('create-banner');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const replace = require('@rollup/plugin-replace');
const terser = require('@rollup/plugin-terser');
const pkg = require('./package.json');

// 处理 scope 包名（如 @liuyongdi/compressorjs -> compressor）
// 同时移除 'js' 后缀
let baseName = pkg.name;
if (baseName.includes('/')) {
  // 如果是 scope 包，提取包名部分
  baseName = baseName.split('/')[1];
}
pkg.name = baseName.replace('js', '');

const name = changeCase.pascalCase(pkg.name);
// 精简 banner，减少体积
const banner = `/*! ${name}.js v${pkg.version} | MIT License */`;

module.exports = {
  input: 'src/index.js',
  // 启用 tree-shaking 优化
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
    preset: 'smallest',
  },
  output: [
    {
      banner,
      name,
      file: `dist/${pkg.name}.js`,
      format: 'umd',
    },
    {
      banner,
      file: `dist/${pkg.name}.common.js`,
      format: 'cjs',
      exports: 'auto',
    },
    {
      banner,
      file: `dist/${pkg.name}.esm.js`,
      format: 'esm',
    },
    {
      banner,
      name,
      file: `docs/js/${pkg.name}.js`,
      format: 'umd',
    },
  ],
  plugins: [
    nodeResolve(),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
    }),
    replace({
      delimiters: ['', ''],
      exclude: ['node_modules/**'],
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
      '(function (module) {': `(function (module) {
  if (typeof window === 'undefined') {
    return;
  }`,
    }),
    // 生产环境启用 Terser 压缩
    process.env.NODE_ENV === 'production' && terser({
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2,
        unsafe: true,
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_methods: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unsafe_undefined: true,
      },
      format: {
        comments: /^!/, // 仅保留以 ! 开头的注释
      },
      mangle: {
        properties: false, // 保留属性名，避免破坏 API
      },
    }),
  ].filter(Boolean),
};
