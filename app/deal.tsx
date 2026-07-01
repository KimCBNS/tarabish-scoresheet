import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { usePlayers } from '@/context/PlayersContext';
import { KeyboardSafeScrollView } from '@/components/KeyboardSafeScrollView';

export default function DealScreen() {
  const { players, setDealerId } = usePlayers();
  const [selected, setSelected] = useState<string | null>(null);

  function handleConfirm() {
    if (!selected) return;
    setDealerId(selected);
    router.push('/rules');
  }

  return (
    <KeyboardSafeScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Who won the cut for deal?</Text>
      <Text style={styles.subtitle}>High card deals first</Text>

      <View style={styles.chipRow}>
        {players.map(name => (
          <TouchableOpacity
            key={name}
            style={[styles.chip, selected === name && styles.chipSelected]}
            onPress={() => setSelected(name)}
            activeOpacity={0.7}>
            <Text style={[styles.chipText, selected === name && styles.chipTextSelected]}>
              {name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.confirmButton, !selected && styles.confirmButtonDisabled]}
        onPress={handleConfirm}
        disabled={!selected}
        activeOpacity={0.8}>
        <Text style={styles.confirmButtonText}>Confirm</Text>
      </TouchableOpacity>
    </KeyboardSafeScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.grey,
    marginBottom: 32,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 48,
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
