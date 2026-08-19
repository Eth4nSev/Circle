import { supabase } from "@/app/utils/supabase";
import { Colors } from "@/styles/colors";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

export default function EditProfile() {
  const theme = useColorScheme() ?? "light";
  const colors = Colors[theme];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [isPickingImage, setIsPickingImage] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.back();
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, username, avatar_url")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error(error);
      router.back();
      return;
    }

    setDisplayName(data.display_name ?? "");
    setUsername(data.username ?? "");
    setProfilePicture(data.avatar_url ?? null);
    setLoading(false);
  }

  const pickImage = async () => {
    setIsPickingImage(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setProfilePicture(result.assets[0].uri);
      }
    } finally {
      setIsPickingImage(false);
    }
  };

  async function saveProfile() {
    if (!displayName.trim() || !username.trim()) return;

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        username: cleanUsername,
        avatar_url: profilePicture,
      })
      .eq("id", user.id);

    if (error) {
      console.error(error);
      setSaving(false);
      return;
    }

    setSaving(false);
    router.back();
  }

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="small" color={colors.text} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Edit Profile
          </Text>
          <GlassView
            style={{
              width: 50,
              height: 50,
              borderRadius: 50,
              justifyContent: "center",
              alignItems: "center",
            }}
            isInteractive
          >
            <Pressable onPress={() => router.back()}>
              <MaterialIcons name="close" size={28} color={colors.text} />
            </Pressable>
          </GlassView>
        </View>

        <View style={styles.avatarSection}>
          {profilePicture ? (
            <Image
              source={{ uri: profilePicture }}
              style={styles.profileImage}
            />
          ) : (
            <Ionicons
              name="person"
              size={54}
              color={
                theme === "dark" ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.35)"
              }
            />
          )}

          <Pressable onPress={pickImage} disabled={isPickingImage}>
            <GlassView
              tintColor={Colors.accent}
              style={styles.addButton}
              isInteractive
            >
              {isPickingImage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons
                  name={profilePicture ? "pencil" : "add"}
                  size={20}
                  color="#fff"
                />
              )}
            </GlassView>
          </Pressable>
        </View>

        <View style={styles.form}>
          <View style={[styles.field]}>
            <Text style={[styles.label, { color: Colors[theme].text }]}>
              Display Name
            </Text>

            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Display Name"
              placeholderTextColor={colors.secondary}
              style={[
                styles.input,
                {
                  color: Colors[theme].text,
                  backgroundColor: Colors[theme].clear,
                  borderColor: Colors[theme].separator,
                },
              ]}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Username</Text>

            <View
              style={[
                styles.usernameInput,
                {
                  backgroundColor: Colors[theme].clear,
                  borderColor: Colors[theme].separator,
                },
              ]}
            >
              <Text style={[styles.at, { color: colors.secondary }]}>@</Text>

              <TextInput
                value={username}
                onChangeText={(text) =>
                  setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                }
                placeholder="username"
                placeholderTextColor={colors.secondary}
                style={[styles.username, { color: colors.text }]}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
              />
            </View>
          </View>
        </View>
        <Pressable
          onPress={saveProfile}
          disabled={saving || !displayName.trim() || !username.trim()}
          style={[styles.saveButtonContainer]}
        >
          <GlassView
            tintColor={Colors.accent}
            style={styles.saveButton}
            isInteractive
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>Save Changes</Text>
            )}
          </GlassView>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
  },

  avatarSection: {
    width: 120,
    height: 120,
    alignSelf: "center",
    position: "relative",
    marginBottom: 24,
  },

  avatarContainer: {
    width: 108,
    height: 108,
    borderRadius: 54,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  avatar: {
    width: "100%",
    height: "100%",
  },

  cameraButton: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  changePhoto: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 10,
  },

  form: {
    gap: 18,
  },

  field: {
    gap: 7,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
  },

  input: {
    height: 48,
    borderRadius: 30,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },

  usernameInput: {
    height: 48,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    borderWidth: StyleSheet.hairlineWidth,
  },

  at: {
    fontSize: 16,
  },

  username: {
    flex: 1,
    fontSize: 16,
    marginLeft: 3,
  },

  saveButtonContainer: {
    width: "100%",
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    borderRadius: 30,
  },
  saveButton: {
    width: "100%",
    height: 52,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    marginTop: 5,
  },

  cancelText: {
    fontSize: 15,
    fontWeight: "600",
  },
  addButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
});
