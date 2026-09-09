/**
 * Hand-written to match supabase/migrations/0001_init.sql. Once a Supabase
 * project exists you can regenerate this with:
 *   npx supabase gen types typescript --linked > src/lib/database.types.ts
 * Keep the two in sync until then.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Discovery + verification model for a group (see CLAUDE.md core principles). */
export type JoinPolicy = 'open' | 'students';
export type MemberRole = 'host' | 'member';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          display_name: string;
          age: number | null;
          bio: string | null;
          avatar_url: string | null;
          new_to_dublin: boolean;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          display_name: string;
          age?: number | null;
          bio?: string | null;
          avatar_url?: string | null;
          new_to_dublin?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          display_name?: string;
          age?: number | null;
          bio?: string | null;
          avatar_url?: string | null;
          new_to_dublin?: boolean;
        };
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          created_at: string;
          host_id: string;
          name: string;
          category: string;
          description: string | null;
          join_policy: JoinPolicy;
          member_count: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          host_id: string;
          name: string;
          category: string;
          description?: string | null;
          join_policy?: JoinPolicy;
          member_count?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          host_id?: string;
          name?: string;
          category?: string;
          description?: string | null;
          join_policy?: JoinPolicy;
          member_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'groups_host_id_fkey';
            columns: ['host_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
          role: MemberRole;
          joined_at: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
          role?: MemberRole;
          joined_at?: string;
        };
        Update: {
          group_id?: string;
          user_id?: string;
          role?: MemberRole;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'group_members_group_id_fkey';
            columns: ['group_id'];
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_members_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          created_at: string;
          group_id: string;
          sender_id: string;
          body: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          group_id: string;
          sender_id: string;
          body: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          group_id?: string;
          sender_id?: string;
          body?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_group_id_fkey';
            columns: ['group_id'];
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_sender_id_fkey';
            columns: ['sender_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_group_member: {
        Args: { gid: string; uid: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
