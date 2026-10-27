import { ScrollView, View, StyleSheet } from 'react-native';

interface ScreenProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  scrollable?: boolean;
}

export function Screen({ children, padding = 'md', scrollable = true }: ScreenProps) {
  if (!scrollable) {
    return (
      <View style={[styles.container, styles[padding]]}>
        {children}
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, styles[padding]]}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { flex: 1 },
  content: { flexGrow: 1 },
  none: {},
  sm: {},
  md: {},
  lg: {},
});
