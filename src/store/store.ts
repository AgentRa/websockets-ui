import {
  Player,
  RegistrationDataRequest,
  RegistrationDataResponse,
  Room,
  Winner,
} from "../types";

class Store {
  private readonly _players: Player[];
  private readonly _rooms: Room[];
  private readonly _winners: Winner[];

  constructor() {
    this._players = [];
    this._rooms = [];
    this._winners = [];
  }

  registerPlayer(
    player: RegistrationDataRequest,
    index: number
  ): RegistrationDataResponse {
    const isPlayerExist = this.players.find((p) => p.name === player.name);
    if (isPlayerExist) {
      return {
        name: player.name,
        index: index,
        error: true,
        errorText: "Player already exist, pick another name",
      };
    } else {
      this._players.push({ name: player.name, index: index });
      return {
        name: player.name,
        index: index,
        error: false,
        errorText: "",
      };
    }
  }

  createRoom() {
    console.log("createRoom");
    return "createRoom";
  }

  get players(): Player[] {
    return this._players;
  }

  get rooms(): Room[] {
    return this._rooms;
  }

  get winners(): Winner[] {
    return this._winners;
  }
}

export const store = new Store();
