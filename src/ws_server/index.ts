import { RawData, WebSocketServer } from "ws";
import {
  WebSocketMessageRequest,
  isErrorType,
  WebSocketDataRequest,
  WebSocketMessageType,
} from "../types";
import { store } from "../store/store";

export const wsServer = new WebSocketServer({ port: 3000 });

wsServer.on("connection", (ws) => {
  ws.on("message", (message: RawData) => {
    try {
      const data: WebSocketMessageRequest = JSON.parse(message.toString());
      const response: string = handle(data);

      ws.send(response);
    } catch (error: unknown) {
      if (isErrorType(error)) console.error(error.message);
    }
  });
});

const handle = (data: WebSocketMessageRequest): string => {
  const { type, data: payload, id } = data;
  const request = JSON.parse(payload);
  let response: string;
  switch (type) {
    case WebSocketMessageType.REGISTRATION:
      response = JSON.stringify(
        store.registerPlayer(request as WebSocketDataRequest)
      );
      return JSON.stringify({ type, data: response, id });
    case WebSocketMessageType.UPDATE_WINNERS:
      break;
    case WebSocketMessageType.CREATE_ROOM:
      break;
    case WebSocketMessageType.ADD_USER_TO_ROOM:
      break;
    case WebSocketMessageType.CREATE_GAME:
      break;
    case WebSocketMessageType.UPDATE_ROOM:
      break;
    case WebSocketMessageType.ADD_SHIPS:
      break;
    case WebSocketMessageType.START_GAME:
      break;
    case WebSocketMessageType.ATTACK:
      break;
    case WebSocketMessageType.RANDOM_ATTACK:
      break;
    case WebSocketMessageType.TURN:
      break;
    case WebSocketMessageType.FINISH:
      break;
    default:
      throw new Error("Unknown type");
  }
  return "";
};
