/* eslint-disable camelcase */
import { getUserInfo } from '/src/native';
import { getQuery } from '@ola/utils';
import type { User, ServerEnv, App, AppConfig } from './types';

export const formatLan = (lan: string) => lan.toLocaleLowerCase().replace(/-/g, '_');

export * from './types';

const {
	name = '',
	uid = '0',
	token = '',
	server_env = 'production',
	lan = formatLan(navigator.language),
	area = formatLan(navigator.language),
	icon = '',
	pkg = '',
} = getQuery();

const defaultPackage = pkg;
const defaultServerEnv = window.location.origin.includes('.partying.dev')
	? ('development' as ServerEnv)
	: (server_env as ServerEnv);
const defaultUser: User = { name, uid: Number(uid), token, icon, lan, area };

export default class Ola {
	user = defaultUser;

	app: App;

	constructor(appConfig: AppConfig) {
		this.app = {
			config: appConfig,
			server_env: defaultServerEnv,
			pkg: defaultPackage,
			web_proxy_port: undefined,
		};
	}

	async appLogin() {
		const user = await getUserInfo();
		if (user.lan) user.lan = formatLan(user.lan);
		this.user = { ...this.user, ...user };
		this.app.pkg = user.package;
		this.app.server_env = user.server_env as ServerEnv;
		this.app.web_proxy_port = user.web_proxy_port;
		const domains: { api: string; image: string } = JSON.parse(user.domains);
		this.app.config.oss = domains.image;
		this.app.config.baseURL = {
			...this.app.config.baseURL,
			[this.app.server_env]: domains.api,
		};
	}

	customLogin(customLoginInfo: Partial<User> & { serverEnv: ServerEnv }) {
		this.user = { ...this.user, ...customLoginInfo };
		this.app.server_env = customLoginInfo.serverEnv;
	}
}
