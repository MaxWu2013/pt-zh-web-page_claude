/* eslint-disable */
import axiosClient from 'axios'
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { Rpc } from 'twirp-rpc-client'
import Toast from '/src/common/Toast/Toast'

export interface ErrorMessage {
  msg: string
}

class OlaProtobufClient implements Rpc {
  client: AxiosInstance

  constructor(url?: string, config?: AxiosRequestConfig, headers?: {}) {
    this.client = axiosClient.create({
      ...config,
      baseURL: url,
      headers: {
        ...headers,
        accept: 'application/protobuf,application/json',
        'content-type': 'application/protobuf'
      },
      responseType: 'arraybuffer'
    })
    this.client.interceptors.response.use(undefined, (error) => {
      if (!axios.isCancel(error)) {
        const enc = new TextDecoder('utf-8')
        const err: ErrorMessage = JSON.parse(
          enc.decode(new Uint8Array(error.response.data))
        )
        Toast.show(err.msg ?? 'Error occurred. Please try again later')
      }
      return Promise.reject(error)
    })
  }

  async request(
    service: string,
    method: string,
    data: Uint8Array
  ): Promise<Uint8Array> {
    return this.client
      .post(`/${service}/${method}`, data.slice().buffer)
      .then((response) => {
        return new Uint8Array(response.data)
      })
      .catch((error) => {
        throw error
      })
  }
}

export default OlaProtobufClient
