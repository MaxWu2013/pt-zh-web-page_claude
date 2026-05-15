'skip scanner';
import ola from '/src/ola';
import { getQuery } from '@ola/utils';

interface TrackData {
	event: string;
	props: Record<string, string | number>;
}

interface TA {
	track: (event: TrackData['event'], props: TrackData['props']) => void;
	init: (options: object) => void;
	setSuperProperties: (options: object) => void;
	login: (id: unknown) => void;
	quick: (name: string) => void;
	getDistinctId: () => string;
}

declare global {
	interface Window {
		ta: TA;
		thinkingdata: TA;
	}
}

export default async function setReport() {
	if (!ola.app.config.thinkingdata)
		throw new Error(`${ola.app.config.appName}的thinkingdata未配置`);
	const cache: TrackData[] = [];
	(window as any).ta = {
		track(event: TrackData['event'], props: TrackData['props']) {
			console.log('%c track', 'background:green', event);
			cache.push({ event, props });
		},
	};

	const script = window.document.createElement('script');
	window.document.body.appendChild(script);
	script.async = true;
	script.src = `https://xs-image.partying.tw/pt/h5/thinkingdata.umd.min.js`;
	// script.src = window.location.href.startsWith('https://page')
	//   ? `/h5/assets/thinkingdata.umd.min.js`
	//   : `https://page.iambanban.com/h5/assets/thinkingdata.umd.min.js`

	return new Promise<void>((resolve, reject) => {
		script.onload = () => {
			// 初始化数数
			window.thinkingdata.init?.({
				appId:
					ola.app.server_env == 'development'
						? ola.app.config.thinkingdata?.devAppid
						: ola.app.config.thinkingdata?.appid,
				serverUrl: 'https://data.partying.tw/sync_js',
			});
			// window.thinkingdata.setSuperProperties?.({
			//   package_name: ola.app.packages[0],
			//   channel: getQuery('channel') || ''
			// })
			if (ola?.user?.uid) {
				window.thinkingdata.login?.(String(ola?.user?.uid));
			}
			window.thinkingdata.quick('autoTrack');
			window.ta = window.thinkingdata;
			cache.forEach((params) => window.ta.track(params.event, params.props));

			resolve();
		};
		script.onerror = () => {
			const err = new Error('thinkingdata.umd.min.js加载失败！');
			reject(err);
			console.error(err.message);
		};
	});
}
