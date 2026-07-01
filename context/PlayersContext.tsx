import { createContext, useContext, useState, ReactNode } from 'react';

export type Team = {
  name: string;    // "Team A", "Team B", etc.
  members: string[]; // player names
};

export type SeatingSetup = {
  scorekeeperId: string;  // player who tapped their own name in Screen 4
  seatOrder: string[];    // [bottom, left, top, right] — player names in fixed seat order
  dealerId: string | null; // set by the cut-for-deal screen; null until then
  usTeamId: string;       // name of the team the scorekeeper belongs to ("Team A" or "Team B")
  themTeamId: string;     // the other team's name
};

export type HouseRules = {
  forceDeal: boolean;           // if everyone passes, dealer must call trump
  halfBaitIsWholeBait: boolean; // calling team goes bait → full pool to other team
  noTrumpAllowed: boolean;      // players may call no trump (pool drops to 130 pts)
};

const DEFAULT_HOUSE_RULES: HouseRules = {
  forceDeal: true,
  halfBaitIsWholeBait: true,
  noTrumpAllowed: true,
};

type PlayersContextType = {
  players: string[];
  setPlayers: (players: string[]) => void;
  teams: Team[];
  setTeams: (teams: Team[]) => void;
  seating: SeatingSetup | null;
  setSeating: (seating: SeatingSetup) => void;
  setDealerId: (id: string) => void; // patches seating.dealerId without touching other fields
  houseRules: HouseRules;
  setHouseRules: (rules: HouseRules) => void;
};

const PlayersContext = createContext<PlayersContextType | null>(null);

export function PlayersProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<string[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [seating, setSeatingState] = useState<SeatingSetup | null>(null);
  const [houseRules, setHouseRules] = useState<HouseRules>(DEFAULT_HOUSE_RULES);

  function setSeating(s: SeatingSetup) {
    setSeatingState(s);
  }

  function setDealerId(id: string) {
    setSeatingState(prev => (prev ? { ...prev, dealerId: id } : prev));
  }

  return (
    <PlayersContext.Provider
      value={{
        players, setPlayers,
        teams, setTeams,
        seating, setSeating,
        setDealerId,
        houseRules, setHouseRules,
      }}>
      {children}
    </PlayersContext.Provider>
  );
}

export function usePlayers() {
  const ctx = useContext(PlayersContext);
  if (!ctx) throw new Error('usePlayers must be used inside PlayersProvider');
  return ctx;
}
