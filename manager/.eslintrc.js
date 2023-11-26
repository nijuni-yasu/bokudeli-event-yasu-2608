module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: 'vuetify',
  rules: {
    // console.logをproductionではだせない設定をコメントアウト
    // 'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
  },
  parserOptions: {
    parser: 'babel-eslint',
  },
}
