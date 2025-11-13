module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false,
        // 优化目标浏览器，减少不必要的转译
        targets: {
          browsers: ['> 1%', 'last 2 versions', 'not dead'],
        },
      },
    ],
  ],
  plugins: [
    '@babel/plugin-transform-object-assign',
  ],
  env: {
    test: {
      plugins: [
        'istanbul',
      ],
    },
  },
};
