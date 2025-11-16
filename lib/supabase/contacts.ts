import { UserProfile } from "@/types";
import { supabase } from "./client";

interface Contact {
  id: string;
  user_id: string;
  contact_user_id: string;
  contact_username: string;
  contact_public_key: string;
  nickname?: string;
  tags?: string[];
  is_favorite?: boolean;
  last_interaction?: string;
  transaction_count?: number;
  created_at?: string;
}

class ContactsService {
  async getRecentContacts(userId: string): Promise<UserProfile[]> {
    try {
      // First get contact IDs
      const { data: contacts, error: contactsError } = await supabase
        .from("contacts")
        .select("contact_user_id")
        .eq("user_id", userId)
        .order("last_interaction", { ascending: false })
        .limit(10);

      if (contactsError) throw contactsError;

      // Then get the actual user profiles
      const contactIds = contacts.map((contact) => contact.contact_user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", contactIds);

      if (profilesError) throw profilesError;

      return profiles as UserProfile[];
    } catch (error) {
      console.error("Failed to get recent contacts:", error);
      throw error;
    }
  }

  async addContact(userId: string, contactId: string): Promise<void> {
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("username, wallet_address")
        .eq("id", contactId)
        .single();

      if (profileError) throw profileError;

      const contactData: Contact = {
        id: `${userId}_${contactId}`,
        user_id: userId,
        contact_user_id: contactId,
        contact_username: profile.username,
        contact_public_key: profile.wallet_address || "",
        last_interaction: new Date().toISOString(),
        transaction_count: 0,
        is_favorite: false,
      };

      const { error } = await supabase.from("contacts").insert(contactData);

      if (error) throw error;
    } catch (error) {
      console.error("Failed to add contact:", error);
      throw error;
    }
  }

  async updateContactLastInteraction(
    userId: string,
    contactId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("contacts")
        .update({
          last_interaction: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("contact_user_id", contactId);

      if (error) throw error;
    } catch (error) {
      console.error("Failed to update contact last interaction:", error);
      throw error;
    }
  }

  async removeContact(userId: string, contactId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("user_id", userId)
        .eq("contact_user_id", contactId);

      if (error) throw error;
    } catch (error) {
      console.error("Failed to remove contact:", error);
      throw error;
    }
  }

  async getContactDetails(
    userId: string,
    contactId: string
  ): Promise<UserProfile> {
    try {
      // First verify the contact exists
      const { error: contactError } = await supabase
        .from("contacts")
        .select()
        .eq("user_id", userId)
        .eq("contact_user_id", contactId)
        .single();

      if (contactError) throw contactError;

      // Then get the contact's profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", contactId)
        .single();

      if (profileError) throw profileError;

      return profile as UserProfile;
    } catch (error) {
      console.error("Failed to get contact details:", error);
      throw error;
    }
  }
}

export const contactsService = new ContactsService();
