import axios, { AxiosRequestConfig } from "axios";
import { getQuery } from "@ola/utils";
import Toast from "../common/Toast/Toast";
import ola from "../ola";

const instance = axios.create();
// toast 40x 50x
instance.interceptors.response.use(undefined, (error) => {
  if (!axios.isCancel(error)) {
    Toast.show(error?.response?.data?.msg ?? "Error occurred. Please try again later");
  }
  return Promise.reject(error);
});
// 设置公共参数
const Lan = getQuery("lan");

// 业务错误
export class ServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceError";
  }
}

// 约定业务数据结构
type T<D> = D & { success: boolean; msg: string };

// 抛出业务错误, toast业务错误
async function request<D>(config: AxiosRequestConfig) {
  const response = await instance.request<T<D>>({
    ...config,
    baseURL: ola.app.config.baseURL[ola.app.server_env],
    headers: {
      ...instance.defaults.headers.common,
      "user-token": ola.user.token,
      "content-type": "application/json",
      "user-language": Lan || ola.user.lan,
    },
  });
  if (response.data.success === true) return response.data;
  const error = new ServiceError(response.data.msg || "unknown service error");
  Toast.show(error.message);
  throw error;
}

export { instance, request };
