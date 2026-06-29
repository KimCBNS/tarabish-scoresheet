import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { usePlayers } from '@/context/PlayersContext';

type Team = {
  name: string;
  members: string[];
};

function buildInitialTeams(count: number): Team[] {
  if (count === 4) {
    return [
      { name: 'US', members: [] },
      { name: 'THEM', members: [] },
    ];
  }
  // For 5+ players: one team per 2 players, rounding up
  const teamCount = Math.ceil(count / 2);
  return Array.from({ length: teamCount }, (_, i) => ({
    name: `Team ${String.fromCharCode(65 + i)}`, // A, B, C...
    members: [],
  }));
}

export default function PartnersScreen() {
  const { players } = usePlayers();
  const [teams, setTeams] = useState<Team[]>(() => buildInitialTeams(players.length));
  const [unassigned, setUnassigned] = useState<string[]>(players);

  const is4Player = players.length === 4;
  const allAssigned = unassigned.length === 0;

  function assignPlayer(playerName: string) {
    const targetIndex = teams.findIndex(t => t.members.length < 2);
    if (targetIndex === -1) return;

    const newTeams = teams.map((t, i) =>
      i === targetIndex ? { ...t, members: [...t.members, playerName] } : t
    );
    const newUnassigned = unassigned.filter(p => p !== playerName);

    // 4-player auto-fill: once US (index 0) reaches 2, put remaining unassigned into THEM —
    // but only when THEM is still empty, so a re-assignment after removal doesn't stomp existing members.
    if (is4Player && targetIndex === 0 && newTeams[0].members.length === 2 && newUnassigned.length > 0 && newTeams[1].members.length === 0) {
      newTeams[1] = { ...newTeams[1], members: [...newUnassigned] };
      setUnassigned([]);
    } else {
      setUnassigned(newUnassigned);
    }

    setTeams(newTeams);
  }

  function removePlayer(playerName: string, teamIndex: number) {
    const newTeams = teams.map((t, i) =>
      i === teamIndex ? { ...t, members: t.members.filter(m => m !== playerName) } : t
    );
    setTeams(newTeams);
    setUnassigned(prev => [...prev, playerName]);
  }

  function handleNext() {
    const result = teams.map(t => ({ team: t.name, players: t.members }));
    console.log('Teams:', JSON.stringify(result, null, 2));
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Match partners</Text>

      {teams.map((team, teamIndex) => (
        <View key={team.name} style={styles.teamBox}>
          <Text style={styles.teamLabel}>{team.name}</Text>
          <View style={styles.memberRow}>
            {team.members.map(member => (
              <TouchableOpacity
                key={member}
                style={styles.assignedChip}
                onPress={() => removePlayer(member, teamIndex)}
                activeOpacity={0.7}>
                <Text style={styles.assignedChipText}>{member} ×</Text>
              </TouchableOpacity>
            ))}
            {Array.from({ length: 2 - team.members.length }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.emptySlot} />
            ))}
          </View>
        </View>
      ))}

      <View style={styles.unassignedSection}>
        {unassigned.length > 0 && (
          <>
            <Text style={styles.unassignedLabel}>Tap a name to assign:</Text>
            <View style={styles.unassignedList}>
              {unassigned.map(name => (
                <TouchableOpacity
                  key={name}
                  style={styles.unassignedChip}
                  onPress={() => assignPlayer(name)}
                  activeOpacity={0.7}>
                  <Text style={styles.unassignedChipText}>{name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>

      <TouchableOpacity
        style={[styles.nextButton, !allAssigned && styles.nextButtonDisabled]}
        onPress={handleNext}
        disabled={!allAssigned}
        activeOpacity={0.8}>
        <Text style={styles.nextButtonText}>Next</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  content: {
    padding: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: 32,
  },
  teamBox: {
    borderWidth: 1,
    borderColor: Colors.green,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  teamLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.green,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: 'row',
    gap: 10,
  },
  assignedChip: {
    flex: 1,
    backgroundColor: Colors.green,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  assignedChipText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySlot: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: Colors.grey,
    borderStyle: 'dashed',
    borderRadius: 6,
  },
  unassignedSection: {
    marginTop: 8,
    marginBottom: 40,
    minHeight: 60,
  },
  unassignedLabel: {
    fontSize: 13,
    color: Colors.grey,
    marginBottom: 12,
  },
  unassignedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  unassignedChip: {
    borderWidth: 1,
    borderColor: Colors.ink,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  unassignedChipText: {
    fontSize: 16,
    color: Colors.ink,
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: Colors.green,
    paddingVertical: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: Colors.grey,
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
