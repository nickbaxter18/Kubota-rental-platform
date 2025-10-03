module.exports = {
  "preset": "ts-jest",
  "testEnvironment": "node",
  "roots": [
    "<rootDir>/src",
    "<rootDir>/test"
  ],
  "testMatch": [
    "**/__tests__/**/*.ts",
    "**/?(*.)+(spec|test).ts"
  ],
  "retryTimes": 2,
  "retryDelay": 1000,
  "setupFilesAfterEnv": [
    "./src/test/setup.ts"
  ],
  "clearMocks": true,
  "restoreMocks": true,
  "collectCoverageFrom": [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
    "!src/**/*.module.ts"
  ],
  "coverageDirectory": "coverage",
  "coverageReporters": [
    "text",
    "lcov",
    "json",
    "html"
  ],
  "testTimeout": 10000,
  "maxWorkers": "50%",
  "detectOpenHandles": true,
  "forceExit": true,
  "moduleNameMapping": {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  "transform": {
    "^.+\\.ts$": "ts-jest"
  },
  "testPathIgnorePatterns": [
    "/node_modules/",
    "/dist/",
    "/coverage/"
  ]
};