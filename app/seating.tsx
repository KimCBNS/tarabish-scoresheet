import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { usePlayers, type Team } from '@/context/PlayersContext';

// ─── Seat derivation ────────────────────────────────────────────────────────
// Given the scorekeeper (bottom) and their left-hand neighbour, we derive
// the full clockwise table order:
//
//   bottom = scorekeeper         (they picked themselves in Step 1)
//   left   = left-hand neighbour (they picked in Step 2)
//   top    = scorekeeper's partner, who always sits directly opposite
//   right  = the one remaining player (only possibility left)
//
type SeatLayout = {
  bottom: string;
  left: string;
  top: string | null;   // null only if teams were not fully assigned
  right: string | null; // null only if teams were not fully assigned
};

function deriveSeatLayout(
  scorekeeperId: string,
  leftId: string,
  players: string[],
  teams: Team[]
): SeatLayout {
  const scorekeeperTeam = teams.find(t => t.members.includes(scorekeeperId));
  const partner = scorekeeperTeam?.members.find(m => m !== scorekeeperId) ?? null;
  const right = players.find(p => p !== scorekeeperId && p !== leftId && p !== partner) ?? null;
  return { bottom: scorekeeperId, left: leftId, top: partner, right };
}

// ─── Seat label ──────────────────────────────────────────────────────────────
function SeatLabel({
  name,
  isScorekeeper = false,
}: {
  name: string | null;
  isScorekeeper?: boolean;
}) {
  if (!name) return null;
  return (
    <View style={styles.seatLabelContainer}>
      <Text
        style={[styles.seatLabelName, isScorekeeper && styles.seatLabelNameBold]}
        numberOfLines={1}>
        {name}
      </Text>
      {isScorekeeper && (
        <Text style={styles.seatLabelSubtitleGreen}>(marking score)</Text>
      )}
    </View>
  );
}

// ─── Table diagram ──────────────────────────────────────────────────────────
// Shaded container with a felt circle inside. Seat labels sit at the four
// compass points around the circle using a flex column layout:
//   top label → middle row (left label | circle | right label) → bottom label
//
function TableDiagram({ layout }: { layout: SeatLayout }) {
  return (
    <View style={styles.tableContainer}>
      {/* Top seat — scorekeeper's partner, sits directly opposite */}
      <View style={styles.seatTopBottom}>
        <SeatLabel name={layout.top} />
      </View>

      {/* Middle row: left label | circle | right label */}
      <View style={styles.tableMiddleRow}>
        <View style={styles.seatSide}>
          <SeatLabel name={layout.left} />
        </View>

        <View style={styles.tableCircle} />

        <View style={styles.seatSide}>
          <SeatLabel name={layout.right} />
        </View>
      </View>

      {/* Bottom seat — always the scorekeeper */}
      <View style={styles.seatTopBottom}>
        <SeatLabel name={layout.bottom} isScorekeeper />
      </View>

      <Text style={styles.clockwise}>↻ play moves clockwise</Text>
    </View>
  );
}

