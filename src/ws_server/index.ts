import { Data, WebSocketServer } from "ws";
import {
  WebSocketMessageRequest,
  isErrorType,
  WebSocketMessageType,
  RegistrationDataRequest,
  WebSocketConnection,
  DataRequest,
  AddUserToRoomRequest,
  AddShipsRequest,
} from "../types";
import { store } from "../store/store";
import { messageCreator } from "../utils";

export const wsServer = new WebSocketServer({ port: 3000 });
const connections: WebSocketConnection[] = [];
const responseForAll = (messages: string[]) => {
  connections.map((socket) => messages.map((message) => socket.send(message)));
};

wsServer.on("connection", (ws: WebSocketConnection) => {
  ws.index = connections.length;
  connections.push(ws);

  ws.on("message", (message: Data) => {
    try {
      const data: WebSocketMessageRequest = JSON.parse(message as string);
      const { type, data: payload } = data;
      const request: DataRequest = payload.length
        ? JSON.parse(payload)
        : payload;

      switch (type) {
        case WebSocketMessageType.REGISTRATION:
          handleRegistration(request as RegistrationDataRequest, ws);
          break;
        case WebSocketMessageType.CREATE_ROOM:
          handleCreateRoom(ws);
          break;
        case WebSocketMessageType.ADD_USER_TO_ROOM:
          handleAddUserToRoom(request as AddUserToRoomRequest, ws);
          break;
        case WebSocketMessageType.ADD_SHIPS:
          handleAddShips(request as AddShipsRequest);
          break;
        // case WebSocketMessageType.CREATE_GAME:
        //   break;
        // case WebSocketMessageType.UPDATE_WINNERS:
        //   break;

        // case WebSocketMessageType.UPDATE_ROOM:
        //   break;
        // case WebSocketMessageType.ADD_SHIPS:
        //   store
        //     .gameById((request as AddShipsRequest).gameId)
        //     ?.boards.find((board) => {
        //       if (board.indexPlayer === (request as AddShipsRequest).indexPlayer) {
        //         board.ships = (request as AddShipsRequest).ships;
        //       }
        //     });
        //   if (
        //     store.gameById((request as AddShipsRequest).gameId)?.boards.length === 2
        //   ) {
        //   }
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
      }
    } catch (error: unknown) {
      if (isErrorType(error)) console.error(error.message);
      else console.error(error);
    }
  });
});

const handleRegistration = (
  request: RegistrationDataRequest,
  ws: WebSocketConnection
) => {
  const response = store.registerPlayer(request.name, ws.index);
  ws.name = request.name;

  const registrationResponseMessage: string = messageCreator({
    type: WebSocketMessageType.REGISTRATION,
    data: response,
  });

  const updateRoomAndWinnersMessages: string[] = messageCreator([
    {
      type: WebSocketMessageType.UPDATE_ROOM,
      data: store.availableRooms,
    },
    {
      type: WebSocketMessageType.UPDATE_WINNERS,
      data: store.winners,
    },
  ]);

  ws.send(registrationResponseMessage);
  responseForAll(updateRoomAndWinnersMessages);
};

const handleCreateRoom = (ws: WebSocketConnection) => {
  store.createRoom({ name: ws.name, index: ws.index });

  const updateRoomMessage: string[] = messageCreator([
    {
      type: WebSocketMessageType.UPDATE_ROOM,
      data: store.availableRooms,
    },
  ]);

  responseForAll(updateRoomMessage);
};

const handleAddUserToRoom = (
  request: AddUserToRoomRequest,
  ws: WebSocketConnection
) => {
  store.joinRoom({ name: ws.name, index: ws.index }, request.indexRoom);

  const updateRoomMessage: string[] = messageCreator([
    {
      type: WebSocketMessageType.UPDATE_ROOM,
      data: store.availableRooms,
    },
  ]);

  responseForAll(updateRoomMessage);

  const { gameId, boards } = store.createGame(request.indexRoom);

  boards.map((board) => {
    const message: string = messageCreator({
      type: WebSocketMessageType.CREATE_GAME,
      data: {
        idGame: gameId,
        idPlayer: board.indexPlayer,
      },
    });
    connections[board.indexPlayer].send(message);
  });
};

const handleAddShips = (request: AddShipsRequest) => {
  const { gameId, indexPlayer, ships } = request;
  const game = store.gameById(gameId);
  if (!game) throw new Error("Game not found");

  game.boards.map((board) => {
    if (board.indexPlayer === indexPlayer) {
      board.ships = ships;
      game.isAllShipsAdded.shift();
      game.isAllShipsAdded.push(true);
    }
  });

  const readyToStart = game.isAllShipsAdded.every((isAdded) => isAdded);

  if (readyToStart) {
    game.boards.map((board) => {
      const message: string = messageCreator({
        type: WebSocketMessageType.START_GAME,
        data: {
          ships: board.ships,
          currentPlayerIndex: board.indexPlayer,
        },
      });
      connections[board.indexPlayer].send(message);
    });
  }
};
