module.exports = {
  reporter: 'list',
  require: [
    '@babel/register',
    'core-js/stable',
    './test/setup.js'
  ],
  spec: './src/**/*.spec.js'
}
