// contexts/AuthContext.tsx
import { authService } from "@/lib/supabase/auth";
import { profileService } from "@/lib/supabase/profile";
import { UserProfile, UserSession, Web3Signature } from "@/types";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthContextType {
  // State
  user: UserProfile | null;
  session: UserSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  signInWithWeb3: (
    walletAddress: string,
    signature: Web3Signature
  ) => Promise<void>;
  signInWithWallet: (
    walletAddress: string,
    isTemporary?: boolean
  ) => Promise<{ user: UserProfile; session: UserSession }>;
  signUpWithUsername: (
    username: string,
    profileId: string
  ) => Promise<UserProfile>;
  signOut: () => Promise<void>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  refreshSession: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;
  uploadAvatar: (uri: string) => Promise<string>;
  deleteAvatar: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Session recovery function
  const recoverSession = async (): Promise<boolean> => {
    try {
      const storedSession = await authService.getSession();
      const storedUser = await authService.getCurrentUser();
      
      if (storedSession && storedUser) {
        // Update state directly from storage
        setSession(storedSession);
        setUser(storedUser);
        setIsAuthenticated(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("🚨 Session recovery failed:", error);
      return false;
    }
  };

  // Main initialization function - FIXED: No auto-clearing
  const initializeAuth = async (): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Check for existing session
      const storedSession = await authService.getSession();

      if (storedSession) {
        try {
          // Validate session first - DON'T clear session on validation failures
          const isValid = await authService.validateCurrentSession();

          if (isValid) {
            const currentUser = await authService.getCurrentUser();

            if (currentUser) {
              console.log("✅ User authenticated:", currentUser.username);

              // Update state
              setSession(storedSession);
              setUser(currentUser);
              setIsAuthenticated(true);
              return true;
            }
          }
        } catch (validationError) {
          console.error("🚨 Session validation error:", validationError);
          return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error("🚨 Auth initialization failed:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // SINGLE initialization useEffect - REMOVED DUPLICATES
  useEffect(() => {
    const initialize = async () => {
      // Try normal initialization first
      const success = await initializeAuth();
      
      // If normal initialization failed, try recovery
      if (!success) {
        await recoverSession();
      }
    };
    
    initialize();
  }, []); // Empty dependency array - only run once on mount

  // Removed problematic session persistence verification that caused infinite loop

  const signInWithWeb3 = async (
    walletAddress: string,
    signature: Web3Signature
  ): Promise<void> => {
    try {
      setIsLoading(true);
      const result = await authService.signInWithWeb3(walletAddress, signature);

      setUser(result.user);
      setSession(result.session);
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error("Web3 sign in failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // FIXED: signInWithWallet now returns the result
  const signInWithWallet = async (
    walletAddress: string,
    isTemporary: boolean = false
  ): Promise<{ user: UserProfile; session: UserSession }> => {
    try {
      setIsLoading(true);

      const result = await authService.signInWithWallet(
        walletAddress,
        isTemporary
      );

      if (result && result.user && result.session) {
        // Explicitly save the session first
        await authService.saveSession(result.session);

        // Then update state
        setUser(result.user);
        setSession(result.session);
        setIsAuthenticated(true);
        
        console.log("✅ Signed in:", result.user.username);
        
        // Return the result so it can be used by callers
        return result;
      } else {
        console.error("❌ Invalid sign in result:", result);
        throw new Error("Sign in failed - no user or session returned");
      }
    } catch (error: any) {
      console.error("🚨 Wallet sign in failed:", error);
      // Clear any partial state
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithUsername = async (
    username: string,
    profileId: string
  ): Promise<UserProfile> => {
    try {
      setIsLoading(true);
      const updatedUser = await authService.signUpWithUsername(
        username,
        profileId
      );

      if (updatedUser) {
        setUser(updatedUser);
        return updatedUser;
      } else {
        throw new Error("Username update failed - no user returned");
      }
    } catch (error: any) {
      console.error("Username sign up failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authService.signOut();

      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      console.log("✅ Signed out");
    } catch (error: any) {
      console.error("Sign out failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const checkUsernameAvailability = async (
    username: string
  ): Promise<boolean> => {
    return await authService.checkUsernameAvailability(username);
  };

  const refreshSession = async (): Promise<void> => {
    try {
      const newSession = await authService.refreshSession();
      if (newSession) {
        setSession(newSession);
      } else {
        // Session refresh failed, sign out
        await signOut();
      }
    } catch (error: any) {
      console.error("Session refresh failed:", error);
      await signOut();
    }
  };

  const updateUserProfile = async (
    updates: Partial<UserProfile>
  ): Promise<UserProfile> => {
    if (!user?.id) throw new Error("No user authenticated");
    const updatedUser = await authService.updateUserProfile(user.id, updates);
    setUser(updatedUser);
    return updatedUser;
  };

  const uploadAvatar = async (uri: string): Promise<string> => {
    if (!user?.id) throw new Error("No user authenticated");
    const avatarUrl = await profileService.uploadAvatar(user.id, uri);
    await updateUserProfile({ avatar_url: avatarUrl });
    return avatarUrl;
  };

  const deleteAvatar = async (): Promise<void> => {
    if (!user?.id) throw new Error("No user authenticated");
    await profileService.deleteAvatar(user.id);
    await updateUserProfile({ avatar_url: null });
  };

  const value: AuthContextType = {
    // State
    user,
    session,
    isLoading,
    isAuthenticated,

    // Actions
    signInWithWeb3,
    signInWithWallet,
    signUpWithUsername,
    signOut,
    checkUsernameAvailability,
    refreshSession,
    updateUserProfile,
    uploadAvatar,
    deleteAvatar,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};