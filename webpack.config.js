const CopyPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')

const isDev = process.env.NODE_ENV === 'development'

module.exports = [
  {
    entry: ['@babel/register', 'core-js/stable', './src/main.js'],
    mode: isDev ? 'development' : 'production',
    module: {
      rules: [
        {
          test: /\.js$/,
          use: 'babel-loader',
          exclude: /node_modules/
        }
      ]
    },
    node: {
      __dirname: false
    },
    output: {
      filename: 'main.js',
      path: path.resolve('./dist'),
      publicPath: './'
    },
    target: 'electron-main'
  },
  {
    entry: ['@babel/register', 'core-js/stable', './src/client/index.js'],
    mode: isDev ? 'development' : 'production',
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
    output: {
      filename: 'renderer.js',
      path: path.resolve('./dist'),
      publicPath: './'
    },
    plugins: [
      new CopyPlugin([{ from: './src/assets', to: 'assets' }]),
      new MiniCssExtractPlugin({ filename: 'styles.css' }),
      new HtmlWebpackPlugin({ template: './src/client/index.html' })
    ],
    target: 'electron-renderer'
  }
]
