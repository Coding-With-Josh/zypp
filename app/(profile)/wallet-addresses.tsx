import { Input, SafeAreaView, Text, View } from "@/components/ui";
import { alert } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useWallet } from "@/contexts/WalletContext";
import { formatCurrency } from "@/lib/utils/currency";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Share,
  TouchableOpacity,
} from "react-native";

export default function WalletAddressesScreen() {
  const {
    wallet,
    balance,
    isLoading,
    createWallet,
    importWallet,
    unlockWallet,
    isUnlocked,
    refreshData,
  } = useWallet();

  const [addresses, setAddresses] = useState(() => {
    if (!wallet) return [];

    return [
      {
        id: wallet.id,
        name: "Primary Wallet",
        address: wallet.public_key,
        type: "SOL",
        balance: formatCurrency(balance?.sol_balance || 0, "SOL"),
        isPrimary: true,
        created_at: wallet.created_at,
      },
    ];
  });

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [pin, setPin] = useState("");
  const [mnemonic, setMnemonic] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [savedMnemonic, setSavedMnemonic] = useState<string | null>(null);
  const [showRecoveryPhrase, setShowRecoveryPhrase] = useState(false);

  // Effect to refresh balances periodically
  useEffect(() => {
    if (isUnlocked) {
      const interval = setInterval(() => {
        refreshData();
      }, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isUnlocked, refreshData]);

  // Effect to update balances when they change
  useEffect(() => {
    if (wallet && balance) {
      setAddresses([
        {
          id: wallet.id,
          name: "Primary Wallet",
          address: wallet.public_key,
          type: "SOL",
          balance: formatCurrency(balance.sol_balance || 0, "SOL"),
          isPrimary: true,
          created_at: wallet.created_at,
        },
      ]);
    }
  }, [wallet, balance]);

  const handleCopyAddress = async (address: string) => {
    try {
      await Clipboard.setStringAsync(address);
      alert("Success", "Wallet address copied to clipboard");
    } catch (error: any) {
      alert("Error", error.message || "Failed to copy address");
    }
  };

  const handleShareAddress = async (address: string) => {
    try {
      await Share.share({
        message: `My Zypp wallet address: ${address}`,
      });
    } catch {
      alert("Error", "Failed to share address");
    }
  };

  const handleShowRecovery = () => {
    alert(
      "Warning",
      "Never share your recovery phrase with anyone. It provides full access to your wallet.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Show",
          onPress: () => setShowRecoveryPhrase(true),
        },
      ]
    );
  };

  const handleAddWallet = () => {
    alert("Add Wallet", "How would you like to add a wallet?", [
      {
        text: "Create New",
        onPress: () => setShowCreateDialog(true),
      },
      {
        text: "Import Existing",
        onPress: () => setShowImportDialog(true),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const handleCreateWallet = async () => {
    if (!pin) {
      alert("Error", "Please enter a PIN");
      return;
    }

    try {
      setIsCreating(true);
      const result = await createWallet(pin);
      setSavedMnemonic(result.mnemonic);
      setShowCreateDialog(false);
      alert(
        "Important",
        "Please save your recovery phrase somewhere safe. You will need it to recover your wallet if you lose access.",
        [
          {
            text: "Copy Phrase",
            onPress: async () => {
              await Clipboard.setStringAsync(result.mnemonic);
              alert("Success", "Recovery phrase copied to clipboard");
            },
          },
          {
            text: "Done",
            onPress: () => setSavedMnemonic(null),
          },
        ]
      );
      await refreshData();
    } catch (error: any) {
      alert("Error", error.message || "Failed to create wallet");
    } finally {
      setIsCreating(false);
      setPin("");
    }
  };

  const handleImportWallet = async () => {
    if (!pin || !mnemonic) {
      alert("Error", "Please enter both PIN and recovery phrase");
      return;
    }

    try {
      setIsImporting(true);
      await importWallet(mnemonic, pin);
      setShowImportDialog(false);
      alert("Success", "Wallet imported successfully");
      await refreshData();
    } catch (error: any) {
      alert("Error", error.message || "Failed to import wallet");
    } finally {
      setIsImporting(false);
      setPin("");
      setMnemonic("");
    }
  };

  const handleUnlockWallet = async () => {
    if (!pin) {
      alert("Error", "Please enter your PIN");
      return;
    }

    try {
      setIsCreating(true);
      await unlockWallet(pin);
      setShowCreateDialog(false);
      await refreshData();
    } catch (error: any) {
      alert("Error", error.message || "Failed to unlock wallet");
    } finally {
      setIsCreating(false);
      setPin("");
    }
  };

  return (
    <View className="flex-1 bg-black">
      <Image
        source={require("@/assets/images/design/top-gradient.png")}
        className="absolute top-0 left-0 right-0 w-full"
        style={{ height: 400 }}
        resizeMode="cover"
      />
      <SafeAreaView className="flex-1 bg-transparent">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white font-semibold text-xl">
            Wallet Addresses
          </Text>
          <TouchableOpacity onPress={handleAddWallet} className="p-2">
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 py-6">
          <Text className="text-white/60 text-sm mb-6">
            Manage your wallet addresses and view balances
          </Text>

          {isLoading && !addresses.length ? (
            <View className="flex-1 items-center justify-center py-12">
              <ActivityIndicator size="large" color="#22C55E" />
              <Text className="text-white/60 mt-4">Loading wallets...</Text>
            </View>
          ) : !isUnlocked ? (
            <View className="p-6 bg-black/15 rounded-2xl border border-white/10">
              <Text className="text-white font-semibold text-lg mb-2">
                Wallet Locked
              </Text>
              <Text className="text-white/60 mb-4">
                Enter your PIN to view your wallets and balances
              </Text>
              <Input
                value={pin}
                onChangeText={setPin}
                placeholder="Enter PIN"
                secureTextEntry
                className="bg-black/15 border-white/10 pl-4 text-white rounded-2xl mb-4"
                keyboardType="numeric"
              />
              <TouchableOpacity
                onPress={handleUnlockWallet}
                className="bg-primary rounded-2xl py-4 items-center"
                disabled={isCreating}
              >
                <Text className="text-primary-foreground font-semibold">
                  {isCreating ? "Unlocking..." : "Unlock Wallet"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            addresses.map((wallet, index) => (
              <View key={wallet.id} className="mb-4">
                <View className="bg-black/15 rounded-2xl border border-white/10 p-4">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <Text className="text-white font-semibold text-lg mr-2">
                        {wallet.name}
                      </Text>
                      {wallet.isPrimary && (
                        <View className="bg-primary/20 px-2 py-1 rounded-full">
                          <Text className="text-primary text-xs font-medium">
                            Primary
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-row items-center">
                      <TouchableOpacity
                        onPress={handleShowRecovery}
                        className="mr-3"
                      >
                        <IconSymbol name="key" size={16} color="#22C55E" />
                      </TouchableOpacity>
                      <Text className="text-white font-semibold">
                        {wallet.balance}
                      </Text>
                    </View>
                  </View>{" "}
                  <Text className="text-white/60 text-sm mb-3 font-mono">
                    {wallet.address}
                  </Text>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => handleCopyAddress(wallet.address)}
                      className="flex-1 flex-row items-center justify-center gap-2 bg-black/15 py-2 rounded-xl"
                    >
                      <IconSymbol name="doc.on.doc" size={16} color="white" />
                      <Text className="text-white text-sm font-medium">
                        Copy
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleShareAddress(wallet.address)}
                      className="flex-1 flex-row items-center justify-center gap-2 bg-primary/20 py-2 rounded-xl"
                    >
                      <IconSymbol
                        name="square.and.arrow.up"
                        size={16}
                        color="#22C55E"
                      />
                      <Text className="text-primary text-sm font-medium">
                        Share
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}

          {/* Add New Wallet */}
          {isUnlocked && (
            <TouchableOpacity
              onPress={handleAddWallet}
              className="border-2 border-dashed border-white/20 rounded-2xl p-6 items-center justify-center mt-4"
            >
              <Ionicons name="add-circle-outline" size={32} color="#9CA3AF" />
              <Text className="text-white/60 font-medium mt-2">
                Add New Wallet
              </Text>
              <Text className="text-white/40 text-sm mt-1">
                Create additional wallet addresses
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Create Wallet Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Text className="text-lg font-semibold text-white">
                Create New Wallet
              </Text>
            </DialogTitle>
            <DialogDescription>
              <Text className="text-sm text-white/60">
                Set a PIN to secure your new wallet. You&apos;ll need this PIN
                to access your wallet later.
              </Text>
            </DialogDescription>
          </DialogHeader>

          <View className="mt-4">
            <Input
              value={pin}
              onChangeText={setPin}
              placeholder="Enter PIN"
              secureTextEntry
              className="bg-black/15 border-white/10 pl-4 text-white rounded-2xl"
              keyboardType="numeric"
            />
          </View>

          <DialogFooter>
            <View className="flex-row justify-end gap-2">
              <TouchableOpacity
                className="bg-background border border-border px-4 py-2 rounded-lg"
                onPress={() => {
                  setShowCreateDialog(false);
                  setPin("");
                }}
              >
                <Text className="text-white">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`bg-primary px-4 py-2 rounded-lg ${isCreating || !pin ? "opacity-50" : ""}`}
                onPress={handleCreateWallet}
                disabled={isCreating || !pin}
              >
                <Text className="text-white">
                  {isCreating ? "Creating..." : "Create"}
                </Text>
              </TouchableOpacity>
            </View>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Wallet Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Text className="text-lg font-semibold text-white">
                Import Wallet
              </Text>
            </DialogTitle>
            <DialogDescription>
              <Text className="text-sm text-white/60">
                Enter your recovery phrase and set a PIN to import your wallet.
              </Text>
            </DialogDescription>
          </DialogHeader>

          <View className="mt-4 gap-4">
            <Input
              value={mnemonic}
              onChangeText={setMnemonic}
              placeholder="Recovery Phrase"
              multiline
              numberOfLines={3}
              className="bg-black/15 border-white/10 pl-4 text-white rounded-2xl min-h-[100px]"
              textAlignVertical="top"
            />
            <Input
              value={pin}
              onChangeText={setPin}
              placeholder="Enter PIN"
              secureTextEntry
              className="bg-black/15 border-white/10 pl-4 text-white rounded-2xl"
              keyboardType="numeric"
            />
          </View>

          <DialogFooter>
            <View className="flex-row justify-end gap-2">
              <TouchableOpacity
                className="bg-background border border-border px-4 py-2 rounded-lg"
                onPress={() => {
                  setShowImportDialog(false);
                  setPin("");
                  setMnemonic("");
                }}
              >
                <Text className="text-white">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`bg-primary px-4 py-2 rounded-lg ${isImporting || !pin || !mnemonic ? "opacity-50" : ""}`}
                onPress={handleImportWallet}
                disabled={isImporting || !pin || !mnemonic}
              >
                <Text className="text-white">
                  {isImporting ? "Importing..." : "Import"}
                </Text>
              </TouchableOpacity>
            </View>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recovery Phrase Show Dialog */}
      <Dialog open={showRecoveryPhrase} onOpenChange={setShowRecoveryPhrase}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Text className="text-lg font-semibold text-white">
                Show Recovery Phrase
              </Text>
            </DialogTitle>
            <DialogDescription>
              <Text className="text-sm text-white/60">
                This recovery phrase gives full access to your wallet. Never
                share it with anyone.
              </Text>
            </DialogDescription>
          </DialogHeader>

          <View className="mt-4">
            <Text className="text-white/60">Coming soon</Text>
          </View>

          <DialogFooter>
            <View className="flex-row justify-end gap-2">
              <TouchableOpacity
                className="bg-primary px-4 py-2 rounded-lg"
                onPress={() => setShowRecoveryPhrase(false)}
              >
                <Text className="text-white">Close</Text>
              </TouchableOpacity>
            </View>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recovery Phrase Saved Dialog */}
      <Dialog
        open={!!savedMnemonic}
        onOpenChange={(open) => !open && setSavedMnemonic(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Text className="text-lg font-semibold text-white">
                Save Recovery Phrase
              </Text>
            </DialogTitle>
            <DialogDescription>
              <Text className="text-sm text-white/60">
                Write down or copy these 12 words in the exact order.
                You&apos;ll need them to recover your wallet.
              </Text>
            </DialogDescription>
          </DialogHeader>

          <View className="mt-4 p-4 bg-black/15 rounded-2xl">
            <Text className="text-white font-mono">{savedMnemonic}</Text>
          </View>

          <DialogFooter>
            <View className="flex-row justify-end gap-2">
              <TouchableOpacity
                className="bg-background border border-border px-4 py-2 rounded-lg"
                onPress={async () => {
                  if (savedMnemonic) {
                    await Clipboard.setStringAsync(savedMnemonic);
                    alert("Success", "Recovery phrase copied to clipboard");
                  }
                }}
              >
                <Text className="text-white">Copy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-primary px-4 py-2 rounded-lg"
                onPress={() => setSavedMnemonic(null)}
              >
                <Text className="text-white">Done</Text>
              </TouchableOpacity>
            </View>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  );
}
