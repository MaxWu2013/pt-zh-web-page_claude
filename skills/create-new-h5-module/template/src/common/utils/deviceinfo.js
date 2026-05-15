/* eslint-disable */
const ua = navigator.userAgent.toLowerCase();
const testUa = (regexp) => regexp.test(ua);
const testVs = (regexp) =>
	ua
		.match(regexp)
		.toString()
		.replace(/[^0-9|_.]/g, '')
		.replace(/_/g, '.');

export default class DeviceInfo {
	static get system() {
		let system = 'unknow';
		if (testUa(/windows|win32|win64|wow32|wow64/g)) {
			system = 'windows';
		} else if (testUa(/macintosh|macintel/g)) {
			system = 'macos';
		} else if (testUa(/x11/g)) {
			system = 'linux';
		} else if (testUa(/android|adr/g)) {
			system = 'android';
		} else if (testUa(/ios|iphone|ipad|ipod|iwatch/g)) {
			system = 'ios';
		}
		return system;
	}

	static get systemVs() {
		const system = this.system;
		let systemVs = 'unknow';
		if (system === 'windows') {
			if (testUa(/windows nt 5.0|windows 2000/g)) {
				systemVs = '2000';
			} else if (testUa(/windows nt 5.1|windows xp/g)) {
				systemVs = 'xp';
			} else if (testUa(/windows nt 5.2|windows 2003/g)) {
				systemVs = '2003';
			} else if (testUa(/windows nt 6.0|windows vista/g)) {
				systemVs = 'vista';
			} else if (testUa(/windows nt 6.1|windows 7/g)) {
				systemVs = '7';
			} else if (testUa(/windows nt 6.2|windows 8/g)) {
				systemVs = '8';
			} else if (testUa(/windows nt 6.3|windows 8.1/g)) {
				systemVs = '8.1';
			} else if (testUa(/windows nt 10.0|windows 10/g)) {
				systemVs = '10';
			}
		} else if (system === 'macos') {
			systemVs = testVs(/os x [\d._]+/g);
		} else if (system === 'android') {
			systemVs = testVs(/android [\d._]+/g);
		} else if (system === 'ios') {
			systemVs = testVs(/os [\d._]+/g);
		}
		return systemVs;
	}

	static get platform() {
		const system = this.system;
		let platform = 'unknow';
		if (system === 'windows' || system === 'macos' || system === 'linux') {
			platform = 'desktop'; // 桌面端
		} else if (system === 'android' || system === 'ios' || testUa(/mobile/g)) {
			platform = 'mobile'; // 移动端
		}
		return platform;
	}

	static get shell() {
		let shell = 'none';
		// let shellVs = "unknow";
		if (testUa(/micromessenger/g)) {
			shell = 'wechat'; // 微信浏览器
			// shellVs = testVs(/micromessenger\/[\d._]+/g);
		} else if (testUa(/qqbrowser/g)) {
			shell = 'qq'; // QQ浏览器
			// shellVs = testVs(/qqbrowser\/[\d._]+/g);
		} else if (testUa(/ucbrowser/g)) {
			shell = 'uc'; // UC浏览器
			// shellVs = testVs(/ucbrowser\/[\d._]+/g);
		} else if (testUa(/qihu 360se/g)) {
			shell = '360'; // 360浏览器(无版本)
		} else if (testUa(/2345explorer/g)) {
			shell = '2345'; // 2345浏览器
			// shellVs = testVs(/2345explorer\/[\d._]+/g);
		} else if (testUa(/metasr/g)) {
			shell = 'sougou'; // 搜狗浏览器(无版本)
		} else if (testUa(/lbbrowser/g)) {
			shell = 'liebao'; // 猎豹浏览器(无版本)
		} else if (testUa(/maxthon/g)) {
			shell = 'maxthon'; // 遨游浏览器
			// shellVs = testVs(/maxthon\/[\d._]+/g);
		}
		return shell;
	}

	static get isIphoneX() {
		if (this.system === 'ios') {
			if (window.screen.height === 812 && window.screen.width === 375) {
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}

	static get isIphoneHigher() {
		if (this.system === 'ios') {
			if (window.screen.height >= 812) {
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}

	static get init() {
		return {
			system: this.system,
			systemVs: this.systemVs,
			platform: this.platform,
			shell: this.shell,
		};
	}
}
