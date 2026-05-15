import { getQuery, QS, randomString } from '@ola/utils';

interface OlaWindow extends Window {
	NativeProxy: { postMessage: (message: string) => void };
	[key: string]: any;
}

declare const window: OlaWindow;

const isInApp = Boolean(window.NativeProxy);

const isFullScreen = getQuery('clientScreenMode') === '1';

const ifUseProxy = getQuery('proxy') === '1';

export class NativeError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'NativeError';
	}
}

class Native {
	private static schema: string;
	static setSchema(value: string) {
		this.schema = value;
	}
	static async callAppFunc<T = void>(appFunc: string, param?: object): Promise<T> {
		console.log(`native方法${appFunc}开始调用; params:`, param);
		if (!isInApp) throw new NativeError(`当前环境不支持Native方法${appFunc}`);
		const cb = `nativeCB${randomString()}`;
		const data = { cb, ...(param ? { param: JSON.stringify(param) } : {}) };
		const message = `${this.schema}${appFunc}?${QS.stringify(data)}`;
		console.log(message);
		return new Promise((resolve) => {
			window[cb] = (result: T) => {
				console.log(`Native方法${appFunc}调用成功; result:`, result);
				delete window[cb];
				resolve(result);
			};
			window.NativeProxy?.postMessage(message);
		});
	}

	static subscribe<T = void>(appFunc: string, callback: (data: T) => void, param?: object): void {
		console.log(`native方法${appFunc}开始调用; params:`, param);
		if (!isInApp) throw new NativeError(`当前环境不支持Native方法${appFunc}`);
		const cb = `nativeCB${randomString()}`;
		const data = { cb, ...(param ? { param: JSON.stringify(param) } : {}) };
		const message = `${this.schema}${appFunc}?${QS.stringify(data)}`;
		console.log(message);
		window[cb] = (result: T) => callback(result);
		window.NativeProxy?.postMessage(message);
	}
}

Native.setSchema('banban://');

function listenAppMethod<T>(appFunc: string, callback: (result: T) => void) {
	window[appFunc] = (result: T) => {
		if (callback) callback(result);
	};
}

export { isInApp, isFullScreen, ifUseProxy, Native, listenAppMethod };
