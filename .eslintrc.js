module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    jest: true,
  },
  extends: [
    "airbnb-base",
  ],
  parserOptions: {
    ecmaVersion: "latest",
  },
  rules: {
    quotes: ["error", "double"],
    curly: ["error", "all"],
    "no-throw-literal": ["off"],
    "no-console": "off",
    "no-restricted-syntax": ["error", "FunctionExpression", "WithStatement"],
  },
};
