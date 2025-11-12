const fs = require('fs');
const path = require('path');
const rollupConfig = require('../rollup.config');

// Try to use puppeteer's Chromium, fallback to system Chrome
let chromeBin = null;

try {
  const puppeteer = require('puppeteer');
  const executablePath = puppeteer.executablePath();
  // Check if the executable path exists
  if (executablePath && fs.existsSync(executablePath)) {
    chromeBin = executablePath;
  }
} catch (error) {
  // Puppeteer failed, will use system Chrome
}

// If puppeteer's Chromium not available, use system Chrome
if (!chromeBin) {
  if (process.platform === 'darwin') {
    const systemChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    if (fs.existsSync(systemChrome)) {
      chromeBin = systemChrome;
    }
  } else if (process.platform === 'linux') {
    // Try common Chrome/Chromium paths
    const possiblePaths = [
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium',
    ];
    for (const chromePath of possiblePaths) {
      if (fs.existsSync(chromePath)) {
        chromeBin = chromePath;
        break;
      }
    }
  }
  // Windows: karma-chrome-launcher will find Chrome automatically
}

if (chromeBin) {
  process.env.CHROME_BIN = chromeBin;
}

module.exports = (config) => {
  config.set({
    autoWatch: false,
    basePath: '..',
    browsers: ['ChromeHeadless'],
    client: {
      mocha: {
        timeout: 10000,
      },
    },
    coverageIstanbulReporter: {
      reports: ['html', 'lcovonly', 'text-summary'],
    },
    files: [
      'src/index.js',
      'test/helpers.js',
      'test/specs/**/*.spec.js',
      {
        pattern: 'docs/images/*',
        included: false,
      },
    ],
    frameworks: ['mocha', 'chai'],
    preprocessors: {
      'src/index.js': ['rollup'],
      'test/helpers.js': ['rollup'],
      'test/specs/**/*.spec.js': ['rollup'],
    },
    reporters: ['mocha', 'coverage-istanbul'],
    rollupPreprocessor: {
      plugins: rollupConfig.plugins,
      output: {
        format: 'iife',
        name: rollupConfig.output[0].name,
        sourcemap: 'inline',
      },
    },
    singleRun: true,
  });
};
