import React from "react";
import { Image, TouchableOpacity, View, ScrollView } from "react-native";
import { SafeAreaView, Text } from "@/components/ui";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

export default function TransactionDetails() {
  const params = useLocalSearchParams();
  
  // In a real app, you'd fetch this data based on the transaction ID
  // For now, we'll use sample data that matches the tapped transaction
  const transaction = {
    id: params.id || '1',
    type: 'receive',
    asset: 'SOL',
    amount: '0.5',
    status: 'confirmed',
    timestamp: '2024-12-29T10:30:00Z',
    from: 'crypto_wallet',
    to: 'josh_scriptz',
    connectionMode: 'online',
    valueUSD: '$125.50',
    networkFee: '0.000005 SOL',
    networkFeeUSD: '$0.0015',
    transactionHash: '5gY72...8hJ9k',
    blockNumber: '246,812,455',
    nonce: '142',
    note: 'Payment for services rendered',
    assetIcon: require("@/assets/images/icons/sol-icon.png"),
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { 
          icon: 'time-outline', 
          color: '#9CA3AF', 
          label: 'Pending Sync',
          description: 'Transaction initiated locally but not yet synced online',
          bgColor: 'bg-gray-500/20',
          textColor: 'text-gray-400'
        };
      case 'sent':
        return { 
          icon: 'share', 
          color: '#FBBF24', 
          label: 'Awaiting Confirmation',
          description: 'Encrypted payload delivered, waiting for confirmation',
          bgColor: 'bg-yellow-500/20',
          textColor: 'text-yellow-400'
        };
      case 'received':
        return { 
          icon: 'download', 
          color: '#60A5FA', 
          label: 'Received (Offline)',
          description: 'Transaction received offline, awaiting verification',
          bgColor: 'bg-blue-500/20',
          textColor: 'text-blue-400'
        };
      case 'syncing':
        return { 
          icon: 'sync-outline', 
          color: '#8B5CF6', 
          label: 'Syncing to Solana',
          description: 'Reconnecting online and verifying on blockchain',
          bgColor: 'bg-purple-500/20',
          textColor: 'text-purple-400'
        };
      case 'confirmed':
        return { 
          icon: 'checkmark-circle', 
          color: '#22C55E', 
          label: 'Confirmed on Solana',
          description: 'Transaction verified and finalized on blockchain',
          bgColor: 'bg-green-500/20',
          textColor: 'text-green-400'
        };
      case 'failed':
        return { 
          icon: 'close-circle', 
          color: '#EF4444', 
          label: 'Failed / Expired',
          description: 'Transaction failed or expired due to network issues',
          bgColor: 'bg-red-500/20',
          textColor: 'text-red-400'
        };
      case 'tipped':
        return { 
          icon: 'heart', 
          color: '#EC4899', 
          label: 'Tipped Successfully',
          description: 'Bonus tip sent after main transaction',
          bgColor: 'bg-pink-500/20',
          textColor: 'text-pink-400'
        };
      default:
        return { 
          icon: 'help-circle', 
          color: '#9CA3AF', 
          label: 'Unknown Status',
          description: 'Transaction status unknown',
          bgColor: 'bg-gray-500/20',
          textColor: 'text-gray-400'
        };
    }
  };

  const statusInfo = getStatusInfo(transaction.status);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      relative: '2 minutes ago' // You'd calculate this relative to now
    };
  };

  const { date, time, relative } = formatDate(transaction.timestamp);

  const handleViewOnExplorer = () => {
    // In a real app, this would open the transaction in Solana Explorer
    console.log('View on explorer:', transaction.transactionHash);
  };

  const handleShare = () => {
    // Share transaction details
    console.log('Share transaction');
  };

  const handleContact = () => {
    // Open contact details or start chat
    console.log('Contact user');
  };

  return (
    <View className="flex-1 bg-black relative">
      {/* Gradient Background */}
      <Image
        source={require("@/assets/images/design/top-gradient.png")}
        className="absolute top-0 left-0 right-0 w-full"
        style={{ height: 400 }}
        resizeMode="cover"
      />

      <SafeAreaView className="flex-1 bg-transparent">
        {/* Header */}
        <View className="w-full px-5 pt-4 pb-4">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-12 h-12 rounded-full bg-white/5 items-center justify-center"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
            >
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>

            <Text className="text-white font-semibold text-xl">Transaction</Text>

            <TouchableOpacity
              onPress={handleShare}
              className="w-12 h-12 rounded-full bg-white/5 items-center justify-center"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
            >
              <Ionicons name="share-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Main Transaction Card */}
          <View className="px-5 mb-6">
            <View className="bg-white/5 rounded-3xl border border-white/10 p-6">
              {/* Amount Section */}
              <View className="items-center mb-6">
                <View className={`w-20 h-20 rounded-2xl items-center justify-center ${
                  transaction.type === 'receive' ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  <Ionicons 
                    name={transaction.type === 'receive' ? 'arrow-down' : 'arrow-up'} 
                    size={32} 
                    color={transaction.type === 'receive' ? '#22C55E' : '#EF4444'} 
                  />
                </View>
                <Text className={`text-3xl font-semibold mt-4 ${
                  transaction.type === 'receive' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {transaction.type === 'receive' ? '+' : '-'}{transaction.amount} {transaction.asset}
                </Text>
                <Text className="text-white/60 text-lg mt-2">
                  {transaction.valueUSD}
                </Text>
                <Text className="text-white/40 text-sm mt-1">
                  {relative}
                </Text>
              </View>

              {/* Status Badge */}
              <View className={`flex-row items-center justify-center gap-2 py-3 rounded-2xl mb-6 ${statusInfo.bgColor}`}>
                <Ionicons name={statusInfo.icon} size={20} color={statusInfo.color} />
                <Text className={`font-semibold ${statusInfo.textColor}`}>
                  {statusInfo.label}
                </Text>
              </View>

              {/* Status Description */}
              <Text className="text-white/60 text-center text-sm mb-6">
                {statusInfo.description}
              </Text>

              {/* Primary Action Buttons */}
              <View className="flex-row gap-3 mb-6">
                <TouchableOpacity 
                  onPress={handleViewOnExplorer}
                  className="flex-1 bg-primary h-14 justify-center rounded-full items-center"
                >
                  <Text className="text-primary-foreground font-semibold">View on Explorer</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleContact}
                  className="flex-1 bg-white/10 h-14 justify-center rounded-full items-center border border-white/20"
                >
                  <Text className="text-white font-semibold">Contact</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Transaction Details */}
          <View className="px-5 mb-6">
            <Text className="text-white font-semibold text-xl mb-4">Transaction Details</Text>
            
            <View className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
              {/* Date & Time */}
              <View className="p-4 border-b border-white/10">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
                    <Text className="text-white font-medium">Date & Time</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-white">{date}</Text>
                    <Text className="text-white/60 text-sm">{time}</Text>
                  </View>
                </View>
              </View>

              {/* From/To */}
              <View className="p-4 border-b border-white/10">
                <View className="flex-row justify-between items-start">
                  <View className="flex-row items-center gap-3">
                    <Ionicons 
                      name={transaction.type === 'receive' ? 'person-outline' : 'person-add-outline'} 
                      size={20} 
                      color="#9CA3AF" 
                    />
                    <Text className="text-white font-medium">
                      {transaction.type === 'receive' ? 'From' : 'To'}
                    </Text>
                  </View>
                  <View className="items-end flex-1 ml-4">
                    <Text className="text-white text-right">
                      {transaction.type === 'receive' ? transaction.from : transaction.to}
                    </Text>
                    <View className="flex-row items-center gap-1 mt-1">
                      <Ionicons 
                        name={transaction.connectionMode === 'offline' ? 'cellular-outline' : 'wifi-outline'} 
                        size={12} 
                        color="#9CA3AF" 
                      />
                      <Text className="text-white/60 text-xs">
                        {transaction.connectionMode === 'offline' ? 'Offline Mode' : 'Online Mode'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Transaction Hash */}
              <View className="p-4 border-b border-white/10">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="fingerprint-outline" size={20} color="#9CA3AF" />
                    <Text className="text-white font-medium">Transaction ID</Text>
                  </View>
                  <TouchableOpacity>
                    <Text className="text-primary font-medium">{transaction.transactionHash}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Network Fee */}
              <View className="p-4 border-b border-white/10">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="flash-outline" size={20} color="#9CA3AF" />
                    <Text className="text-white font-medium">Network Fee</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-white">{transaction.networkFee}</Text>
                    <Text className="text-white/60 text-sm">{transaction.networkFeeUSD}</Text>
                  </View>
                </View>
              </View>

              {/* Block Number */}
              <View className="p-4 border-b border-white/10">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="cube-outline" size={20} color="#9CA3AF" />
                    <Text className="text-white font-medium">Block</Text>
                  </View>
                  <Text className="text-white">{transaction.blockNumber}</Text>
                </View>
              </View>

              {/* Nonce */}
              <View className="p-4">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="list-outline" size={20} color="#9CA3AF" />
                    <Text className="text-white font-medium">Nonce</Text>
                  </View>
                  <Text className="text-white">{transaction.nonce}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Notes Section */}
          {transaction.note && (
            <View className="px-5 mb-6">
              <Text className="text-white font-semibold text-xl mb-4">Note</Text>
              <View className="bg-white/5 rounded-3xl border border-white/10 p-4">
                <Text className="text-white/80 text-base leading-6">
                  {transaction.note}
                </Text>
              </View>
            </View>
          )}

          {/* Transaction Timeline */}
          <View className="px-5">
            <Text className="text-white font-semibold text-xl mb-4">Transaction Timeline</Text>
            <View className="bg-white/5 rounded-3xl border border-white/10 p-4">
              {/* Timeline steps would go here */}
              <View className="flex-row items-center gap-3 py-2">
                <View className="w-3 h-3 bg-green-400 rounded-full" />
                <Text className="text-white flex-1">Transaction created offline</Text>
                <Text className="text-white/60 text-sm">10:28 AM</Text>
              </View>
              <View className="flex-row items-center gap-3 py-2">
                <View className="w-3 h-3 bg-green-400 rounded-full" />
                <Text className="text-white flex-1">Encrypted payload delivered</Text>
                <Text className="text-white/60 text-sm">10:29 AM</Text>
              </View>
              <View className="flex-row items-center gap-3 py-2">
                <View className="w-3 h-3 bg-green-400 rounded-full" />
                <Text className="text-white flex-1">Confirmed on Solana</Text>
                <Text className="text-white/60 text-sm">10:30 AM</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}