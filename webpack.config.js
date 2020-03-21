const ElectronConnectWebpackPlugin = require('electron-connect-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

const isDev = process.env.NODE_ENV === 'dev'

const devOnlyPlugins = [
  new ElectronConnectWebpackPlugin({
    path: '.',
    logLevel: 0
  })
]

module.exports = {
  entry: ['babel-polyfill', './src/client/index.js'],

  output: {
    filename: 'bundle.js',
    path: path.resolve('./src/build'),
    publicPath: './'
  },

  mode: 'production',

  target: 'electron-renderer',

  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /^.*node_modules[/\\](?!@pluralsight).*$/
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: (resourcePath, context) =>
                `${path.relative(path.dirname(resourcePath), context)}/`
            }
          },
          {
            loader: 'css-loader',
            options: {
              modules: true,
              importLoaders: 1,
              localsConvention: 'camelCaseOnly'
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => [
                require('postcss-preset-env')()
              ]
            }
          }
        ]
      },
      {
        test: /\.svg$/,
        use: 'svg-react-loader'
      }
    ]
  },

  plugins: [
    new MiniCssExtractPlugin({ filename: 'styles.css' }),
    new HtmlWebpackPlugin({ template: './src/client/index.html' })
  ].concat(isDev ? devOnlyPlugins : []),

  devServer: {
    contentBase: path.join(__dirname, 'build')
  }
}
