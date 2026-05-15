import ola from '/src/ola';
import { isStringEmpty } from '/src/common/utils/utils';

export const DEV_PREFIX = ''; // should use the one in Ola.ts that retrieves from the mobile application

export const activity_id = 'PT2407002C';

export const event_url = '/act/anniversary-2024/home?clientScreenMode=1';

export const event_date = '04.15 12:00~4.21 23:59';

const giftImagePrefix = `${ola.app.config.oss}static/gift_big/`;

export enum RoomType {
	MultiHost,
	SingleHost,
	Guest,
}

export enum CommonState {
	NotYetStarted,
	InProgress,
	Ended,
	Prohibited,
}

export function GetEventUrl(eventPath: string): string {
	return ['/act/anniversary-2024', eventPath, '?clientScreenMode=1']
		.filter((item) => !isStringEmpty(item))
		.join('/');
}

export default giftImagePrefix;
