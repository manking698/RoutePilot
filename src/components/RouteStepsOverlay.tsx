import {
  ArrowUp,
  ChevronUp,
  CornerUpLeft,
  CornerUpRight,
  Flag,
  RefreshCw,
} from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows } from '../theme/routePilotTheme';
import type { NavigationStep, PlaceSuggestion } from '../types/route';

type Props = {
  destination: PlaceSuggestion;
  onToggle: () => void;
  steps: NavigationStep[];
};

const getStepIcon = (step: NavigationStep) => {
  const maneuver = step.maneuver?.toLowerCase() || '';
  const instruction = step.instruction.toLowerCase();

  if (maneuver.includes('left') || instruction.includes('left')) {
    return <CornerUpLeft color={colors.card} size={26} strokeWidth={2.8} />;
  }

  if (maneuver.includes('right') || instruction.includes('right')) {
    return <CornerUpRight color={colors.card} size={26} strokeWidth={2.8} />;
  }

  if (maneuver.includes('roundabout') || instruction.includes('roundabout')) {
    return <RefreshCw color={colors.card} size={25} strokeWidth={2.8} />;
  }

  if (maneuver.includes('arrive') || instruction.includes('destination')) {
    return <Flag color={colors.card} size={25} strokeWidth={2.8} />;
  }

  return <ArrowUp color={colors.card} size={26} strokeWidth={2.8} />;
};

export function RouteStepsOverlay({ destination, onToggle, steps }: Props) {
  const stepCount = steps.length + 1;

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="Hide route steps"
        accessibilityRole="button"
        onPress={onToggle}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
      >
        <View>
          <Text style={styles.title}>Route steps</Text>
          <Text style={styles.subtitle}>{stepCount} steps</Text>
        </View>
        <View style={styles.toggleBox}>
          <Text style={styles.toggleText}>Hide</Text>
          <ChevronUp color={colors.accent} size={18} strokeWidth={2.8} />
        </View>
      </Pressable>

      <ScrollView
        style={styles.stepsScroll}
        contentContainerStyle={styles.stepsContent}
        nestedScrollEnabled
        showsVerticalScrollIndicator
      >
        {steps.map((step, index) => (
          <View key={`${step.instruction}-${index}`} style={styles.stepCard}>
            <View style={styles.iconBox}>{getStepIcon(step)}</View>
            <View style={styles.stepTextBox}>
              {step.distanceText ? (
                <Text style={styles.distanceText}>{step.distanceText}</Text>
              ) : null}
              <Text style={styles.instructionText}>{step.instruction}</Text>
            </View>
          </View>
        ))}

        <View style={[styles.stepCard, styles.arrivalCard]}>
          <View style={styles.iconBox}>
            <Flag color={colors.card} size={25} strokeWidth={2.8} />
          </View>
          <View style={styles.stepTextBox}>
            <Text style={styles.distanceText}>Arrive</Text>
            <Text style={styles.instructionText}>Arrive at destination</Text>
            <Text style={styles.destinationText}>{destination.name}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 120,
    right: 16,
    left: 16,
    zIndex: 24,
    borderRadius: radii.large,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    overflow: 'hidden',
    bottom: 224,
    ...shadows.subtle,
  },
  header: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
  },
  toggleBox: {
    minWidth: 76,
    height: 34,
    borderRadius: radii.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
  },
  toggleText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
  },
  stepsScroll: {
    flex: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  stepsContent: {
    gap: 9,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 18,
  },
  stepCard: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.small,
    backgroundColor: 'rgba(17, 24, 39, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  arrivalCard: {
    backgroundColor: colors.accent,
  },
  iconBox: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepTextBox: {
    flex: 1,
    flexShrink: 1,
  },
  distanceText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '900',
  },
  instructionText: {
    marginTop: 2,
    color: colors.card,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
  },
  destinationText: {
    marginTop: 4,
    color: colors.card,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.78,
  },
});
