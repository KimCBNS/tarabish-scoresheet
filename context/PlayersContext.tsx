import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/theme';

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

// A completed (or early-ended) game, archived when "Start Next Game" or "End
// this game early" is pressed. Stores the full hands array (and the team
// names at the time) so /gamedetail can reconstruct a read-only ledger for
// that game without needing the live teams/seating state.
// winner is null for a game that was ended early with no one at 500+.
export type GameHistoryEntry = {
  id: string;
  hands: Hand[];
  usTeamNames: string[];
  themTeamNames: string[];
  usScore: number;
  themScore: number;
  winner: 'us' | 'them' | null;
};

const DEFAULT_HOUSE_RULES: HouseRules = {
  forceDeal: true,
  halfBaitIsWholeBait: true,
  noTrumpAllowed: true,
};

// Everything that should survive a force-quit / phone restart, saved as one
// JSON blob under this key. See the load/save effects below.
const STORAGE_KEY = 'tarabish_game_state';

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
  // ── Game state ───────────────────────────────────────────────────────
  hands: Hand[];
  addHand: (hand: Omit<Hand, 'id'>) => void;
  undoLastHand: () => void;
  // currentDealerIndex is an index into seating.seatOrder, wrapping clockwise.
  currentDealerIndex: number;
  advanceDealer: () => void;
  gameWinner: 'us' | 'them' | null;
  // ── Game night state ─────────────────────────────────────────────────
  gameHistory: GameHistoryEntry[];
  // Archives the just-finished game into gameHistory, then resets hands/gameWinner
  // for the next game. Teams, players and houseRules are left untouched — the
  // seating screen is where the table gets reconfirmed before the next game.
  startNextGame: () => void;
  // Archives the current, unfinished game (winner: null) then resets hands/gameWinner.
  // Called from "End this game early".
  endGameEarly: () => void;
  // First-hand-of-the-night timestamp — set once, kept across games, cleared by resetAll.
  nightStartTime: Date | null;
  // Wipes everything back to initial state (and clears persisted storage) — used by "End the Night".
  resetAll: () => void;
};

const PlayersContext = createContext<PlayersContextType | null>(null);

export function PlayersProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<string[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [seating, setSeatingState] = useState<SeatingSetup | null>(null);
  const [houseRules, setHouseRules] = useState<HouseRules>(DEFAULT_HOUSE_RULES);
  const [hands, setHands] = useState<Hand[]>([]);
  const [currentDealerIndex, setCurrentDealerIndex] = useState(0);
  const [gameWinner, setGameWinner] = useState<'us' | 'them' | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);
  const [nightStartTime, setNightStartTime] = useState<Date | null>(null);

  // True until the initial AsyncStorage read finishes. Blocks rendering
  // {children} so the app never briefly shows a fresh/empty state before a
  // saved game has had a chance to load.
  const [isLoading, setIsLoading] = useState(true);

  // ── Load persisted state once on launch ─────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          setPlayers(saved.players ?? []);
          setTeams(saved.teams ?? []);
          setSeatingState(saved.seating ?? null);
          setHouseRules(saved.houseRules ?? DEFAULT_HOUSE_RULES);
          setHands(saved.hands ?? []);
          setGameWinner(saved.gameWinner ?? null);
          setCurrentDealerIndex(saved.currentDealerIndex ?? 0);
          setGameHistory(saved.gameHistory ?? []);
          // Dates don't survive JSON — they come back as ISO strings.
          setNightStartTime(saved.nightStartTime ? new Date(saved.nightStartTime) : null);
        }
      } catch {
        // silent fail — corrupt/unreadable storage just means a fresh start
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // ── Save persisted state on every change, once the initial load is done ──
  // (Skipping while isLoading avoids briefly overwriting the saved data with
  // the provider's default/empty state before it's had a chance to load.)
  useEffect(() => {
    if (isLoading) return;
    async function save() {
      try {
        const state = {
          players, teams, seating, houseRules,
          hands, gameWinner, currentDealerIndex,
          gameHistory, nightStartTime,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // silent fail — don't crash the app if storage fails
      }
    }
    save();
  }, [isLoading, players, teams, seating, houseRules, hands, gameWinner, currentDealerIndex, gameHistory, nightStartTime]);

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
    // First hand of the whole night starts the clock; later games don't reset it.
    setNightStartTime(prev => prev ?? new Date());
    setHands(prev => {
      const next = [...prev, { ...hand, id: Date.now().toString() }];
      setGameWinner(computeWinner(next));
      return next;
    });
  }

  // Removes the most recently added hand (dealt or passed) and reverses the
  // dealer advance that hand caused. No-op when there's nothing to undo.
  function undoLastHand() {
    if (hands.length === 0) return;
    const next = hands.slice(0, -1);
    setHands(next);
    setGameWinner(computeWinner(next));
    const len = seating?.seatOrder.length ?? 4;
    setCurrentDealerIndex(prev => (prev - 1 + len) % len);
  }

  // Moves deal one seat clockwise. Called after every hand (dealt or passed).
  function advanceDealer() {
    const len = seating?.seatOrder.length ?? 4;
    setCurrentDealerIndex(prev => (prev + 1) % len);
  }

  // Builds a GameHistoryEntry from the current hands/teams/seating and appends
  // it to gameHistory. Shared by startNextGame (winner already decided) and
  // endGameEarly (winner: null — nobody reached 500).
  function archiveCurrentGame(winner: 'us' | 'them' | null) {
    if (!seating) return;
    const usTeam = teams.find(t => t.name === seating.usTeamId);
    const themTeam = teams.find(t => t.name === seating.themTeamId);
    let usScore = 0;
    let themScore = 0;
    for (const h of hands) {
      usScore += h.usScore;
      themScore += h.themScore;
    }
    const entry: GameHistoryEntry = {
      id: Date.now().toString(),
      hands,
      usTeamNames: usTeam?.members ?? [],
      themTeamNames: themTeam?.members ?? [],
      usScore,
      themScore,
      winner,
    };
    setGameHistory(prev => [...prev, entry]);
  }

  // Archives the completed game (with its full hand history) into gameHistory,
  // then clears hands/gameWinner so a new game can begin. Called from the
  // winner banner's "Start Next Game" button, right before navigating to
  // /seating to reconfirm the table.
  function startNextGame() {
    if (gameWinner) archiveCurrentGame(gameWinner);
    setHands([]);
    setGameWinner(null);
  }

  // Archives the current, unfinished game with winner: null, then clears
  // hands/gameWinner. Called from "End this game early".
  function endGameEarly() {
    archiveCurrentGame(null);
    setHands([]);
    setGameWinner(null);
  }

  // "End the Night" — clears the persisted save and wipes every piece of
  // state back to its initial value.
  function resetAll() {
    setPlayers([]);
    setTeams([]);
    setSeatingState(null);
    setHouseRules(DEFAULT_HOUSE_RULES);
    setHands([]);
    setCurrentDealerIndex(0);
    setGameWinner(null);
    setGameHistory([]);
    setNightStartTime(null);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {
      // silent fail — nothing to do if storage can't be cleared
    });
  }

  if (isLoading) {
    return <View style={styles.loadingScreen} />;
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
        gameWinner,
        gameHistory, startNextGame, endGameEarly,
        nightStartTime,
        resetAll,
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

const styles = StyleSheet.create({
  loadingScreen: { flex: 1, backgroundColor: Colors.cream },
});
