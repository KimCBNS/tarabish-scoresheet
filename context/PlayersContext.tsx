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

type PlayersContextType = {
  players: string[];
  setPlayers: (players: string[]) => void;
  teams: Team[];
  setTeams: (teams: Team[]) => void;
  seating: SeatingSetup | null;
  setSeating: (seating: SeatingSetup) => void;
};

const PlayersContext = createContext<PlayersContextType | null>(null);

export function PlayersProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<string[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [seating, setSeating] = useState<SeatingSetup | null>(null);

  return (
    <PlayersContext.Provider value={{ players, setPlayers, teams, setTeams, seating, setSeating }}>
      {children}
    </PlayersContext.Provider>
  );
}

export function usePlayers() {
  const ctx = useContext(PlayersContext);
  if (!ctx) throw new Error('usePlayers must be used inside PlayersProvider');
  return ctx;
}
