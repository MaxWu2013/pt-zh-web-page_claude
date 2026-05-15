/* eslint-disable */
String.prototype.format = function () {
	var formatted = this;
	for (var i = 0; i < arguments.length; i++) {
		var regexp = new RegExp('\\{' + i + '\\}', 'gi');
		formatted = formatted.replace(regexp, arguments[i]);
	}
	return formatted;
};

String.prototype.replaceJSX = function (find, replace) {
	return this.split(find)
		.flatMap((item) => [item, replace])
		.slice(0, -1);
};
