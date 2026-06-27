import { Search, MapPin, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { DEFAULT_DESTINATION_PLACE, searchPlaces } from '../services/googlePlacesService';
import { colors, radii, shadows } from '../theme/routePilotTheme';
import type { PlaceSuggestion } from '../types/route';
import { BrandMark } from './BrandMark';

type Props = {
  apiKey?: string;
  disabled?: boolean;
  onSelect: (place: PlaceSuggestion) => void;
};

export function SearchBar({ apiKey, disabled, onSelect }: Props) {
  const [query, setQuery] = useState(DEFAULT_DESTINATION_PLACE.name);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([DEFAULT_DESTINATION_PLACE]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearQuery = () => {
    setQuery('');
    setSuggestions([DEFAULT_DESTINATION_PLACE]);
    setError(null);
  };

  useEffect(() => {
    if (!disabled) {
      setQuery(DEFAULT_DESTINATION_PLACE.name);
      setSuggestions([DEFAULT_DESTINATION_PLACE]);
      setError(null);
    }
  }, [disabled]);

  useEffect(() => {
    if (disabled) {
      return;
    }

    const timeout = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const results = await searchPlaces(query, apiKey);
        setSuggestions(results);
      } catch (searchError) {
        setError(searchError instanceof Error ? searchError.message : 'Places search failed.');
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [apiKey, disabled, query]);

  if (disabled) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <BrandMark />
        <Text style={styles.brandCaption}>Live route navigation</Text>
      </View>

      <View style={styles.inputRow}>
        <Search color={colors.textSecondary} size={19} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder=""
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          autoCorrect={false}
          returnKeyType="search"
        />
        {isLoading ? <ActivityIndicator color={colors.primary} size="small" /> : null}
        {!isLoading && query.length > 0 ? (
          <Pressable
            accessibilityLabel="Clear destination search"
            onPress={clearQuery}
            hitSlop={8}
            style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
          >
            <X color={colors.textSecondary} size={18} strokeWidth={2.4} />
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {suggestions.map((place) => (
        <Pressable
          key={place.id}
          onPress={() => {
            setQuery(place.name);
            setSuggestions([]);
            onSelect(place);
          }}
          style={({ pressed }) => [styles.suggestionRow, pressed && styles.pressed]}
        >
          <View style={styles.suggestionIcon}>
            <MapPin color={place.isFallback ? colors.accent : colors.primary} size={18} />
          </View>
          <View style={styles.suggestionText}>
            <Text style={styles.suggestionTitle}>{place.name}</Text>
            <Text style={styles.suggestionSubtitle} numberOfLines={1}>
              {place.address}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 20,
    backgroundColor: colors.card,
    borderRadius: radii.large,
    padding: 12,
    ...shadows.subtle,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  brandCaption: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  inputRow: {
    height: 44,
    borderRadius: radii.medium,
    backgroundColor: colors.lightBackground,
    paddingHorizontal: 12,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: radii.medium,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.muted,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  pressed: {
    opacity: 0.72,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  suggestionText: {
    flex: 1,
  },
  suggestionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  suggestionSubtitle: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 12,
  },
  errorText: {
    marginTop: 8,
    color: colors.warning,
    fontSize: 12,
  },
});
