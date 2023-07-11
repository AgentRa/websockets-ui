import {
  Board,
  Game,
  Player,
  RegistrationDataResponse,
  Room,
  Winner,
} from "../types";

class Store {
  private readonly _players: Player[];
  private readonly _rooms: Room[];
  private readonly _winners: Winner[];
  private readonly _games: Game[];

  constructor() {
    this._players = [];
    this._rooms = [];
    this._winners = [];
    this._games = [];
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

  createGame(roomId: number): Game {
    const room = this._rooms.find((r) => r.roomId === roomId);

    if (!room) throw new Error("Room not found");

    this._games.push({
      gameId: roomId,
      boards: room.roomUsers.map(
        ({ index }: Player): Board => ({
          indexPlayer: index,
          ships: [],
          enemyField: [],
        })
      ),
      isAllShipsAdded: [false, false],
      currentPlayerIndex: 0,
    });

    return this._games[this._games.length - 1];
  }

  get players(): Player[] {
    return this._players;
  }

  get rooms(): Room[] {
    return this._rooms;
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
}

export const store = new Store();
