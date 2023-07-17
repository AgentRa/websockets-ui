import { WebSocketServer } from "ws";
import {
  WebSocketMessageRequest,
  WebSocketMessageType,
  RegistrationDataRequest,
  WebSocketConnection,
  DataRequest,
  AddUserToRoomRequest,
  AddShipsRequest,
  AttackRequest,
  RandomAttackRequest,
} from "../types";
import { store } from "../store/store";
import * as handle from "../game_logic/handle";
import { isErrorType } from "../utils";

export const wsServer = new WebSocketServer({ port: 3000 });

wsServer.on("connection", (ws: WebSocketConnection) => {
  store.addConnection(ws);

  ws.on("message", (message: string) => {
    try {
      const data: WebSocketMessageRequest = JSON.parse(message);
      const { type, data: payload } = data;
      const request: DataRequest = payload.length
        ? JSON.parse(payload)
        : payload;

      switch (type) {
        case WebSocketMessageType.REGISTRATION:
          handle.registration(request as RegistrationDataRequest, ws);
          break;
        case WebSocketMessageType.CREATE_ROOM:
          handle.createRoom(ws);
          break;
        case WebSocketMessageType.ADD_USER_TO_ROOM:
          handle.addUserToRoom(request as AddUserToRoomRequest, ws);
          break;
        case WebSocketMessageType.ADD_SHIPS:
          handle.addShips(request as AddShipsRequest);
          break;
        case WebSocketMessageType.ATTACK:
          handle.attack(request as AttackRequest);
          break;
        case WebSocketMessageType.RANDOM_ATTACK:
          handle.attack(request as RandomAttackRequest);
          break;
        default:
          break;
      }
    } catch (error: unknown) {
      if (isErrorType(error)) console.error(error.message);
      else console.error(error);
    }
  });

  ws.on("close", () => {
    store.removeConnection(ws.index);
    store.removePlayer(ws.index);
    console.log(`Client ${ws.name ?? ""} disconnected`);
  });
});
