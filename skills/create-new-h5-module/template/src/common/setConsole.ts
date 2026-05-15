export default function setConsole() {
	const needConsole = window.location.href.includes('console');
	const isLocal = window.location.href.includes('localhost');
	const isDevelopment = import.meta.env.DEV;
	const isDevPage = window.location.href.includes('dev-page');
	if (isDevelopment || needConsole || isDevPage)
		return import('vconsole').then(({ default: VConsole }) => new VConsole());
}
