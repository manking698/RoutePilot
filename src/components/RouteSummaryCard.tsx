import { Navigation, X } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows } from '../theme/routePilotTheme';
import type { RouteDetails } from '../types/route';
import { BrandMark } from './BrandMark';

type Props = {
  route: RouteDetails;
  onGo: () => void;
  onCancel: () => void;
};

export function RouteSummaryCard({ route, onGo, onCancel }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.destinationBlock}>
          <BrandMark />
          <Text style={styles.destinationLabel}>Destination</Text>
          <Text style={styles.destination} numberOfLines={2}>
            {route.destination.name}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Clear route"
          onPress={onCancel}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <X color={colors.textSecondary} size={20} />
        </Pressable>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>ETA</Text>
          <Text style={styles.metricValue}>{route.durationText}</Text>
        </View>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>Distance</Text>
          <Text style={styles.metricValue}>{route.distanceText}</Text>
        </View>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>Current Speed</Text>
          <Text style={styles.metricValue}>Ready</Text>
        </View>
      </View>

      {route.warning ? <Text style={styles.warning}>{route.warning}</Text> : null}

      <View style={styles.actionRow}>
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryText}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={onGo}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          <Navigation color={colors.card} size={18} />
          <Text style={styles.primaryText}>Go</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    zIndex: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: radii.card,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    ...shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  destinationBlock: {
    flex: 1,
    paddingRight: 10,
  },
  destinationLabel: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  destination: {
    marginTop: 2,
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: radii.medium,
    backgroundColor: colors.lightBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    gap: 10,
  },
  metricBlock: {
    flex: 1,
    minHeight: 64,
    borderRadius: radii.medium,
    backgroundColor: colors.lightBackground,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  metricValue: {
    marginTop: 4,
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  warning: {
    marginTop: 12,
    color: colors.warning,
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: radii.medium,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightBackground,
  },
  secondaryText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: radii.medium,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.primary,
  },
  primaryText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.78,
  },
});
