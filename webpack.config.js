const ElectronConnectWebpackPlugin = require('electron-connect-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')

const isDev = process.env.NODE_ENV === 'dev'

const devOnlyPlugins = [
  new ElectronConnectWebpackPlugin({
    path: '.',
    logLevel: 0
  })
]

module.exports = {
  entry: ['@babel/register', 'core-js/stable', './src/client/index.js'],

  mode: isDev ? 'development' : 'production',

  target: 'electron-renderer',

  output: {
    filename: 'bundle.js',
    path: path.resolve('./src/build'),
    publicPath: './'
  },

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
              importLoaders: 1,
              localsConvention: 'camelCaseOnly',
              modules: {
                localIdentName: '[name]-[local]---[hash:base64:5]'
              }
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
