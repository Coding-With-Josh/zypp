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

  // Debug auth state
  const debugAuthState = async () => {
    await authService.debugAuthFlow("AuthProvider mounted");
  };

  // Session recovery function
  const recoverSession = async (): Promise<boolean> => {
    try {
      console.log("🔄 Attempting session recovery...");
      
      const storedSession = await authService.getSession();
      const storedUser = await authService.getCurrentUser();
      
      if (storedSession && storedUser) {
        console.log("🎉 Found session and user in storage, recovering...");
        
        // Update state directly from storage
        setSession(storedSession);
        setUser(storedUser);
        setIsAuthenticated(true);
        
        console.log("✅ Session recovery successful");
        return true;
      }
      
      console.log("❌ No session found for recovery");
      return false;
    } catch (error) {
      console.error("🚨 Session recovery failed:", error);
      return false;
    }
  };

  // Main initialization function - FIXED: No auto-clearing
  const initializeAuth = async (): Promise<boolean> => {
    try {
      console.log("🔐 Initializing authentication...");
      setIsLoading(true);

      // Debug current state before anything
      await authService.debugAuthFlow("Starting auth initialization");

      // Check for existing session
      const storedSession = await authService.getSession();
      
      console.log("📋 Session check result:", {
        hasStoredSession: !!storedSession,
        sessionId: storedSession?.id,
        userId: storedSession?.user_id,
      });

      if (storedSession) {
        console.log("📝 Found stored session, validating...");

        try {
          // Validate session first - DON'T clear session on validation failures
          const isValid = await authService.validateCurrentSession();
          console.log("✅ Session validation result:", isValid);

          if (isValid) {
            console.log("✅ Session is valid, getting user data...");
            const currentUser = await authService.getCurrentUser();

            if (currentUser) {
              console.log("👤 User data retrieved:", {
                userId: currentUser.id,
                username: currentUser.username,
              });

              // Update state
              setSession(storedSession);
              setUser(currentUser);
              setIsAuthenticated(true);
              
              await authService.debugAuthFlow("Auth initialization successful");
              return true;
            } else {
              console.log("❌ No user data found for valid session");
              // Don't clear session here - just return false
              return false;
            }
          } else {
            console.log("❌ Session validation failed");
            // Don't clear session here - just return false
            return false;
          }
        } catch (validationError) {
          console.error("🚨 Session validation error:", validationError);
          // Don't clear session on validation errors
          return false;
        }
      } else {
        console.log("ℹ️ No stored session found");
        return false;
      }

    } catch (error) {
      console.error("🚨 Auth initialization failed:", error);
      // Don't clear session on general errors
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // SINGLE initialization useEffect - REMOVED DUPLICATES
  useEffect(() => {
    const initialize = async () => {
      // Debug initial state
      await debugAuthState();

      // Try normal initialization first
      const success = await initializeAuth();
      
      // If normal initialization failed, try recovery
      if (!success) {
        await recoverSession();
      }
    };
    
    initialize();
  }, []); // Empty dependency array - only run once on mount

  // Session persistence verification - FIXED: Only runs when we have session
  useEffect(() => {
    const verifySessionPersistence = async () => {
      if (session && user) {
        console.log("🔍 VERIFYING SESSION PERSISTENCE...");
        
        // Wait a bit then check if session is still there
        setTimeout(async () => {
          const storedSession = await authService.getSession();
          const storedUser = await authService.getCurrentUser();
          
          console.log("🔍 SESSION PERSISTENCE CHECK:", {
            sessionInState: !!session,
            sessionInStorage: !!storedSession,
            userInState: !!user,
            userInStorage: !!storedUser,
            sessionIdsMatch: session?.id === storedSession?.id,
            userIdsMatch: user?.id === storedUser?.id,
          });
        }, 2000);
      }
    };

    verifySessionPersistence();
  }, [session, user]);

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
      console.log("🔑 Signing in with wallet:", { walletAddress, isTemporary });

      const result = await authService.signInWithWallet(
        walletAddress,
        isTemporary
      );

      console.log("📦 Sign in result:", {
        hasUser: !!result?.user,
        hasSession: !!result?.session,
        user: result?.user,
        sessionId: result?.session?.id,
      });

      if (result && result.user && result.session) {
        // Explicitly save the session first
        await authService.saveSession(result.session);
        console.log("💾 Session saved successfully");

        // Then update state
        setUser(result.user);
        setSession(result.session);
        setIsAuthenticated(true);
        console.log("✅ Auth state updated");

        // Verify everything was saved properly
        await authService.debugAuthFlow("After wallet sign in completed");
        
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
      console.log("🚪 Explicit sign out initiated");
      await authService.signOut();

      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      console.log("✅ Sign out completed");
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