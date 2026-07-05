import { createContext, useContext, useState, ReactNode } from 'react';

export type Team = {
  name: string;
  members: string[];
};

export type SeatingSetup = {
  scorekeeperId: string;
  seatOrder: string[];    // [bottom, left, top, right] — player names in fixed seat order
  dealerId: string | null;
  usTeamId: string;
  themTeamId: string;
};

export type HouseRules = {
  forceDeal: boolean;
  halfBaitIsWholeBait: boolean;
  noTrumpAllowed: boolean;
};

// Tags that can be attached to a hand. run20/run50 may appear twice (one per run declared).
export type HandTag = 'run20' | 'run50' | 'bella' | 'bait' | 'noTrump';

export type Hand = {
  id: string;
  dealerId: string;         // player name of the dealer for this hand
  passed: boolean;
  usScore: number;
  themScore: number;
  tags: HandTag[];
  countedTeamId: string;   // which team counted up — drives tag placement in the ledger display
  baitTeamId: string | null;
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
  setDealerId: (id: string) => void;
  houseRules: HouseRules;
  setHouseRules: (rules: HouseRules) => void;
  // ── Match state ──────────────────────────────────────────────────────
  hands: Hand[];
  addHand: (hand: Omit<Hand, 'id'>) => void;
  undoLastHand: () => void;
  // currentDealerIndex is an index into seating.seatOrder, wrapping clockwise.
  currentDealerIndex: number;
  advanceDealer: () => void;
  matchWinner: 'us' | 'them' | null;
};

const PlayersContext = createContext<PlayersContextType | null>(null);

export function PlayersProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<string[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [seating, setSeatingState] = useState<SeatingSetup | null>(null);
  const [houseRules, setHouseRules] = useState<HouseRules>(DEFAULT_HOUSE_RULES);
  const [hands, setHands] = useState<Hand[]>([]);
  const [currentDealerIndex, setCurrentDealerIndex] = useState(0);
  const [matchWinner, setMatchWinner] = useState<'us' | 'them' | null>(null);

  function setSeating(s: SeatingSetup) {
    setSeatingState(s);
  }

  // Patches dealerId AND seeds currentDealerIndex to that player's seat position,
  // so dealer rotation starts from the correct seat after the cut for deal.
  function setDealerId(id: string) {
    setSeatingState(prev => {
      if (!prev) return prev;
      const idx = prev.seatOrder.indexOf(id);
      if (idx !== -1) setCurrentDealerIndex(idx);
      return { ...prev, dealerId: id };
    });
  }

  // Sums usScore/themScore across a hands array and, if either side has
  // reached 500, returns the winner ('us' by convention on an exact tie).
  function computeWinner(list: Hand[]): 'us' | 'them' | null {
    let usTotal = 0;
    let themTotal = 0;
    for (const h of list) {
      usTotal += h.usScore;
      themTotal += h.themScore;
    }
    if (usTotal < 500 && themTotal < 500) return null;
    return themTotal > usTotal ? 'them' : 'us';
  }

  function addHand(hand: Omit<Hand, 'id'>) {
    setHands(prev => {
      const next = [...prev, { ...hand, id: Date.now().toString() }];
      setMatchWinner(computeWinner(next));
      return next;
    });
  }

  // Removes the most recently added hand (dealt or passed) and reverses the
  // dealer advance that hand caused. No-op when there's nothing to undo.
  function undoLastHand() {
    if (hands.length === 0) return;
    const next = hands.slice(0, -1);
    setHands(next);
    setMatchWinner(computeWinner(next));
    const len = seating?.seatOrder.length ?? 4;
    setCurrentDealerIndex(prev => (prev - 1 + len) % len);
  }

  // Moves deal one seat clockwise. Called after every hand (dealt or passed).
  function advanceDealer() {
    const len = seating?.seatOrder.length ?? 4;
    setCurrentDealerIndex(prev => (prev + 1) % len);
  }

  return (
    <PlayersContext.Provider
      value={{
        players, setPlayers,
        teams, setTeams,
        seating, setSeating,
        setDealerId,
        houseRules, setHouseRules,
        hands, addHand, undoLastHand,
        currentDealerIndex, advanceDealer,
        matchWinner,
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
