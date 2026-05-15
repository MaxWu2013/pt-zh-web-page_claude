/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "pbapi";

export interface ExampleInfo {
}

export interface ExampleInfo_Request {
}

export interface ExampleInfo_Response {
  success: boolean;
  msg: string;
}

function createBaseExampleInfo(): ExampleInfo {
  return {};
}

export const ExampleInfo = {
  encode(_: ExampleInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ExampleInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseExampleInfo();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): ExampleInfo {
    return {};
  },

  toJSON(_: ExampleInfo): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<ExampleInfo>, I>>(base?: I): ExampleInfo {
    return ExampleInfo.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ExampleInfo>, I>>(_: I): ExampleInfo {
    const message = createBaseExampleInfo();
    return message;
  },
};

function createBaseExampleInfo_Request(): ExampleInfo_Request {
  return {};
}

export const ExampleInfo_Request = {
  encode(_: ExampleInfo_Request, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ExampleInfo_Request {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseExampleInfo_Request();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): ExampleInfo_Request {
    return {};
  },

  toJSON(_: ExampleInfo_Request): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<ExampleInfo_Request>, I>>(base?: I): ExampleInfo_Request {
    return ExampleInfo_Request.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ExampleInfo_Request>, I>>(_: I): ExampleInfo_Request {
    const message = createBaseExampleInfo_Request();
    return message;
  },
};

function createBaseExampleInfo_Response(): ExampleInfo_Response {
  return { success: false, msg: "" };
}

export const ExampleInfo_Response = {
  encode(message: ExampleInfo_Response, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.success === true) {
      writer.uint32(8).bool(message.success);
    }
    if (message.msg !== "") {
      writer.uint32(18).string(message.msg);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ExampleInfo_Response {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseExampleInfo_Response();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.success = reader.bool();
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.msg = reader.string();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ExampleInfo_Response {
    return {
      success: isSet(object.success) ? Boolean(object.success) : false,
      msg: isSet(object.msg) ? String(object.msg) : "",
    };
  },

  toJSON(message: ExampleInfo_Response): unknown {
    const obj: any = {};
    message.success !== undefined && (obj.success = message.success);
    message.msg !== undefined && (obj.msg = message.msg);
    return obj;
  },

  create<I extends Exact<DeepPartial<ExampleInfo_Response>, I>>(base?: I): ExampleInfo_Response {
    return ExampleInfo_Response.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ExampleInfo_Response>, I>>(object: I): ExampleInfo_Response {
    const message = createBaseExampleInfo_Response();
    message.success = object.success ?? false;
    message.msg = object.msg ?? "";
    return message;
  },
};

export interface ExampleApi {
  Info(request: ExampleInfo_Request): Promise<ExampleInfo_Response>;
}

export class ExampleApiClientImpl implements ExampleApi {
  private readonly rpc: Rpc;
  private readonly service: string;
  constructor(rpc: Rpc, opts?: { service?: string }) {
    this.service = opts?.service || "pbapi.ExampleApi";
    this.rpc = rpc;
    this.Info = this.Info.bind(this);
  }
  Info(request: ExampleInfo_Request): Promise<ExampleInfo_Response> {
    const data = ExampleInfo_Request.encode(request).finish();
    const promise = this.rpc.request(this.service, "Info", data);
    return promise.then((data) => ExampleInfo_Response.decode(_m0.Reader.create(data)));
  }
}

interface Rpc {
  request(service: string, method: string, data: Uint8Array): Promise<Uint8Array>;
}

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
