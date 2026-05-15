import { isInApp } from '../native';
import Ola from './Ola';
import { DOMAIN_ENVIRONMENT, getApiDomain, getOssDomain } from '/src/common/getDomain';

const ola = new Ola({
	appName: 'partying',
	baseURL: {
		local: getApiDomain(DOMAIN_ENVIRONMENT.LOCAL),
		development: getApiDomain(DOMAIN_ENVIRONMENT.DEVELOPMENT),
		alpha: getApiDomain(DOMAIN_ENVIRONMENT.ALPHA),
		production: getApiDomain(DOMAIN_ENVIRONMENT.PRODUCTION),
	},
	oss: getOssDomain(),
	thinkingdata: {
		appid: '7acc569375a54bf9af70204c04e78313',
		devAppid: '4135588af6af4645a222978cdaeda0cf',
	},
	domain: '',
	channel: 'oversea',
});

const isMock = window.location.hostname.includes('localhost');

async function setOla() {
	if (isInApp) return await ola.appLogin();
	if (isMock) {
		return ola.customLogin({
			token:
				'd61esLpCVaicQzGuJD2YoV9FpBz2DOJYvUyJUuyIWaK6rXP03Eszd70yiRxJSGfAxVIrbAIVlHKLIztc8mmU7EdLkE7SbjEWb2I__2BMlj__2FDEnw2BpbP8c',
			uid: 123456789,
			lan: 'en',
			serverEnv: 'development',
		});
	}
}

export { setOla };
export default ola;
