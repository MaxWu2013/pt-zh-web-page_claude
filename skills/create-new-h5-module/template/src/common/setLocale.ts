declare global {
	interface Window {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		locale: Record<string, string>;
	}
}

// 按顺序尝试加载多语言,返回第一个加载成功的语言, 如果全部加载失败,不做多语言处理,返回汉语
export default async function setLocale(...languages: string[]) {
	const lans = [...new Set(languages)];
	for (let i = 0; i < lans.length; i += 1) {
		const lan = lans[i];
		try {
			// eslint-disable-next-line no-await-in-loop
			const module = await import(`../locale/${lan}.json`);
			window.locale = module.default;
			return lan;
		} catch (err) {
			console.log(`./locale/${lan}.json加载失败`, err);
		}
	}
	return 'en';
}
