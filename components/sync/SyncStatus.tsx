import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSyncContext } from '@/contexts/SyncContext';
import { IconSymbol } from '@/components/ui/IconSymbol';

export const SyncStatus: React.FC = () => {
  const {
    syncState,
    isOnline,
    isSyncing,
    hasPendingChanges,
    lastSyncTime,
    syncError,
    sync,
    forceSync,
    clearErrors
  } = useSyncContext();

  const getStatusColor = () => {
    if (!isOnline) return 'text-orange-500';
    if (syncError) return 'text-red-500';
    if (hasPendingChanges) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isSyncing) return 'Syncing...';
    if (syncError) return 'Sync Error';
    if (hasPendingChanges) return 'Pending Changes';
    return 'Synced';
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSyncTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return lastSyncTime.toLocaleDateString();
  };

  return (
    <View className="bg-white/5 rounded-lg p-4 border border-white/10">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className={`w-3 h-3 rounded-full ${getStatusColor().replace('text-', 'bg-')}`} />
          
          <View>
            <Text className="text-white font-semibold text-base">
              {getStatusText()}
            </Text>
            <Text className="text-white/60 text-sm">
              Last sync: {formatLastSync()}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          {isSyncing && (
            <ActivityIndicator size="small" color="#10B981" />
          )}
          
          {syncError && (
            <TouchableOpacity onPress={clearErrors} className="p-1">
              <IconSymbol name="xmark.circle" color="#EF4444" size={16} />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            onPress={isSyncing ? undefined : forceSync}
            disabled={isSyncing || !isOnline}
            className={`px-3 py-1 rounded-full ${
              isSyncing || !isOnline 
                ? 'bg-gray-500/50' 
                : 'bg-primary'
            }`}
          >
            <Text className="text-white text-sm font-medium">
              {isSyncing ? 'Syncing...' : 'Sync'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {(hasPendingChanges || syncError) && (
        <View className="mt-3 pt-3 border-t border-white/10">
          {hasPendingChanges && (
            <Text className="text-yellow-400 text-sm">
              {syncState.pending_transactions} pending transactions
            </Text>
          )}
          
          {syncError && (
            <Text className="text-red-400 text-sm">
              {syncError}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};