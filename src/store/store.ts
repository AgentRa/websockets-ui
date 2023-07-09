import { Player, RegistrationDataResponse } from "../types";

class Store {
  public _players: Player[];

  constructor() {
    this._players = [];
  }

  registerPlayer(player: Player): RegistrationDataResponse {
    const isPlayerExist = this._players.find(
      (p) => p.name === player.name && p.password === player.password
    );
    if (isPlayerExist) {
      return {
        name: player.name,
        password: player.password,
        error: true,
        errorText: "Player already exist",
      };
    } else {
      this._players.push(player);
      return {
        name: player.name,
        password: player.password,
        error: false,
        errorText: "",
      };
    }
  }
}

export const store = new Store();
