import { createContext, useContext, useState, ReactNode } from 'react';

type PlayersContextType = {
  players: string[];
  setPlayers: (players: string[]) => void;
};

const PlayersContext = createContext<PlayersContextType | null>(null);

export function PlayersProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<string[]>([]);
  return (
    <PlayersContext.Provider value={{ players, setPlayers }}>
      {children}
    </PlayersContext.Provider>
  );
}

export function usePlayers() {
  const ctx = useContext(PlayersContext);
  if (!ctx) throw new Error('usePlayers must be used inside PlayersProvider');
  return ctx;
}
