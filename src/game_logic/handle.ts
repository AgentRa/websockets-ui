import {
  AddShipsRequest,
  AddUserToRoomRequest,
  AttackRequest,
  AttackStatus,
  AttackStatusEnum,
  Field,
  Position,
  RandomAttackRequest,
  RegistrationDataRequest,
  Ship,
  ShipInfo,
  WebSocketConnection,
  WebSocketMessageType,
} from "../types";
import { store } from "../store/store";
import { messageCreator, responseForAll } from "../utils";

const registration = (
  request: RegistrationDataRequest,
  ws: WebSocketConnection
): void => {
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
  responseForAll(updateRoomAndWinnersMessages, store.connections);
};

const createRoom = (ws: WebSocketConnection): void => {
  store.createRoom({ name: ws.name, index: ws.index });

  const updateRoomMessage: string[] = messageCreator([
    {
      type: WebSocketMessageType.UPDATE_ROOM,
      data: store.availableRooms,
    },
  ]);

  responseForAll(updateRoomMessage, store.connections);
};

const addUserToRoom = (
  request: AddUserToRoomRequest,
  ws: WebSocketConnection
): void => {
  store.joinRoom({ name: ws.name, index: ws.index }, request.indexRoom);

  const updateRoomMessage: string[] = messageCreator([
    {
      type: WebSocketMessageType.UPDATE_ROOM,
      data: store.availableRooms,
    },
  ]);

  responseForAll(updateRoomMessage, store.connections);

  const { gameId, boards } = store.createGame(request.indexRoom);

  boards.map((board) => {
    const message: string = messageCreator({
      type: WebSocketMessageType.CREATE_GAME,
      data: {
        idGame: gameId,
        idPlayer: board.indexPlayer,
      },
    });
    store.connections[board.indexPlayer].send(message);
  });
};

const addShips = (request: AddShipsRequest): void => {
  const { gameId, indexPlayer, ships } = request;
  const game = store.gameById(gameId);
  if (!game) throw new Error("Game not found");

  const enemyShips: ShipInfo[] = [];

  game.boards.map((board) => {
    if (board.indexPlayer === indexPlayer) {
      ships.map((ship: Ship): void => {
        const {
          position: { x, y },
          direction: vertical,
          length,
        } = ship;
        const coordinates: Position[] = [];
        const damagedCoordinates: Position[] = [];

        if (vertical) {
          for (let i = 0; i < length; i++) {
            coordinates.push({ x, y: y + i });
          }
        } else {
          for (let i = 0; i < length; i++) {
            coordinates.push({ x: x + i, y });
          }
        }

        const aroundShipCoordinatesSet = new Set<string>();

        for (let i = 0; i < length; i++) {
          const xPos = vertical ? x : x + i;
          const yPos = vertical ? y + i : y;

          for (let row = yPos - 1; row <= yPos + 1; row++) {
            for (let col = xPos - 1; col <= xPos + 1; col++) {
              if (
                row >= 0 &&
                row < 10 &&
                col >= 0 &&
                col < 10 &&
                (row !== yPos || col !== xPos) &&
                !coordinates.some(
                  (coordinate) => coordinate.x === col && coordinate.y === row
                )
              ) {
                const positionString = `${col},${row}`;
                aroundShipCoordinatesSet.add(positionString);
              }
            }
          }
        }

        const aroundCoordinates: Position[] = Array.from(
          aroundShipCoordinatesSet
        ).map((positionString) => {
          const [xStr, yStr] = positionString.split(",");
          return { x: parseInt(xStr), y: parseInt(yStr) };
        });

        enemyShips.push({
          coordinates,
          damagedCoordinates,
          aroundCoordinates,
        });
      });
      board.ships = ships;
      game.isAllShipsAdded.shift();
      game.isAllShipsAdded.push(true);
    } else {
      board.enemyShips = enemyShips;
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
      store.connections[board.indexPlayer].send(startGameMessage);
      store.connections[board.indexPlayer].send(turnMessage);
    });
  }
};

