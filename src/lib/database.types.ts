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
      plans: {
        Row: {
          id: string;
          created_at: string;
          group_id: string;
          created_by: string;
          title: string;
          details: string | null;
          location: string | null;
          starts_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          group_id: string;
          created_by: string;
          title: string;
          details?: string | null;
          location?: string | null;
          starts_at: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          group_id?: string;
          created_by?: string;
          title?: string;
          details?: string | null;
          location?: string | null;
          starts_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'plans_group_id_fkey';
            columns: ['group_id'];
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
        ];
      };
      plan_rsvps: {
        Row: {
          plan_id: string;
          user_id: string;
          status: 'in' | 'out';
          created_at: string;
        };
        Insert: {
          plan_id: string;
          user_id: string;
          status?: 'in' | 'out';
          created_at?: string;
        };
        Update: {
          plan_id?: string;
          user_id?: string;
          status?: 'in' | 'out';
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'plan_rsvps_plan_id_fkey';
            columns: ['plan_id'];
            referencedRelation: 'plans';
            referencedColumns: ['id'];
          },
        ];
      };
      event_rooms: {
        Row: {
          id: string;
          created_at: string;
          ticketmaster_id: string;
          name: string;
          venue: string | null;
          starts_at: string | null;
          url: string | null;
          going_count: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          ticketmaster_id: string;
          name: string;
          venue?: string | null;
          starts_at?: string | null;
          url?: string | null;
          going_count?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          ticketmaster_id?: string;
          name?: string;
          venue?: string | null;
          starts_at?: string | null;
          url?: string | null;
          going_count?: number;
        };
        Relationships: [];
      };
      event_attendees: {
        Row: {
          event_id: string;
          user_id: string;
          pint: boolean;
          created_at: string;
        };
        Insert: {
          event_id: string;
          user_id: string;
          pint?: boolean;
          created_at?: string;
        };
        Update: {
          event_id?: string;
          user_id?: string;
          pint?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_attendees_event_id_fkey';
            columns: ['event_id'];
            referencedRelation: 'event_rooms';
            referencedColumns: ['id'];
          },
        ];
      };
      event_messages: {
        Row: {
          id: string;
          created_at: string;
          event_id: string;
          sender_id: string;
          body: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          event_id: string;
          sender_id: string;
          body: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          event_id?: string;
          sender_id?: string;
          body?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_messages_event_id_fkey';
            columns: ['event_id'];
            referencedRelation: 'event_rooms';
            referencedColumns: ['id'];
          },
        ];
      };
      pairs: {
        Row: {
          id: string;
          created_at: string;
          requester_id: string;
          partner_id: string;
          status: 'pending' | 'confirmed';
        };
        Insert: {
          id?: string;
          created_at?: string;
          requester_id: string;
          partner_id: string;
          status?: 'pending' | 'confirmed';
        };
        Update: {
          id?: string;
          created_at?: string;
          requester_id?: string;
          partner_id?: string;
          status?: 'pending' | 'confirmed';
        };
        Relationships: [];
      };
      blocks: {
        Row: { blocker_id: string; blocked_id: string; created_at: string };
        Insert: { blocker_id: string; blocked_id: string; created_at?: string };
        Update: { blocker_id?: string; blocked_id?: string; created_at?: string };
        Relationships: [];
      };
      user_reports: {
        Row: {
          id: string;
          created_at: string;
          reporter_id: string;
          reported_id: string;
          context: string | null;
          reason: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          reporter_id: string;
          reported_id: string;
          context?: string | null;
          reason?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          reporter_id?: string;
          reported_id?: string;
          context?: string | null;
          reason?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_group_member: {
        Args: { gid: string; uid: string };
        Returns: boolean;
      };
      plan_group_id: {
        Args: { pid: string };
        Returns: string;
      };
      is_event_attendee: {
        Args: { eid: string; uid: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
