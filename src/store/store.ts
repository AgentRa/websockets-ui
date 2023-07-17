import {
  Board,
  Game,
  Player,
  RegistrationDataResponse,
  Room,
  WebSocketConnection,
  Winner,
} from "../types";

class Store {
  private readonly _players: Player[];
  private readonly _rooms: Room[];
  private readonly _winners: Winner[];
  private readonly _games: Game[];
  private readonly _connections: WebSocketConnection[];

  constructor() {
    this._players = [];
    this._rooms = [];
    this._winners = [];
    this._games = [];
    this._connections = [];
  }

  registerPlayer(name: string, index: number): RegistrationDataResponse {
    const isPlayerExist = this.players.find((p) => p.name === name);
    if (isPlayerExist) {
      return {
        name,
        index,
        error: true,
        errorText: "Player already exist, pick another name",
      };
    } else {
      this._players.push({ name, index });
      return {
        name,
        index,
        error: false,
        errorText: "",
      };
    }
  }

  createRoom({ name, index }: Player): void {
    const isAlreadyIn = this.roomById(index)?.roomUsers.find(
      (p) => p.name === name
    );
    if (isAlreadyIn) throw new Error("Player already in room");

    this._rooms.push({
      roomId: index,
      roomUsers: [{ name, index }],
    });
  }

  joinRoom({ name, index }: Player, roomId: number): void {
    const room = this._rooms.find((r) => r.roomId === roomId);
    if (!room) throw new Error("Room not found");

    const isAlreadyIn = room.roomUsers.find((p) => p.name === name);
    if (isAlreadyIn) throw new Error("Player already in room");

    room.roomUsers.push({ name, index });
  }

  deleteRoom(roomId: number): void {
    this._rooms.filter((r) => r.roomId !== roomId);
  }

  createGame(roomId: number): Game {
    const room = this._rooms.find((r) => r.roomId === roomId);

    if (!room) throw new Error("Room not found");

    this._games.push({
      gameId: roomId,
      boards: room.roomUsers.map(
        ({ index }: Player): Board => ({
          indexPlayer: index,
          ships: [],
          enemyShips: [],
          enemyField: Array.from({ length: 10 }, () => Array(10).fill(true)),
        })
      ),
      isAllShipsAdded: [false, false],
      currentPlayerIndex: 0,
    });

    return this._games[this._games.length - 1];
  }

  removePlayer(index: number): void {
    const playerIndex = this._players.findIndex((p) => p.index === index);
    if (playerIndex === -1) throw new Error("Player not found");

    this._players.splice(playerIndex, 1);
  }

  removeRoom(index: number): void {
    const roomIndex = this._rooms.findIndex((room) =>
      room.roomUsers.find((p) => p.index === index)
    );
    if (roomIndex === -1) throw new Error("Room not found");

    this._rooms.splice(roomIndex, 1);
  }

  get players(): Player[] {
    return this._players;
  }

  get playerById(): (playerId: number) => Player | undefined {
    return (playerId: number) =>
      this._players.find((p) => p.index === playerId);
  }

  get roomById(): (roomId: number) => Room | undefined {
    return (roomId: number) => this._rooms.find((r) => r.roomId === roomId);
  }

  get gameById(): (gameId: number) => Game | undefined {
    return (gameId: number) => this._games.find((g) => g.gameId === gameId);
  }

  get availableRooms(): Room[] {
    return this._rooms.filter((room) => room.roomUsers.length === 1);
  }

  get winners(): Winner[] {
    return this._winners;
  }
  addWinner(player: Player) {
    const winnerIndex = this._winners.findIndex((w) => w.name === player.name);
    if (winnerIndex === -1) {
      this._winners.push({ name: player.name, wins: 1 });
    } else {
      this._winners[winnerIndex].wins += 1;
    }
  }

  get connections(): WebSocketConnection[] {
    return this._connections;
  }

  removeConnection(index: number): void {
    const connectionIndex = this._connections.findIndex(
      (c) => c.index === index
    );
    if (connectionIndex === -1) throw new Error("Connection not found");

    this._connections.splice(connectionIndex, 1);
  }

  addConnection(connection: WebSocketConnection): void {
    connection.index = store.connections.length;
    this._connections.push(connection);
  }
}

export const store = new Store();
