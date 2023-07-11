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
  Ship,
  Field,
  AttackRequest,
  AttackStatus,
  AttackStatusEnum,
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
        case WebSocketMessageType.ATTACK:
          handleAttack(request as AttackRequest);
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
    } else {
      board.enemyField = createEnemyFieldBasedOnShips(ships);
    }
  });

  const readyToStart = game.isAllShipsAdded.every((isAdded) => isAdded);

  if (readyToStart) {
    game.boards.map((board) => {
      const startGameMessage: string = messageCreator({
        type: WebSocketMessageType.START_GAME,
        data: {
          ships: board.ships,
          currentPlayerIndex: board.indexPlayer,
        },
      });

      game.currentPlayerIndex = indexPlayer;

      const turnMessage: string = messageCreator({
        type: WebSocketMessageType.TURN,
        data: {
          currentPlayer: indexPlayer,
        },
      });
      connections[board.indexPlayer].send(startGameMessage);
      connections[board.indexPlayer].send(turnMessage);
    });
  }
};

const handleAttack = (request: AttackRequest) => {
  const { gameId, indexPlayer, x, y } = request;
  const game = store.gameById(gameId);
  if (!game) throw new Error("Game not found");
  if (game.currentPlayerIndex !== indexPlayer) throw new Error("Not your turn");

  let attackResult: AttackStatus = AttackStatusEnum.MISS;
  let opponentIndex: number;

  game.boards.map((board) => {
    if (board.indexPlayer !== indexPlayer) opponentIndex = board.indexPlayer;
    if (board.indexPlayer === indexPlayer) {
      if (board.enemyField[y][x] === -1 || board.enemyField[y][x] === -2)
        throw new Error("Already checked this cell");

      if (board.enemyField[y][x] === 1) {
        board.enemyField[y][x] = -1;
        // Check if the ship is completely destroyed
        const shipLength = getShipLength(board.enemyField, x, y);
        const isDestroyed = isShipDestroyed(board.enemyField, x, y, shipLength);
        attackResult = isDestroyed
          ? AttackStatusEnum.KILLED
          : AttackStatusEnum.SHOT;
      }
    }
  });

  game.boards.map((board) => {
    const attackResultMessage = messageCreator({
      type: WebSocketMessageType.ATTACK,
      data: {
        currentPlayer: indexPlayer,
        status: attackResult,
        position: { x, y },
      },
    });

    if (attackResult === AttackStatusEnum.MISS) {
      if (board.indexPlayer === indexPlayer) board.enemyField[y][x] = -2;

      game.currentPlayerIndex = opponentIndex;
    } else {
      game.currentPlayerIndex = indexPlayer;
    }

    const turnMessage: string = messageCreator({
      type: WebSocketMessageType.TURN,
      data: {
        currentPlayer: game.currentPlayerIndex,
      },
    });
    connections[board.indexPlayer].send(attackResultMessage);
    connections[board.indexPlayer].send(turnMessage);
  });
};

const createEnemyFieldBasedOnShips = (ships: Ship[]): Field => {
  const field: Field = createField();
  ships.map((ship) => {
    const {
      position: { x, y },
      direction: vertical,
      length,
    } = ship;
    if (vertical) {
      for (let i = 0; i < length; i++) {
        field[y + i][x] = 1;
      }
    } else {
      for (let i = 0; i < length; i++) {
        field[y][x + i] = 1;
      }
    }
  });
  return [...field];
};

const createField = (): Field => {
  const field: Field = [];
  for (let i = 0; i < 10; i++) {
    field[i] = [];
    for (let j = 0; j < 10; j++) {
      field[i][j] = 0;
    }
  }
  return field;
};

const isShipDestroyed = (
  field: Field,
  x: number,
  y: number,
  length: number
): boolean => {
  for (let i = 0; i < length; i++) {
    if (field[y][x + i] !== -1 && field[y + i][x] !== -1) {
      return false;
    }
  }
  return true;
};

const getShipLength = (field: Field, x: number, y: number): number => {
  let length = 1;
  for (let i = x - 1; i >= 0 && field[y][i] === 1; i--) {
    length++;
  }
  for (let i = x + 1; i < 10 && field[y][i] === 1; i++) {
    length++;
  }
  for (let i = y - 1; i >= 0 && field[i][x] === 1; i--) {
    length++;
  }
  for (let i = y + 1; i < 10 && field[i][x] === 1; i++) {
    length++;
  }

  return length;
};
