import { supabase } from "@/app/utils/supabase";
import { Colors } from "@/styles/colors";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

export default function NewPost() {
  const theme = useColorScheme() ?? "light";
  const colors = Colors[theme];

  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [pickingImage, setPickingImage] = useState(false);
  const [posting, setPosting] = useState(false);

  async function pickImage() {
    setPickingImage(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Image picker error:", error);
    } finally {
      setPickingImage(false);
    }
  }

  async function createPost() {
    if (!image) {
      Alert.alert("Image Required", "Select an image before posting.");
      return;
    }

    setPosting(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert("Error", "You must be signed in to create a post.");
        return;
      }

      const response = await fetch(image);
      const arrayBuffer = await response.arrayBuffer();

      const extension =
        image.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";

      const fileName = `${user.id}/${Date.now()}.${extension}`;

      const contentType =
        extension === "png"
          ? "image/png"
          : extension === "webp"
            ? "image/webp"
            : "image/jpeg";

      const { error: uploadError } = await supabase.storage
        .from("posts")
        .upload(fileName, arrayBuffer, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        console.error(uploadError);
        Alert.alert("Upload Failed", uploadError.message);
        return;
      }

      const { data: publicData } = supabase.storage
        .from("posts")
        .getPublicUrl(fileName);

      const { error: postError } = await supabase.from("posts").insert({
        user_id: user.id,
        image: publicData.publicUrl,
        caption: caption.trim() || null,
      });

      if (postError) {
        console.error(postError);
        Alert.alert("Post Failed", postError.message);
        return;
      }

      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Something went wrong while creating your post.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <>
      <ScrollView
        style={styles.scrollView}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>New Post</Text>
        </View>

        <Pressable onPress={pickImage} disabled={pickingImage || posting}>
          {image ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: image }} style={styles.previewImage} />

              <GlassView
                tintColor={Colors.accent}
                isInteractive
                style={styles.changeButton}
              >
                {pickingImage ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="pencil" size={16} color="#fff" />
                    <Text style={styles.changeText}>Change</Text>
                  </>
                )}
              </GlassView>
            </View>
          ) : (
            <View style={styles.imagePickerWrapper}>
              <GlassView
                style={[
                  styles.imagePicker,
                  {
                    backgroundColor: colors.clear,
                    borderColor: colors.separator,
                  },
                ]}
              >
                {pickingImage ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <>
                    <View
                      style={[
                        styles.imageIcon,
                        {
                          backgroundColor: Colors.accent,
                        },
                      ]}
                    >
                      <Ionicons name="image-outline" size={25} color="#fff" />
                    </View>

                    <Text style={[styles.selectTitle, { color: colors.text }]}>
                      Select Image
                    </Text>

                    <Text
                      style={[
                        styles.selectDescription,
                        { color: colors.secondary },
                      ]}
                    >
                      Choose a photo to share
                    </Text>
                  </>
                )}
              </GlassView>
            </View>
          )}
        </Pressable>

        <View style={styles.captionSection}>
          <Text style={[styles.label, { color: colors.text }]}>Caption</Text>

          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Add a caption..."
            placeholderTextColor={colors.secondary}
            multiline
            maxLength={500}
            textAlignVertical="top"
            style={[
              styles.captionInput,
              {
                color: colors.text,
                backgroundColor: colors.clear,
                borderColor: colors.separator,
              },
            ]}
          />

          <Text style={[styles.characterCount, { color: colors.secondary }]}>
            {caption.length}/500
          </Text>
        </View>

        <Pressable
          onPress={createPost}
          disabled={!image || posting}
          style={[
            styles.postButtonContainer,
            {
              opacity: image && !posting ? 1 : 0.45,
            },
          ]}
        >
          <GlassView
            tintColor={Colors.accent}
            isInteractive
            style={styles.postButton}
          >
            {posting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={18} color="#fff" />
                <Text style={styles.postButtonText}>Post</Text>
              </>
            )}
          </GlassView>
        </Pressable>
      </ScrollView>
      <Pressable
        onPress={() => router.back()}
        disabled={posting}
        style={{ position: "absolute", top: 16, right: 16, zIndex: 999 }}
      >
        <GlassView isInteractive style={styles.closeButton}>
          <MaterialIcons name="close" size={26} color={colors.text} />
        </GlassView>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },

  header: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
  },

  closeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },

  imagePickerWrapper: {
    width: "100%",
    height: 210,
    borderRadius: 25,
    overflow: "hidden",
  },

  imagePicker: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  imageIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  selectTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  selectDescription: {
    fontSize: 14,
    marginTop: 4,
  },

  previewContainer: {
    width: "100%",
    height: 210,
    borderRadius: 22,
    overflow: "hidden",
    position: "relative",
  },

  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  changeButton: {
    position: "absolute",
    right: 10,
    bottom: 10,
    height: 38,
    paddingHorizontal: 13,
    borderRadius: 19,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  changeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  captionSection: {
    marginTop: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 7,
  },

  captionInput: {
    height: 82,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },

  characterCount: {
    fontSize: 11,
    textAlign: "right",
    marginTop: 4,
  },

  postButtonContainer: {
    width: "100%",
    height: 50,
    marginTop: 14,
    borderRadius: 25,
  },

  postButton: {
    width: "100%",
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  postButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
