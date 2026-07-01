import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

const LINE_SPACING = 28; // px between ruled lines
const LINE_COLOR = 'rgba(180, 195, 210, 0.45)'; // faint blue-grey, like Hilroy notebook

type Props = {
  children: ReactNode;
  style?: object;
};

export function LinedPaper({ children, style }: Props) {
  const [height, setHeight] = useState(0);

  function onLayout(e: LayoutChangeEvent) {
    setHeight(e.nativeEvent.layout.height);
  }

  // Extra lines beyond measured height ensure coverage if content expands slightly
  const lineCount = height > 0 ? Math.ceil(height / LINE_SPACING) + 2 : 0;

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      {/* Ruled lines — rendered first so content sits on top */}
      {Array.from({ length: lineCount }, (_, i) => (
        <View
          key={i}
          style={[styles.line, { top: (i + 1) * LINE_SPACING }]}
          pointerEvents="none"
        />
      ))}

      {/* Page content renders above the lines */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: LINE_COLOR,
  },
});
