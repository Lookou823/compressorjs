const { babel } = require('@rollup/plugin-babel');
const changeCase = require('change-case');
const commonjs = require('@rollup/plugin-commonjs');
const createBanner = require('create-banner');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const replace = require('@rollup/plugin-replace');
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
const banner = createBanner({
  data: {
    name: `${name}.js`,
    year: '2018-present',
  },
});

module.exports = {
  input: 'src/index.js',
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
  ],
};
