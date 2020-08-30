module.exports = {
  reporter: ["text", "lcov"],
  include: ["out/src/**"],
  exclude: ["out/src/logger/**"],
  // https://reflectoring.io/100-percent-test-coverage/
  branches: 85,
  lines: 90,
  functions: 85,
  statements: 90,
  "check-coverage": true,
  excludeAfterRemap: false,
  all: true
};