const attack = (request: AttackRequest | RandomAttackRequest): void => {
  let gameId: number, indexPlayer: number, x: number, y: number;
  if ("x" in request && "y" in request) {
    gameId = request.gameId;
    indexPlayer = request.indexPlayer;
    x = request.x;
    y = request.y;
  } else {
    gameId = request.gameId;
    indexPlayer = request.indexPlayer;
  }

  const game = store.gameById(gameId);
  if (!game) throw new Error("Game not found");
  if (game.currentPlayerIndex !== indexPlayer) throw new Error("Not your turn");

  let attackResult: AttackStatus = AttackStatusEnum.MISS;
  let opponentIndex: number;
  let shipToRemove: ShipInfo;
  let finishMessage: string;

  game.boards.map((board) => {
    if (board.indexPlayer !== indexPlayer) opponentIndex = board.indexPlayer;
    if (board.indexPlayer === indexPlayer) {
      if (x === undefined || y === undefined) {
        const randomAvailablePosition = generateRandomPosition(
          board.enemyField
        );
        x = randomAvailablePosition.x;
        y = randomAvailablePosition.y;
      }
      if (!board.enemyField[y][x])
        throw new Error("Already attacked this cell");

      if (board.enemyField[y][x]) {
        board.enemyField[y][x] = false;

        const shipIndex = board.enemyShips.findIndex((ship) => {
          const isHit = ship.coordinates.find(
            (position: Position) => position.x === x && position.y === y
          );
          if (isHit) {
            ship.damagedCoordinates.push({ x, y });
            attackResult =
              ship.coordinates.length === ship.damagedCoordinates.length
                ? AttackStatusEnum.KILLED
                : AttackStatusEnum.SHOT;
          }
          return attackResult === AttackStatusEnum.KILLED;
        });

        if (shipIndex !== -1)
          shipToRemove = board.enemyShips.splice(shipIndex, 1)[0];
        if (board.enemyShips.length === 0) {
          finishMessage = messageCreator({
            type: WebSocketMessageType.FINISH,
            data: {
              winPlayer: indexPlayer,
            },
          });
        }
      }
    }
  });

  game.boards.map((board) => {
    game.currentPlayerIndex =
      attackResult === AttackStatusEnum.MISS ? opponentIndex : indexPlayer;

    const attackResultMessage = messageCreator({
      type: WebSocketMessageType.ATTACK,
      data: {
        currentPlayer: indexPlayer,
        status: attackResult,
        position: { x, y },
      },
    });

    const turnMessage: string = messageCreator({
      type: WebSocketMessageType.TURN,
      data: {
        currentPlayer: game.currentPlayerIndex,
      },
    });

    store.connections[board.indexPlayer].send(attackResultMessage);

    if (shipToRemove) {
      shipToRemove.aroundCoordinates.map((position) => {
        const messageStateAroundShip: string = messageCreator({
          type: WebSocketMessageType.ATTACK,
          data: {
            currentPlayer: indexPlayer,
            status: AttackStatusEnum.MISS,
            position,
          },
        });
        store.connections[board.indexPlayer].send(messageStateAroundShip);
      });
    }

    store.connections[board.indexPlayer].send(turnMessage);
    if (finishMessage) {
      store.connections[board.indexPlayer].send(finishMessage);
      const player = store.playerById(indexPlayer);
      if (player && board.indexPlayer === indexPlayer) {
        store.deleteRoom(indexPlayer);
        store.winner = player;
      }
    }
  });
};

const generateRandomPosition = (field: Field): Position => {
  let x: number, y: number;
  do {
    x = Math.floor(Math.random() * 10);
    y = Math.floor(Math.random() * 10);
  } while (!field[y][x]);
  return { x, y };
};

export { attack, addShips, addUserToRoom, createRoom, registration };
