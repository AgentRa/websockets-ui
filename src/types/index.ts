export type WebSocketMessageRequest = {
  type: string;
  data: string;
  id: number;
};

type RegistrationDataRequestString = {
  name: string;
  password: string;
};

export type RegistrationDataResponse = {
  name: string;
  password: string;
  error: boolean;
  errorText: string;
};

// type AddUserToRoomRequestString = {
//   indexRoom: number;
// };

export type WebSocketDataRequest = RegistrationDataRequestString;
// | CreateRoomRequestString
// | AddUserToRoomRequestString;

//Type guard
export const isErrorType = (error: unknown): error is Error =>
  error instanceof Error;

export const enum WebSocketMessageType {
  REGISTRATION = "reg",
  UPDATE_WINNERS = "update_winners",
  CREATE_ROOM = "create_room",
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
  password: string;
};

export type Players = Player[];
