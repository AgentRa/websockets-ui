import { Player, RegistrationDataResponse, Room, Winner } from "../types";

class Store {
  private readonly _players: Player[];
  private readonly _rooms: Room[];
  private readonly _winners: Winner[];

  constructor() {
    this._players = [];
    this._rooms = [];
    this._winners = [];
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
    this._rooms.push({
      roomId: this._rooms.length,
      roomUsers: [{ name, index }],
    });
  }

  joinRoom({ name, index }: Player, roomId: number): void {
    const room = this._rooms.find((r) => r.roomId === roomId);
    if (room) room.roomUsers.push({ name, index });
  }

  get players(): Player[] {
    return this._players;
  }

  get rooms(): Room[] {
    return this._rooms.filter((room) => room.roomUsers.length === 1);
  }

  get winners(): Winner[] {
    return this._winners;
  }
}

export const store = new Store();
