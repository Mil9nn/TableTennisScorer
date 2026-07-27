import { axiosInstance } from "@/lib/axiosInstance";
import { useCallback, useState, useEffect, useRef, useMemo } from "react";
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
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { FormTextField } from "@/components/ui/FormTextField";
import { useThemeColors } from "@/hooks/useThemeColors";

interface User {
  _id: string;
  username: string;
  fullName?: string;
  profileImage?: string;
}

interface UserSearchInputProps {
  placeholder?: string;
  onSelect: (user: User) => void;
  clearAfterSelect?: boolean;
}

function apiOrigin(): string {
  const base = axiosInstance.defaults.baseURL || "";
  return base.replace(/\/?api\/?$/i, "");
}

/** Turn stored profile path or URL into a loadable URI for the native app. */
export function resolveProfileImageUri(raw?: string | null): string | undefined {
  if (!raw?.trim()) return undefined;
  const u = raw.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  const origin = apiOrigin();
  if (u.startsWith("/")) return `${origin}${u}`;
  return `${origin}/${u}`;
}

function avatarInitial(username: string): string {
  const c = username?.trim()?.[0];
  return c ? c.toUpperCase() : "?";
}

function SearchUserAvatar({
  user,
  size = 36,
  theme,
}: {
  user: Pick<User, "username" | "profileImage">;
  size?: number;
  theme: ReturnType<typeof useThemeColors>;
}) {
  const [failed, setFailed] = useState(false);
  const uri = resolveProfileImageUri(user.profileImage);
  const showImage = Boolean(uri) && !failed;

  return (
    <View
      style={{
        overflow: "hidden",
        backgroundColor: theme.colors.gray[100],
        width: size,
        height: size,
        borderRadius: size / 2,
      }}
    >
      {showImage ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
          transition={120}
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.colors.primary[100],
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
        >
          <Text
            style={{
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.primary[800],
              fontSize: size * 0.38,
            }}
          >
            {avatarInitial(user.username)}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function UserSearchInput({
  placeholder,
  onSelect,
  clearAfterSelect = false,
}: UserSearchInputProps) {
  const theme = useThemeColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { width: "100%", position: "relative" },
        inputContainer: { width: "100%", position: "relative" },
        inputRow: {
          position: "relative",
          width: "100%",
        },
        fieldContainer: {
          width: "100%",
        },
        inputWithTrailing: {
          paddingRight: theme.spacing[8],
        },
        inputTrailing: {
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          justifyContent: "center",
          alignItems: "center",
          minWidth: theme.spacing[8],
        },
        muted: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.gray[500],
          marginTop: theme.spacing[1],
        },
        mutedSmall: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.gray[400],
          marginTop: theme.spacing[2],
        },
        row: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[3],
          padding: theme.spacing[4],
          marginBottom: theme.spacing[2],
        },
        dropdown: {
          position: "absolute",
          left: 0,
          right: 0,
          backgroundColor: theme.colors.background.primary,
          elevation: 2,
          zIndex: 1000,
          maxHeight: 300,
        },
        dropdownBottom: {
          top: "100%",
          marginTop: theme.spacing[2],
        },
        dropdownTop: {
          bottom: "100%",
        },
        scrollView: {
          maxHeight: 300,
          flex: 1,
        },
        rowTextCol: {
          flex: 1,
          minWidth: 0,
        },
        primaryText: {
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.primary,
        },
        selectedRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[3],
          paddingVertical: theme.spacing[1],
        },
        selectedTextCol: {
          flex: 1,
          minWidth: 0,
        },
        clearHit: { paddingVertical: theme.spacing[1] },
        clearText: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.primary[600],
          fontWeight: theme.typography.fontWeight.semibold,
        },
      }),
    [theme],
  );

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const inputRef = useRef<View>(null);
  const [inputLayout, setInputLayout] = useState({ y: 0, height: 0 });

  const fetchSuggestions = useCallback(async (val: string) => {
    setQuery(val);
    const q = val.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/users/search?q=${encodeURIComponent(q)}&limit=10`
      );
      setSuggestions(res.data?.users || []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelect = (u: User) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onSelect(u);
    if (clearAfterSelect) {
      setQuery("");
      setSuggestions([]);
      setSelectedUser(null);
    } else {
      setSelectedUser(u);
      setSuggestions([]);
    }
  };

  const handleClear = () => {
    setSelectedUser(null);
    setQuery("");
    setSuggestions([]);
  };

  const activeQuery = query.trim().length >= 2;

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
      const dropdownHeight = Math.min(300, suggestions.length * 70);
      
      if (availableSpaceBelow < dropdownHeight + 50) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }
  }, [keyboardHeight, inputLayout, suggestions.length]);

  const onInputLayout = () => {
    inputRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setInputLayout({ y: pageY, height });
    });
  };

  if (selectedUser && !clearAfterSelect) {
    return (
      <View style={styles.wrap}>
        <View style={styles.selectedRow}>
          <SearchUserAvatar user={selectedUser} size={36} theme={theme} />
          <View style={styles.selectedTextCol}>
            <Text style={styles.primaryText} numberOfLines={1}>
              {selectedUser.fullName || selectedUser.username}
            </Text>
            <Text style={styles.muted}>@{selectedUser.username}</Text>
          </View>
          <Pressable onPress={handleClear} hitSlop={10} style={styles.clearHit}>
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.wrap} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View 
        ref={inputRef} 
        onLayout={onInputLayout}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <FormTextField
            containerStyle={styles.fieldContainer}
            inputStyle={loading ? styles.inputWithTrailing : undefined}
            placeholder={placeholder}
            value={query}
            onChangeText={fetchSuggestions}
            onFocus={() => setTimeout(onInputLayout, 100)}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            keyboardType="default"
            importantForAccessibility="yes"
            accessibilityLabel="Search users"
          />
          {loading && (
            <View style={styles.inputTrailing} pointerEvents="none">
              <ActivityIndicator
                size="small"
                color={theme.colors.text.tertiary}
              />
            </View>
          )}
        </View>

      {!loading && activeQuery && suggestions.length === 0 && (
        <Text style={styles.mutedSmall}>No users match.</Text>
      )}

          {!loading && activeQuery && suggestions.length > 0 && (
            <View style={[
              styles.dropdown,
              dropdownPosition === 'top' ? styles.dropdownTop : styles.dropdownBottom
            ]}>
              <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                {suggestions.slice(0, 10).map((u) => {
                  const label = u.fullName || u.username;
                  return (
                    <TouchableOpacity
                      key={u._id}
                      onPress={() => handleSelect(u)}
                      style={styles.row}
                      activeOpacity={0.7}
                    >
                      <SearchUserAvatar user={u} size={36} theme={theme} />
                      <View style={styles.rowTextCol}>
                        <Text style={styles.primaryText} numberOfLines={1}>
                          {label}
                        </Text>
                        <Text style={styles.muted}>@{u.username}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
    </KeyboardAvoidingView>
  );
}

