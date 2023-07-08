const path = require('path');

module.exports = {
	entry: './src/index.tsx',
	mode: 'production',
	output: {
		filename: 'app.bundle.js',
		path: path.resolve(__dirname,'dist/scripts'),
		publicPath: '/',
		libraryTarget: 'var',
		library: 'da'
	},
	performance: {
		hints: false,
		maxEntrypointSize: 512000,
		maxAssetSize: 512000
	},
	target: 'web',
	devtool: 'source-map',
	resolve: {
		extensions: ['.ts', '.tsx','.js', '.jsx']
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				exclude: /(node_modules)/,
				use: [
					'ts-loader'
					]
			}
		]
	}
};