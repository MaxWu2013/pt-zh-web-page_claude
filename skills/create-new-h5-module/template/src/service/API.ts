/* eslint-disable */
import { getQuery } from '@ola/utils';
import ola from '../ola';
import { ExampleInfo_Request, ExampleInfo_Response } from '/src/service/example';
import { request } from '/src/service/instance';
import { DEV_PREFIX } from '/src/common/constant';

const baseUrl = ola.app.config.baseURL[ola.app.server_env];
const Lan = getQuery('lan');
const headers = {
	'user-token': ola.user.token,
	'User-Language': Lan || ola.user.lan,
};

const URL = '/go/activity/example';

function getUrlPrefix() {
  return ola.app.server_env === "production" ? `${URL}` : `${DEV_PREFIX}${URL}`;
}
export function GetSampleApi(): Promise<ExampleInfo_Response> {
	const data = ExampleInfo_Request.toJSON({});
	return request({
    method: "post",
    url: `${getUrlPrefix()}/info`,
    data,
  }).then((res) => ExampleInfo_Response.fromJSON(res));
}
