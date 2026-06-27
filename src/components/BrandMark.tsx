import { Navigation } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/routePilotTheme';

type Props = {
  compact?: boolean;
  inverted?: boolean;
};

export function BrandMark({ compact, inverted }: Props) {
  return (
    <View style={styles.row}>
      <View style={[styles.icon, inverted && styles.iconInverted]}>
        <Navigation
          color={inverted ? colors.primary : colors.card}
          fill={inverted ? colors.primary : colors.card}
          size={compact ? 14 : 16}
          strokeWidth={2.8}
        />
      </View>
      {!compact ? (
        <Text style={[styles.text, inverted && styles.textInverted]}>RoutePilot</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  iconInverted: {
    backgroundColor: colors.card,
  },
  text: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  textInverted: {
    color: colors.card,
  },
});
