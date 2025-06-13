export enum League {
  LaLiga = 0,
  PremierLeague = 1,
  SerieA = 2
}

export enum Result {
  NotSet = 0,
  TeamAWin = 1,
  TeamBWin = 2,
  Draw = 3
}

export interface Match {
  id: number;
  league: League;
  teamA: string;
  teamB: string;
  goalsA: number;
  goalsB: number;
  result: Result;
  startTime: number;
  played: boolean;
}

export interface Bet {
  id?: number;
  matchIds: number[];
  predictions: Result[];
  bettor: string;
  amount: number;
  claimed: boolean;
}

export interface BetData {
  matchIds: number[];
  predictions: Result[];
  amount: number;
}