module.exports = {
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "typescript",
            decorators: true
          },
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true
          }
        }
      }
    ]
  },
  testMatch: ["**/*.spec.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  coverageDirectory: "<rootDir>/coverage",
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/index.ts"
  ],
  testEnvironment: "node",
  rootDir: "."
};