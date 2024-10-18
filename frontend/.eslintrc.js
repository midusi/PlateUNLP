module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'airbnb-base'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    indent: ['warn', 2],
    semi: [2, 'never'],
    curly: ['error', 'multi'],
    'comma-dangle': [2, 'never'],
    'linebreak-style': 0,
    'no-underscore-dangle': 'off',
    'no-unused-expressions': ['off', { allowShortCircuit: true, allowTernary: true }],
    'no-sequences': ['off'],
    'no-undef': 'warn',
    'no-useless-escape': ['off'],
    'no-unused-vars': ['off'],
    'no-return-assign': ['off'],
    'array-callback-return': ['off', { allowImplicit: true }],
    'no-param-reassign': [2, { props: false }],
    'import/prefer-default-export': 'off',
    'nonblock-statement-body-position': 'off',
    'import/no-cycle': [
      'warn',
      {
        maxDepth: 2,
        ignoreExternal: true
      }
    ]
  }
}
