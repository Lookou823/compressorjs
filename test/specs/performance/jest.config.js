/**
 * Jest 配置文件（用于性能测试）
 * 注意：项目主要使用 Karma + Mocha，此配置仅用于性能审计测试
 */

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/performance/**/*.spec.js'],
  testTimeout: 120000, // 2分钟超时（内存测试需要较长时间）
  verbose: true,
  collectCoverage: false, // 性能测试不需要覆盖率
};
