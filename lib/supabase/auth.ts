// lib/supabase/auth.ts
import { UserProfile, UserSession, Web3Signature } from "@/types";
import { PublicKey } from "@solana/web3.js";
import { randomUUID } from "expo-crypto";
import nacl from "tweetnacl";
import { solanaWalletAdapter } from "../solana/wallet-adapter";
import { secureStorageManager } from "../storage/secure-store";
import { supabaseAdmin } from "./client";
import { ProfileInsert, SessionInsert } from "./types";

class AuthService {
  private async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await secureStorageManager.setProfile(profile);
    } catch (error) {
      console.error("❌ Failed to save user profile:", error);
      throw error;
    }
  }

  private async getUserProfile(): Promise<UserProfile | null> {
    try {
      const profile = await secureStorageManager.getProfile();
      
      if (!profile) {
        return null;
      }

      // Ensure wallet_address exists
      if (!profile.wallet_address) {
        console.warn("⚠️ Profile missing wallet_address, considering invalid");
        return null;
      }

      return profile;
    } catch (error) {
      console.error("❌ Failed to retrieve user profile:", error);
      return null;
    }
  }

  async debugAuthFlow(message: string, data?: any): Promise<void> {
    // Reduced logging - only get cached values without extra calls
    console.log(`🔍 AUTH DEBUG - ${message}`, data || {});
  }

  async signInWithWeb3(
    walletAddress: string,
    signature: Web3Signature
  ): Promise<{
    user: UserProfile;
    session: UserSession;
  }> {
    try {
      await this.debugAuthFlow("Starting Web3 sign in", { walletAddress });

      // Verify the signature
      const publicKey = new PublicKey(walletAddress);
      const isValid = this.verifyWeb3Signature(
        publicKey,
        signature.message,
        signature.signature
      );

      if (!isValid) {
        throw new Error("Invalid signature");
      }

      // Get or create user profile first
      const profile = await this.getOrCreateUserProfile(walletAddress);

      // Create session using our custom sessions table
      const session = await this.createSession(profile.id);

      await this.debugAuthFlow("Web3 sign in completed", { 
        profileId: profile.id, 
        sessionId: session.id 
      });

      return {
        user: profile,
        session: session,
      };
    } catch (error: any) {
      console.error("Web3 sign in failed:", error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async signInWithWallet(
    walletAddress: string,
    isTemporary: boolean = false
  ): Promise<{ user: UserProfile; session: UserSession }> {
    try {
      await this.debugAuthFlow("Starting wallet sign in", { walletAddress, isTemporary });

      if (isTemporary) {
        const result = await this.createTemporaryUser(walletAddress);
        await this.debugAuthFlow("Temporary user creation completed", {
          userId: result.user.id,
          sessionId: result.session.id
        });
        return result;
      } else {
        const message = `Sign this message to connect to Zypp Wallet. Session: ${Date.now()}`;
        const signature = await solanaWalletAdapter.signMessage(message);
        const result = await this.signInWithWeb3(walletAddress, signature);
        await this.debugAuthFlow("Web3 sign in completed", {
          userId: result.user.id,
          sessionId: result.session.id
        });
        return result;
      }
    } catch (error: any) {
      console.error("Wallet sign in failed:", error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async createTemporaryUser(walletAddress: string): Promise<{
    user: UserProfile;
    session: UserSession;
  }> {
    try {
      const profile = await this.createUserProfile(walletAddress, true);
      const session = await this.createSession(profile.id);

      console.log("✅ Temporary user created:", profile.username);

      return {
        user: profile,
        session: session,
      };
    } catch (error: any) {
      console.error("Temporary user creation failed:", error);
      throw new Error(`Temporary user creation failed: ${error.message}`);
    }
  }

  async signUpWithUsername(
    username: string,
    profileId: string
  ): Promise<UserProfile> {
    try {
      this.validateUsername(username);

      // Check username availability using admin client
      const { data: existingUsername, error: usernameError } =
        await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("username", username.toLowerCase().trim())
          .maybeSingle();

      if (usernameError) throw usernameError;
      if (existingUsername) throw new Error("Username is already taken");

      // Update profile with username using admin client
      const updateData = {
        username: username.toLowerCase().trim(),
        display_name: username,
        status: "active" as const,
        updated_at: new Date().toISOString(),
        is_temporary: false, // Convert from temporary to permanent
      };

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update(updateData)
        .eq("id", profileId);

      if (updateError) throw updateError;

      // Get updated profile using admin client
      const { data: updatedProfile, error: fetchError } = await supabaseAdmin
        .from("profiles")
        .select()
        .eq("id", profileId)
        .single();

      if (fetchError) throw fetchError;

      // Convert to UserProfile (ensuring wallet_address is not null)
      const profile: UserProfile = {
        ...updatedProfile,
        wallet_address: updatedProfile.wallet_address!,
      };

      await this.saveUserProfile(profile);
      return profile;
    } catch (error: any) {
      console.error("Username sign up failed:", error);
      throw new Error(`Profile creation failed: ${error.message}`);
    }
  }

  // Public method for saving session
  async saveSession(session: UserSession): Promise<void> {
    try {
      await secureStorageManager.setSession(session);
    } catch (error) {
      console.error("❌ Failed to save session:", error);
      throw error;
    }
  }

  private async createSession(userId: string): Promise<UserSession> {
    try {
      const deviceId = await this.getDeviceId();
      const now = new Date().toISOString();
      const expiresAt = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(); // 30 days

      const sessionData: SessionInsert = {
        id: randomUUID(),
        user_id: userId,
        device_id: deviceId,
        access_token: randomUUID(),
        refresh_token: randomUUID(),
        expires_at: expiresAt,
        created_at: now,
        user_agent: this.getUserAgent(),
      };

      const { data: session, error } = await supabaseAdmin
        .from("sessions")
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;

      // Use the public saveSession method
      await this.saveSession(session);
      return session;
    } catch (error: any) {
      console.error("Session creation failed:", error);
      throw new Error(`Session creation failed: ${error.message}`);
    }
  }

  private async getOrCreateUserProfile(
    walletAddress: string
  ): Promise<UserProfile> {
    try {
      const now = new Date().toISOString();

      // Check if profile exists using admin client
      const { data: existingProfile, error: fetchError } = await supabaseAdmin
        .from("profiles")
        .select()
        .eq("wallet_address", walletAddress)
        .maybeSingle();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      if (existingProfile) {
        // Update existing profile
        const updateData = {
          last_seen: now,
          is_online: true,
          updated_at: now,
        };

        const { data: updatedProfile, error: updateError } = await supabaseAdmin
          .from("profiles")
          .update(updateData)
          .eq("id", existingProfile.id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Convert to UserProfile (ensuring wallet_address is not null)
        const profile: UserProfile = {
          ...updatedProfile,
          wallet_address: updatedProfile.wallet_address!,
        };

        await this.saveUserProfile(profile);
        return profile;
      }

      // Create new profile
      return await this.createUserProfile(walletAddress, false);
    } catch (error: any) {
      console.error("Get or create profile failed:", error);
      throw new Error(`Profile setup failed: ${error.message}`);
    }
  }

  private async createUserProfile(
    walletAddress: string,
    isTemporary: boolean
  ): Promise<UserProfile> {
    try {
      const profileId = randomUUID();
      const now = new Date().toISOString();

      const profileData: ProfileInsert = {
        id: profileId,
        username: isTemporary
          ? `temp_${walletAddress.slice(0, 8)}`
          : `user_${walletAddress.slice(0, 8)}`,
        wallet_address: walletAddress,
        display_name: isTemporary
          ? `Temp User ${walletAddress.slice(0, 8)}`
          : `User ${walletAddress.slice(0, 8)}`,
        created_at: now,
        updated_at: now,
        last_seen: now,
        is_online: true,
        device_count: 1,
        status: "active",
        role: "user",
        preferences: {
          currency: "usd",
          language: "en",
          theme: "system",
          notifications: true,
        },
        is_temporary: isTemporary,
        avatar_url: null,
        bio: null,
      };

      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from("profiles")
        .insert(profileData)
        .select()
        .single();

      if (insertError) throw insertError;

      // Convert to UserProfile (ensuring wallet_address is not null)
      const profile: UserProfile = {
        ...newProfile,
        wallet_address: newProfile.wallet_address!,
      };

      await this.saveUserProfile(profile);
      return profile;
    } catch (error: any) {
      console.error("Create user profile failed:", error);
      throw new Error(`Profile creation failed: ${error.message}`);
    }
  }

  private validateUsername(username: string): void {
    if (!username || username.length < 3 || username.length > 20) {
      throw new Error("Username must be between 3 and 20 characters");
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new Error(
        "Username can only contain letters, numbers, and underscores"
      );
    }
  }

  private verifyWeb3Signature(
    publicKey: PublicKey,
    message: string,
    signature: string
  ): boolean {
    try {
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = Buffer.from(signature, "base64");
      return nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKey.toBytes()
      );
    } catch (error) {
      console.error("Signature verification failed:", error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    try {
      const session = await secureStorageManager.getSession();
      if (session) {
        // Delete session from database
        await supabaseAdmin.from("sessions").delete().eq("id", session.id);
      }

      await secureStorageManager.clearSensitiveData();
    } catch (error: any) {
      console.error("Sign out failed:", error);
      throw new Error(`Sign out failed: ${error.message}`);
    }
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    return await this.getUserProfile();
  }

  async refreshSession(): Promise<UserSession | null> {
    try {
      const currentSession = await secureStorageManager.getSession();
      if (!currentSession) return null;

      const expiresAt = new Date(currentSession.expires_at);
      if (expiresAt <= new Date()) {
        await this.signOut();
        return null;
      }

      // Update session expiry
      const newExpiresAt = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const { data: updatedSession, error } = await supabaseAdmin
        .from("sessions")
        .update({
          expires_at: newExpiresAt,
        })
        .eq("id", currentSession.id)
        .select()
        .single();

      if (error) throw error;

      await secureStorageManager.setSession(updatedSession);
      return updatedSession;
    } catch (error: any) {
      console.error("Session refresh failed:", error);
      return null;
    }
  }

  async getSession(): Promise<UserSession | null> {
    try {
      const session = await secureStorageManager.getSession();
      return session;
    } catch (error) {
      console.error("❌ Error getting session:", error);
      return null;
    }
  }

  async clearSession(): Promise<void> {
    try {
      console.log("🗑️ Clearing all auth data...");
      await secureStorageManager.clearSensitiveData();
      console.log("✅ Auth data cleared");
    } catch (error: any) {
      console.error("Clear session failed:", error);
      throw new Error(`Clear session failed: ${error.message}`);
    }
  }

  async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      const { data: existingUsername, error } = await supabaseAdmin
        .from("profiles")
        .select("username")
        .eq("username", username.toLowerCase().trim())
        .maybeSingle();

      if (error) throw error;
      return !existingUsername;
    } catch (error: any) {
      console.error("Username check failed:", error);
      return false;
    }
  }

  async validateCurrentSession(): Promise<boolean> {
    try {
      const session = await this.getSession();
      if (!session) {
        return false;
      }

      // Check expiration
      const expiresAt = new Date(session.expires_at);
      if (expiresAt <= new Date()) {
        console.log("⏰ Session has expired");
        return false;
      }

      // Verify session exists in database
      const { data: dbSession, error } = await supabaseAdmin
        .from("sessions")
        .select("id, user_id, device_id, expires_at")
        .eq("id", session.id)
        .single();

      if (error || !dbSession) {
        console.log("❌ Session not found in database");
        return false;
      }

      // Verify user profile exists and matches
      const userProfile = await this.getUserProfile();
      if (!userProfile || userProfile.id !== session.user_id) {
        console.log("❌ User profile mismatch or missing");
        return false;
      }

      return true;

    } catch (error) {
      console.error("🚨 Session validation failed:", error);
      return false;
    }
  }

  async updateUserProfile(
    profileId: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile> {
    try {
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // Remove wallet_address from updates as it shouldn't be changed
      delete updateData.wallet_address;
      delete updateData.id;

      const { data: updatedProfile, error } = await supabaseAdmin
        .from("profiles")
        .update(updateData)
        .eq("id", profileId)
        .select()
        .single();

      if (error) throw error;

      const profile: UserProfile = {
        ...updatedProfile,
        wallet_address: updatedProfile.wallet_address!,
      };

      await this.saveUserProfile(profile);
      return profile;
    } catch (error: any) {
      console.error("Update user profile failed:", error);
      throw new Error(`Profile update failed: ${error.message}`);
    }
  }

  private async getDeviceId(): Promise<string> {
    let deviceId = await secureStorageManager.getAuthItem("device_id");
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${randomUUID()}`;
      await secureStorageManager.setAuthItem("device_id", deviceId);
    }
    return deviceId;
  }

  private getUserAgent(): string {
    return "Zypp-Wallet-Mobile";
  }

  // Debug method
  async debugStorageState(): Promise<void> {
    await secureStorageManager.debugStorageState();
  }
}

export const authService = new AuthService();