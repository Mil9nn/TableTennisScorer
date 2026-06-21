import { DesignTokens } from "@/constants/designTokens";
import { axiosInstance } from "@/lib/axiosInstance";
import { useEffect, useState, useRef } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    Dimensions,
    Platform,
    KeyboardAvoidingView,
    LayoutAnimation,
    Keyboard,
} from "react-native";
import { Image } from "expo-image";
import { FormTextField } from "@/components/ui/FormTextField";

interface Team {
  _id: string;
  name: string;
  logo?: string;
}

export default function TeamSearchInput({
  placeholder = "Search teams...",
  onSelect,
  clearAfterSelect = false,
  defaultValue = "",
}: {
  placeholder?: string;
  onSelect: (team: Team) => void;
  clearAfterSelect?: boolean;
  defaultValue?: string;
}) {
  const [query, setQuery] = useState(defaultValue || "");
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const inputRef = useRef<View>(null);
  const [inputLayout, setInputLayout] = useState({ y: 0, height: 0 });

  useEffect(() => {
    if (clearAfterSelect) {
      setSelectedTeam(null);
    }
  }, [clearAfterSelect]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setTeams([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const encoded = encodeURIComponent(query.trim());
        const res = await axiosInstance.get(`/teams/search?query=${encoded}&limit=10`);
        if (res.data.success) {
          setTeams(res.data.teams || []);
        }
      } catch (err) {
        console.error("Failed to search teams:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (team: Team) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onSelect(team);
    if (clearAfterSelect) {
      setSelectedTeam(null);
      setQuery("");
    } else {
      setSelectedTeam(team);
      setQuery(team.name);
    }
    setTeams([]);
  };

  const handleClear = () => {
    setSelectedTeam(null);
    setQuery("");
  };

  const getInitial = (name: string) => name?.charAt(0)?.toUpperCase() || "?";

  useEffect(() => {
    const keyboardShowListener = Platform.OS === 'ios' 
      ? 'keyboardWillShow' 
      : 'keyboardDidShow';
    const keyboardHideListener = Platform.OS === 'ios' 
      ? 'keyboardWillHide' 
      : 'keyboardDidHide';

    const handleKeyboardShow = (e: any) => {
      const keyboardY = e.endCoordinates.screenY;
      setKeyboardHeight(Dimensions.get('window').height - keyboardY);
    };

    const handleKeyboardHide = () => {
      setKeyboardHeight(0);
    };

    const showSubscription = Platform.OS === 'ios' 
      ? Keyboard.addListener(keyboardShowListener, handleKeyboardShow)
      : Keyboard.addListener(keyboardShowListener, handleKeyboardShow);
    const hideSubscription = Platform.OS === 'ios' 
      ? Keyboard.addListener(keyboardHideListener, handleKeyboardHide)
      : Keyboard.addListener(keyboardHideListener, handleKeyboardHide);

    return () => {
      showSubscription?.remove();
      hideSubscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (inputLayout.y > 0 && keyboardHeight > 0) {
      const screenHeight = Dimensions.get('window').height;
      const availableSpaceBelow = screenHeight - inputLayout.y - inputLayout.height - keyboardHeight;
      const dropdownHeight = Math.min(300, teams.length * 60);
      
      if (availableSpaceBelow < dropdownHeight + 50) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }
  }, [keyboardHeight, inputLayout, teams.length]);

  const onInputLayout = () => {
    inputRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setInputLayout({ y: pageY, height });
    });
  };

  const renderTeam = ({ item: team }: { item: Team }) => (
    <Pressable
      style={styles.teamItem}
      onPress={() => handleSelect(team)}
    >
      <View style={styles.avatar}>
        {team.logo &&
          <Image source={{ uri: team.logo }} contentFit="cover" style={styles.avatarImage} />
        }
      </View>
      <Text style={styles.teamName}>{team.name}</Text>
    </Pressable>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View ref={inputRef} onLayout={onInputLayout} style={styles.inputContainer}>
        {selectedTeam ? (
          <View style={styles.selectedContainer}>
            <View style={styles.selectedContent}>
              <View style={styles.avatar}>
                {selectedTeam.logo ? (
                  <Image
                    source={{ uri: selectedTeam.logo }}
                    contentFit="cover"
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {getInitial(selectedTeam.name)}
                  </Text>
                )}
              </View>
              <Text style={styles.selectedName}>{selectedTeam.name}</Text>
            </View>
            <Pressable onPress={handleClear} style={styles.clearButton}>
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.inputRow}>
            <FormTextField
              containerStyle={styles.fieldContainer}
              inputStyle={loading ? styles.inputWithTrailing : undefined}
              placeholder={placeholder}
              value={query}
              onChangeText={setQuery}
              onFocus={() => setTimeout(onInputLayout, 100)}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {loading && (
              <View style={styles.loadingContainer} pointerEvents="none">
                <ActivityIndicator
                  size="small"
                  color={DesignTokens.colors.text.tertiary}
                />
              </View>
            )}
          </View>
        )}

        {query.trim().length >= 2 && teams.length > 0 && !selectedTeam && (
          <View style={[
            styles.dropdown,
            dropdownPosition === 'top' ? styles.dropdownTop : styles.dropdownBottom
          ]}>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
            >
              <View style={styles.teamList}>
                {teams.slice(0, 10).map((team) => (
                  <View key={team._id}>{renderTeam({ item: team })}</View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "100%",
  },
  inputContainer: {
    width: "100%",
    position: "relative",
  },
  inputRow: {
    position: "relative",
    width: "100%",
  },
  fieldContainer: {
    width: "100%",
  },
  inputWithTrailing: {
    paddingRight: DesignTokens.spacing[8],
  },
  loadingContainer: {
    position: "absolute",
    right: DesignTokens.spacing[3],
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    minWidth: DesignTokens.spacing[8],
  },
  selectedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: DesignTokens.spacing[6],
    backgroundColor: DesignTokens.colors.background.secondary,
  },
  selectedContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  selectedName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  clearButton: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 16,
    color: "#6b7280",
  },
  dropdown: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    elevation: 2,
    zIndex: 1000,
    maxHeight: 300,
  },
  dropdownBottom: {
    top: '100%',
    marginTop: DesignTokens.spacing[2],
  },
  dropdownTop: {
    bottom: '100%',
  },
  teamList: {
    maxHeight: 256,
  },
  teamItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
    paddingHorizontal: DesignTokens.spacing[3],
    paddingVertical: DesignTokens.spacing[3],
  },
  teamItemPressed: {
    backgroundColor: "#f3f4f6",
  },
  teamName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
});