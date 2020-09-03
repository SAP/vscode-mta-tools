module.exports = {
  reporter: ["text", "lcov"],
  include: ["out/src/**"],
  exclude: ["out/src/logger/**"],
  branches: 85,
  lines: 95,
  functions: 90,
  statements: 95,
  "check-coverage": true,
  excludeAfterRemap: false,
  all: true,
};
