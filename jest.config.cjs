module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.js', '<rootDir>/server/**/*.test.js'],
  transform: {},
  moduleFileExtensions: ['js', 'jsx', 'json'],
  moduleNameMapper: { '^(\\.{1,2}/.*?)(?<!\\.js)$': '$1.js' },
  collectCoverageFrom: [
    'src/services/authRules.js',
    'src/services/authService.js',
    'server/adminUtils.js',
    '!src/**/*.test.js'
  ],
  coveragePathIgnorePatterns: ['/node_modules/']
}
