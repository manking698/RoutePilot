import { ArrowUp, CornerUpLeft, CornerUpRight, Flag } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows } from '../theme/routePilotTheme';
import type { NavigationStep } from '../types/route';

type Props = {
  step?: NavigationStep;
  arrived?: boolean;
  onShowRouteOverview?: () => void;
};

const getIcon = (maneuver?: string, arrived?: boolean) => {
  if (arrived) {
    return <Flag color={colors.accent} size={25} />;
  }

  if (maneuver?.includes('left')) {
    return <CornerUpLeft color={colors.accent} size={28} strokeWidth={2.8} />;
  }

  if (maneuver?.includes('right')) {
    return <CornerUpRight color={colors.accent} size={28} strokeWidth={2.8} />;
  }

  return <ArrowUp color={colors.accent} size={28} strokeWidth={2.8} />;
};

const splitInstruction = (instruction?: string, distanceText?: string) => {
  const fallback = instruction || 'Continue to your destination';
  const ontoMatch = fallback.match(/^(.*?)(?: onto | on | toward )(.*)$/i);
  const action = ontoMatch?.[1] || fallback;
  const roadName = ontoMatch?.[2] || '';

  return {
    actionText: distanceText ? `${action} in ${distanceText}` : action,
    roadName,
  };
};

export function NavigationInstructionCard({ step, arrived, onShowRouteOverview }: Props) {
  const instruction = splitInstruction(step?.instruction, step?.distanceText);

  return (
    <View style={[styles.card, arrived && styles.arrivedCard]}>
      <View style={styles.iconBox}>{getIcon(step?.maneuver, arrived)}</View>
      <Pressable
        accessibilityLabel="Show remaining route"
        accessibilityRole="button"
        disabled={!onShowRouteOverview}
        onPress={onShowRouteOverview}
        style={({ pressed }) => [styles.textBox, pressed && styles.pressedTextBox]}
      >
        <Text style={styles.label}>{arrived ? 'Arrived' : 'Next'}</Text>
        <Text style={[styles.instruction, arrived && styles.arrivedInstruction]}>
          {arrived ? 'You have arrived at your destination.' : instruction.actionText}
        </Text>
        {!arrived && instruction.roadName ? (
          <Text style={styles.roadName}>
            {instruction.roadName}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    top: 44,
    left: 16,
    right: 16,
    zIndex: 30,
    minHeight: 66,
    borderRadius: radii.large,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.88)',
    ...shadows.subtle,
  },
  arrivedCard: {
    backgroundColor: colors.card,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20, 184, 166, 0.14)',
  },
  textBox: {
    flex: 1,
    flexShrink: 1,
    paddingLeft: 9,
  },
  pressedTextBox: {
    opacity: 0.72,
  },
  label: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  instruction: {
    marginTop: 2,
    color: colors.card,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
  },
  arrivedInstruction: {
    color: colors.textPrimary,
  },
  roadName: {
    marginTop: 2,
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
});
