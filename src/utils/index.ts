import { DataItem } from "../types";

export function messageCreator(dataList: DataItem): string;
export function messageCreator(dataList: DataItem[]): string[];

export function messageCreator(
  dataList: DataItem[] | DataItem
): string[] | string {
  if (Array.isArray(dataList)) {
    return dataList.map((type, data) =>
      JSON.stringify({ type, data: JSON.stringify(data), id: 0 })
    );
  }
  return JSON.stringify({
    type: dataList.type,
    data: JSON.stringify(dataList.data),
    id: 0,
  });
}
