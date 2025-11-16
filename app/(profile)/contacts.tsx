import { Input, SafeAreaView, Text, View } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { contactsService } from "@/lib/supabase/contacts";
import { UserProfile } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";

export default function ContactsScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load contacts on mount
  useEffect(() => {
    const loadContacts = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const recentContacts = await contactsService.getRecentContacts(user.id);
        setContacts(recentContacts);
      } catch (error) {
        console.error("Failed to load contacts:", error);
        Alert.alert("Error", "Failed to load contacts");
      } finally {
        setIsLoading(false);
      }
    };
    loadContacts();
  }, [user]);

  // Filter contacts based on search
  const filteredContacts =
    searchQuery.length > 0
      ? contacts.filter(
          (contact) =>
            contact.display_name
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            contact.username.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : contacts;

  // Open add contact dialog
  const handleAddContact = () => {
    Alert.alert(
      "Add Contact",
      "This feature is coming soon! You'll be able to search and add contacts here."
    );
  };

  const handleContactPress = (contact: UserProfile) => {
    router.push({
      pathname: "/send",
      params: { recipient: contact.username },
    });
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
          <Text className="text-white font-semibold text-xl">Contacts</Text>
          <TouchableOpacity onPress={handleAddContact} className="p-2">
            <Ionicons name="person-add" size={22} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6">
          {/* Search Bar */}
          <View className="mb-6">
            <View className="relative">
              <View className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                <Ionicons name="search" size={20} color="#9CA3AF" />
              </View>
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="bg-black/15 border-white/10 text-white pl-10"
              />
            </View>
          </View>

          {/* Loading State */}
          {isLoading && (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#6B7280" />
            </View>
          )}

          {/* Contacts List */}
          {!isLoading && (
            <View className="gap-3">
              {filteredContacts.map((contact) => (
                <TouchableOpacity
                  key={contact.id}
                  onPress={() => handleContactPress(contact)}
                  className="bg-black/15 rounded-2xl p-4 border border-white/10"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="relative">
                        <Image
                          source={{ uri: contact.avatar_url }}
                          className="w-14 h-14 rounded-xl mr-4"
                        />
                        <View
                          className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-black ${
                            contact.is_online ? "bg-green-400" : "bg-gray-400"
                          }`}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-semibold text-lg">
                          {contact.display_name}
                        </Text>
                        <Text className="text-white/60 text-sm">
                          @{contact.username}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-white/40 text-xs">
                        {contact.last_seen}
                      </Text>
                      <TouchableOpacity className="bg-primary/20 px-3 py-1 rounded-full mt-1">
                        <Text className="text-primary text-xs font-medium">
                          Send
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Empty State */}
          {!isLoading && filteredContacts.length === 0 && (
            <View className="items-center justify-center py-12">
              <Ionicons name="people-outline" size={64} color="#6B7280" />
              <Text className="text-white/60 text-lg font-medium mt-4">
                No contacts found
              </Text>
              <Text className="text-white/40 text-center mt-2">
                {searchQuery
                  ? "No contacts match your search"
                  : "You haven't added any contacts yet"}
              </Text>
              <TouchableOpacity
                onPress={handleAddContact}
                className="bg-primary px-6 py-3 rounded-full mt-4"
              >
                <Text className="text-primary-foreground font-semibold">
                  Add First Contact
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
