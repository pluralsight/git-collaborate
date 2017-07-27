const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports =  {
  entry: './src/menu/index.js',

  output: {
    filename: 'bundle.js',
    path: path.resolve('./src/build'),
    publicPath: '/'
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /^.*node_modules[\/\\](?!@pluralsight).*$/
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({
          use: [
            'css-loader?modules&importLoaders=1&localIdentName=[local]---[hash:base64:5]',
            {
              loader: 'postcss-loader',
              options: {
                plugins: {
                  'postcss-import': {},
                  'postcss-cssnext': {},
                  'postcss-nested': {}
                }
              }
            }
          ],
        })
      }
    ]
  },

  plugins: [
    new ExtractTextPlugin('styles.css'),
    new HtmlWebpackPlugin({ template: './src/menu/index.html' })
  ],

  devServer: {
    contentBase: path.join(__dirname, 'menu')
  }
}
