import { useContext } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { HeaderHeightContext } from '@react-navigation/elements';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  // Rendered outside the ScrollView but inside the KAV — stays pinned above
  // the keyboard regardless of scroll position or input list length.
  footer?: ReactNode;
};

export function KeyboardSafeScrollView({ children, contentContainerStyle, footer }: Props) {
  // useHeaderHeight() throws when there is no header; read the context directly
  // so headerless screens (e.g. title screen) safely get 0.
  const headerHeight = useContext(HeaderHeightContext) ?? 0;

  return (
    <KeyboardAvoidingView
      style={styles.kav}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      // On iOS, KAV's frame.y is measured from the top of the React content area
      // (below the native nav bar), while keyboardFrame.screenY is in window coords.
      // The offset bridges that gap so the KAV compensates for the full keyboard height.
      // Android keyboard avoidance works differently; no offset needed there.
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      {footer}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1 },
  scroll: { flex: 1 },
});
