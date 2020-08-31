module.exports = {
  reporter: ["text", "lcov"],
  include: ["out/src/**"],
  exclude: ["out/src/logger/**"],
  branches: 85,
  lines: 90,
  functions: 85,
  statements: 90,
  "check-coverage": true,
  excludeAfterRemap: false,
  all: true
};
