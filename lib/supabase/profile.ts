import { UserProfile } from "@/types";
import { supabase } from "./client";

class ProfileService {
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data as UserProfile;
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }
  }

  async searchUsers(query: string): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      return data as UserProfile[];
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  }
  async updateProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select("*")
        .single();

      if (error) throw error;
      if (!data) throw new Error("Profile update failed");

      return data as UserProfile;
    } catch (error) {
      console.error("Profile update failed:", error);
      throw error;
    }
  }

  async uploadAvatar(userId: string, uri: string): Promise<string> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split(".").pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Avatar upload failed:", error);
      throw error;
    }
  }

  async deleteAvatar(userId: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from("avatars")
        .remove([`${userId}/*`]);

      if (error) throw error;
    } catch (error) {
      console.error("Avatar deletion failed:", error);
      throw error;
    }
  }
}

export const profileService = new ProfileService();
