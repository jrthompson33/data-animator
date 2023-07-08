module.exports = {
	trailingComma: "es5",
	tabWidth: 4,
	semi: true,
	singleQuote: true,
	bracketSpacing: false,
	printWidth: 85,
	jsxBracketSameLine: false,
	overrides: [
		{
			files: ["*.css", "*.scss", "*.less"],
			options: {
				"tabWidth": 2
			}
		}
	]
};