import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { usePlayers } from '@/context/PlayersContext';
import { KeyboardSafeScrollView } from '@/components/KeyboardSafeScrollView';

export default function PlayersScreen() {
  const { setPlayers } = usePlayers();
  const [names, setNames] = useState<string[]>(['', '', '', '']);

  // Callback-ref pattern for a dynamic list: inputRefs.current[i] is set by
  // React when each TextInput mounts, so we never need to pre-create ref objects.
  const inputRefs = useRef<(TextInput | null)[]>([]);

  function updateName(index: number, value: string) {
    setNames(prev => prev.map((n, i) => (i === index ? value : n)));
  }

  function addPlayer() {
    setNames(prev => [...prev, '']);
  }

  // Case-insensitive duplicate check for a single field index.
  function isDuplicate(index: number): boolean {
    const name = names[index].trim();
    if (!name) return false;
    return names.some(
      (n, j) => j !== index && n.trim().toLowerCase() === name.toLowerCase()
    );
  }

  const filled = names.map(n => n.trim()).filter(Boolean);
  const hasDuplicates = names.some((_, i) => isDuplicate(i));
  const canProceed = filled.length >= 4 && !hasDuplicates;

  function handleNext() {
    if (!canProceed) return;
    setPlayers(filled);
    router.push('/partners');
  }

  const footer = (
    <View style={styles.footer}>
      <TouchableOpacity
        style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
        onPress={handleNext}
        disabled={!canProceed}
        activeOpacity={0.8}>
        <Text style={styles.nextButtonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardSafeScrollView contentContainerStyle={styles.content} footer={footer}>
      <Text style={styles.title}>Who is playing?</Text>

      {names.map((name, i) => {
        const isLast = i === names.length - 1;
        const dup = isDuplicate(i);
        return (
          <View key={i} style={styles.fieldGroup}>
            <TextInput
              ref={el => { inputRefs.current[i] = el; }}
              style={styles.input}
              value={name}
              onChangeText={v => updateName(i, v)}
              placeholder="First name only"
              placeholderTextColor={Colors.grey}
              autoCapitalize="words"
              returnKeyType={isLast ? 'done' : 'next'}
              // Keep keyboard up between fields; only dismiss on the last field.
              blurOnSubmit={isLast}
              onSubmitEditing={() => {
                if (!isLast) {
                  inputRefs.current[i + 1]?.focus();
                } else {
                  handleNext();
                }
              }}
            />
            {dup && (
              <Text style={styles.duplicateWarning}>
                Another {name.trim()} is already playing — add a last initial?
              </Text>
            )}
          </View>
        );
      })}

      <TouchableOpacity style={styles.addButton} onPress={addPlayer}>
        <Text style={styles.addButtonText}>+ Add another</Text>
      </TouchableOpacity>
    </KeyboardSafeScrollView>
  );
}

const styles = StyleSheet.create({
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
  // Wraps each input + its optional duplicate warning.
  // Owns the inter-field spacing so the warning sits flush under the input.
  fieldGroup: {
    marginBottom: 20,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.ink,
    paddingVertical: 12,
    paddingHorizontal: 2,
    fontSize: 18,
    color: Colors.ink,
  },
  duplicateWarning: {
    fontSize: 13,
    color: Colors.gold,
    marginTop: 5,
  },
  addButton: {
    paddingVertical: 8,
    marginTop: 4,
  },
  addButtonText: {
    fontSize: 16,
    color: Colors.green,
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
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
