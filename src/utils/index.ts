import { DataItem, WebSocketConnection } from "../types";

export function messageCreator(dataList: DataItem): string;
export function messageCreator(dataList: DataItem[]): string[];

export function messageCreator(
  dataList: DataItem[] | DataItem
): string[] | string {
  if (Array.isArray(dataList)) {
    return dataList.map(({ type, data }) =>
      JSON.stringify({ type, data: JSON.stringify(data), id: 0 })
    );
  }
  return JSON.stringify({
    type: dataList.type,
    data: JSON.stringify(dataList.data),
    id: 0,
  });
}

export const responseForAll = (
  messages: string[],
  connections: WebSocketConnection[]
) => {
  connections.map((socket) => messages.map((message) => socket.send(message)));
};

export const isErrorType = (error: unknown): error is Error =>
  error instanceof Error;