// ─── Screen ─────────────────────────────────────────────────────────────────
export default function SeatingScreen() {
  const { players, teams, setSeating } = usePlayers();

  const [scorekeeperId, setScorekeeper] = useState<string | null>(null);
  // Confirmed once the intended scorekeeper taps the handoff button, ensuring
  // the right person is holding the phone before asking personal seating questions.
  const [scorekeeperConfirmed, setScorekeeperConfirmed] = useState(false);
  const [leftId, setLeftId] = useState<string | null>(null);

  // Partners always sit opposite — only opponents can sit to
  // the scorekeeper's left or right
  const opponents = scorekeeperId
    ? teams.filter(t => !t.members.includes(scorekeeperId)).flatMap(t => t.members)
    : [];

  const seatLayout =
    scorekeeperId && leftId
      ? deriveSeatLayout(scorekeeperId, leftId, players, teams)
      : null;

  const canConfirm = seatLayout?.top != null && seatLayout?.right != null;

  function handleConfirm() {
    if (!canConfirm || !seatLayout || !scorekeeperId) return;

    const usTeam = teams.find(t => t.members.includes(scorekeeperId));
    const themTeam = teams.find(t => !t.members.includes(scorekeeperId));

    setSeating({
      scorekeeperId,
      seatOrder: [seatLayout.bottom, seatLayout.left, seatLayout.top!, seatLayout.right!],
      dealerId: null,
      usTeamId: usTeam?.name ?? '',
      themTeamId: themTeam?.name ?? '',
    });

    router.push('/rules');
  }

  function handleStartOver() {
    setScorekeeper(null);
    setScorekeeperConfirmed(false);
    setLeftId(null);
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Set up the table</Text>

      {/* ── Step 1: Who's marking score? ──────────────────────────────── */}
      <View style={styles.step}>
        <Text style={styles.stepQuestion}>Who's marking score tonight?</Text>
        <View style={styles.chipRow}>
          {players.map(name => (
            <TouchableOpacity
              key={name}
              style={[styles.chip, scorekeeperId === name && styles.chipSelected]}
              onPress={() => {
                if (scorekeeperId === name) return;
                setScorekeeper(name);
                setScorekeeperConfirmed(false);
                setLeftId(null);
              }}
              activeOpacity={0.7}>
              <Text style={[styles.chipText, scorekeeperId === name && styles.chipTextSelected]}>
                {name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Handoff prompt — shown once a name is tapped, before confirmation */}
        {scorekeeperId != null && !scorekeeperConfirmed && (
          <View style={styles.handoffSection}>
            <Text style={styles.handoffText}>
              Please pass the phone to {scorekeeperId} 👋
            </Text>
            <TouchableOpacity
              style={styles.thatsMeButton}
              onPress={() => setScorekeeperConfirmed(true)}
              activeOpacity={0.7}>
              <Text style={styles.thatsMeButtonText}>
                {scorekeeperId} has the phone — let's go!
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Step 2: Who is to the left? ───────────────────────────────── */}
      {scorekeeperConfirmed && (
        <View style={styles.step}>
          <Text style={styles.stepQuestion}>
            Hi {scorekeeperId}! To set up the table, who is sitting on your left?
          </Text>
          <View style={styles.chipRow}>
            {opponents.map(name => (
              <TouchableOpacity
                key={name}
                style={[styles.chip, leftId === name && styles.chipSelected]}
                onPress={() => setLeftId(name)}
                activeOpacity={0.7}>
                <Text style={[styles.chipText, leftId === name && styles.chipTextSelected]}>
                  {name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ── Table confirmation — shown after Step 2 ───────────────────── */}
      {seatLayout && (
        <View style={styles.confirmSection}>
          <TableDiagram layout={seatLayout} />

          <TouchableOpacity onPress={handleStartOver} style={styles.startOverButton}>
            <Text style={styles.startOverText}>Start over</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmButton, !canConfirm && styles.confirmButtonDisabled]}
            onPress={handleConfirm}
            disabled={!canConfirm}
            activeOpacity={0.8}>
            <Text style={styles.confirmButtonText}>Confirm Table</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  content: {
    padding: 24,
    paddingBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: 32,
  },

  // Steps
  step: {
    marginBottom: 32,
  },
  stepQuestion: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.ink,
    lineHeight: 26,
    marginBottom: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderWidth: 1,
    borderColor: Colors.ink,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  chipSelected: {
    backgroundColor: Colors.green,
    borderColor: Colors.green,
  },
  chipText: {
    fontSize: 16,
    color: Colors.ink,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },

  // Step 1 handoff prompt
  handoffSection: {
    marginTop: 20,
  },
  handoffText: {
    fontSize: 15,
    color: Colors.ink,
    marginBottom: 14,
  },
  thatsMeButton: {
    borderWidth: 1.5,
    borderColor: Colors.green,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  thatsMeButtonText: {
    fontSize: 16,
    color: Colors.green,
    fontWeight: '600',
  },

  // Confirmation section
  confirmSection: {
    marginTop: 8,
  },

  // Table container — shaded rounded box
  tableContainer: {
    backgroundColor: 'rgba(61, 92, 69, 0.07)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(61, 92, 69, 0.15)',
    padding: 20,
    marginBottom: 20,
  },

  // Seat positions (flex layout: top → middle row → bottom)
  seatTopBottom: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  tableMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  // No flex: 1 — labels size to content width. Negative margin overlaps
  // each label 20px into the circle edge; zIndex keeps them on top.
  seatSide: {
    alignItems: 'center',
    marginHorizontal: -20,
    zIndex: 2,
  },

  // The felt circle
  tableCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(61, 92, 69, 0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(61, 92, 69, 0.65)',
    zIndex: 1,
  },

  // Seat labels — cream "tag" background so text is legible over the circle
  seatLabelContainer: {
    alignItems: 'center',
    backgroundColor: Colors.cream,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  seatLabelName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.ink,
    textAlign: 'center',
  },
  seatLabelNameBold: {
    fontSize: 15,
    fontWeight: '700',
  },
  seatLabelSubtitleGreen: {
    fontSize: 11,
    color: Colors.green,
    marginTop: 2,
    textAlign: 'center',
  },

  // Clockwise label inside the container
  clockwise: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.grey,
    marginTop: 8,
  },

  // Start over / confirm
  startOverButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 16,
  },
  startOverText: {
    fontSize: 14,
    color: Colors.grey,
    textDecorationLine: 'underline',
  },
  confirmButton: {
    backgroundColor: Colors.green,
    paddingVertical: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: Colors.grey,
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
