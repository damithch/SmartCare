export default {
  testEnvironment: "node",
  roots: ["<rootDir>/tests/jest"],
  testMatch: ["**/*.test.js"],
  transform: {},
  collectCoverageFrom: ["src/**/*.js", "!src/server.js"]
};
