import { WebSocket } from "ws";

export type WebSocketMessageRequest = {
  type: string;
  data: string;
  id: number;
};

export type DataRequest =
  | RegistrationDataRequest
  | CreateRoomRequest
  | AddUserToRoomRequest
  | AddShipsRequest;

export type RegistrationDataRequest = {
  name: string;
  password: string;
};

export type AddUserToRoomRequest = {
  indexRoom: number;
};

export type AddShipsRequest = {
  gameId: number;
  ships: Ship[];
  indexPlayer: number;
};

export type DataItem = {
  type: WebSocketMessageType;
  data: WebSocketDataResponse;
};

type CreateRoomRequest = string;

export type RegistrationDataResponse = {
  name: string;
  index: number;
  error: boolean;
  errorText: string;
};
export type CreateRoomDataResponse = string;
export type UpdateRoomDataResponse = Room[];
export type UpdateWinnersDataResponse = Winner[];
export type CreateGameDataResponse = {
  idGame: number;
  idPlayer: number;
};
export type StartGameDataResponse = {
  currentPlayerIndex: number;
  ships: Ship[];
};

// type AddUserToRoomRequestString = {
//   indexRoom: number;
// };

export type WebSocketDataRequest = RegistrationDataRequest | CreateRoomRequest;
// | CreateRoomRequestString
// | AddUserToRoomRequestString;
export type WebSocketDataResponse =
  | RegistrationDataResponse
  | CreateRoomDataResponse
  | UpdateRoomDataResponse
  | UpdateWinnersDataResponse
  | CreateGameDataResponse
  | StartGameDataResponse;

//Type guard
export const isErrorType = (error: unknown): error is Error =>
  error instanceof Error;

export const enum WebSocketMessageType {
  REGISTRATION = "reg",
  CREATE_ROOM = "create_room",
  UPDATE_WINNERS = "update_winners",
  ADD_USER_TO_ROOM = "add_user_to_room",
  CREATE_GAME = "create_game",
  UPDATE_ROOM = "update_room",
  ADD_SHIPS = "add_ships",
  START_GAME = "start_game",
  ATTACK = "attack",
  RANDOM_ATTACK = "random_attack",
  TURN = "turn",
  FINISH = "finish",
}

export type Player = {
  name: string;
  index: number;
};

export type Room = {
  roomId: number;
  roomUsers: Player[];
};

export type Winner = {
  name: string;
  wins: number;
};

export type Game = {
  gameId: number;
  boards: Board[];
  isAllShipsAdded: [boolean, boolean];
};

export type Board = {
  indexPlayer: number;
  ships: Ship[];
};

export type Ship = {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  length: number;
  type: "small" | "medium" | "large" | "huge";
};

export type Players = Player[];
export type Rooms = Room[];
export type WebSocketConnection = {
  index: number;
  name: string;
} & WebSocket;
