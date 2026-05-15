/**
 * GENERATED FILE, DO NOT UPDATE THIS FILE MANUALLY via /scripts/domain_file_replacement/move_and_replace_getDomain.py
 * Execute the following at the root folder of the project: `python3 ./scripts/domain_file_replacement/move_and_replace_getDomain.py`
 * USAGE: GET DOMAIN FROM BROWSER URL, PROVIDE DOMAIN WITHOUT SUBDOMAIN, PAGE DOMAIN, API DOMAIN
 */

export function getFirstSubdomain() {
	var domainParts = window.location.hostname.split('.');
	if (domainParts.length > 2) {
		return domainParts[0];
	} else {
		return 'page'; // No subdomain found
	}
}

export enum DOMAIN_ENVIRONMENT {
	LOCAL,
	DEVELOPMENT,
	ALPHA,
	PRODUCTION,
}

/** GET DOMAIN WITHOUT SUBDOMAIN
 * page.partying.tw => partying.tw
 */
export function getDomain() {
	return window.location.host.replace(`${getFirstSubdomain}.`, '');
}

export function getPageDomain(env: DOMAIN_ENVIRONMENT) {
	switch (env) {
		case DOMAIN_ENVIRONMENT.LOCAL:
		case DOMAIN_ENVIRONMENT.DEVELOPMENT:
		case DOMAIN_ENVIRONMENT.ALPHA:
			return 'https://pts.partying.dev';
	}
	return `${window.location.origin}`;
}

export function getApiDomain(env: DOMAIN_ENVIRONMENT) {
	switch (env) {
		case DOMAIN_ENVIRONMENT.LOCAL:
		case DOMAIN_ENVIRONMENT.DEVELOPMENT:
		case DOMAIN_ENVIRONMENT.ALPHA:
			return 'https://pts.partying.dev';
	}
	if (window.location.origin.includes('.partying.dev')) {
		return 'https://pts.partying.dev';
	}
	// Disabled: forcing localhost to hit the PRODUCTION api breaks local
	// development against the Vite proxy at `/vite/proxy` (see vite.config.ts).
	// If you genuinely need to hit prod from localhost, uncomment temporarily —
	// don't commit it that way.
	// if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
	// 	return 'https://api.partying.tw';
	return `${window.location.origin.replace(getFirstSubdomain(), 'api')}`;
}

export function getOssDomain() {
	return 'https://xs-image.partying.tw';
}

export default {
	DOMAIN_ENVIRONMENT,
	getFirstSubdomain,
	getDomain,
	getPageDomain,
	getApiDomain,
	getOssDomain,
};
