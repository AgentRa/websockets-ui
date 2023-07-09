import { RawData, WebSocketServer } from "ws";
import {
  WebSocketMessageRequest,
  isErrorType,
  WebSocketDataRequest,
  WebSocketMessageType,
  RegistrationDataRequest,
  WebSocketConnection,
  WebSocketDataResponse,
} from "../types";
import { store } from "../store/store";
import { messageCreator } from "../utils";

export const wsServer = new WebSocketServer({ port: 3000 });
const connections: WebSocketConnection[] = [];
const responseForAll = (messages: string[]) =>
  connections.map((socket) => messages.map((message) => socket.send(message)));

wsServer.on("connection", (ws: WebSocketConnection) => {
  ws.index = connections.length;
  connections.push(ws);

  ws.on("message", (message: RawData) => {
    try {
      const data: WebSocketMessageRequest = JSON.parse(message.toString());
      handle(data, ws);
    } catch (error: unknown) {
      if (isErrorType(error)) console.error(error.message);
      else console.error(error);
    }
  });
});

const handle = (
  data: WebSocketMessageRequest,
  ws: WebSocketConnection
): void => {
  const { type, data: payload } = data;
  const request: WebSocketDataRequest = JSON.parse(payload);
  let response: WebSocketDataResponse;
  switch (type) {
    case WebSocketMessageType.REGISTRATION:
      response = store.registerPlayer(
        request as RegistrationDataRequest,
        ws.index
      );
      ws.username = response.name;
      ws.send(
        messageCreator({
          type: WebSocketMessageType.REGISTRATION,
          data: response,
        })
      );
      responseForAll(
        messageCreator([
          { type: WebSocketMessageType.UPDATE_ROOM, data: store.rooms },
          { type: WebSocketMessageType.UPDATE_WINNERS, data: store.winners },
        ])
      );
      break;
    case WebSocketMessageType.CREATE_ROOM:
      response = JSON.stringify(store.createRoom());
      break;
    // case WebSocketMessageType.UPDATE_WINNERS:
    //   break;
    // case WebSocketMessageType.ADD_USER_TO_ROOM:
    //   break;
    // case WebSocketMessageType.CREATE_GAME:
    //   break;
    // case WebSocketMessageType.UPDATE_ROOM:
    //   break;
    // case WebSocketMessageType.ADD_SHIPS:
    //   break;
    // case WebSocketMessageType.START_GAME:
    //   break;
    // case WebSocketMessageType.ATTACK:
    //   break;
    // case WebSocketMessageType.RANDOM_ATTACK:
    //   break;
    // case WebSocketMessageType.TURN:
    //   break;
    // case WebSocketMessageType.FINISH:
    //   break;
    default:
      throw new Error("Unknown type");
  }
};
