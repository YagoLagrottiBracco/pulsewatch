export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          user_id: string
          email: string
          full_name: string | null
          telegram_chat_id: string | null
          telegram_username: string | null
          email_notifications: boolean
          telegram_notifications: boolean
          onboarding_completed: boolean
          onboarding_completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          full_name?: string | null
          telegram_chat_id?: string | null
          telegram_username?: string | null
          email_notifications?: boolean
          telegram_notifications?: boolean
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          full_name?: string | null
          telegram_chat_id?: string | null
          telegram_username?: string | null
          email_notifications?: boolean
          telegram_notifications?: boolean
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stores: {
        Row: {
          id: string
          user_id: string
          name: string
          domain: string
          platform: 'shopify' | 'woocommerce' | 'nuvemshop' | 'unknown'
          platform_config: Json | null
          is_active: boolean
          status: 'online' | 'offline' | 'checking'
          last_check: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          domain: string
          platform?: 'shopify' | 'woocommerce' | 'nuvemshop' | 'unknown'
          platform_config?: Json | null
          is_active?: boolean
          status?: 'online' | 'offline' | 'checking'
          last_check?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          domain?: string
          platform?: 'shopify' | 'woocommerce' | 'nuvemshop' | 'unknown'
          platform_config?: Json | null
          is_active?: boolean
          status?: 'online' | 'offline' | 'checking'
          last_check?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          store_id: string
          external_id: string
          name: string
          sku: string | null
          price: number
          stock_quantity: number
          stock_status: string
          last_synced: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          external_id: string
          name: string
          sku?: string | null
          price: number
          stock_quantity?: number
          stock_status: string
          last_synced?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          external_id?: string
          name?: string
          sku?: string | null
          price?: number
          stock_quantity?: number
          stock_status?: string
          last_synced?: string
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          store_id: string
          external_id: string
          order_number: string
          customer_email: string
          total: number
          status: string
          order_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          external_id: string
          order_number: string
          customer_email: string
          total: number
          status: string
          order_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          external_id?: string
          order_number?: string
          customer_email?: string
          total?: number
          status?: string
          order_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      alerts: {
        Row: {
          id: string
          store_id: string
          type: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          title: string
          message: string
          metadata: Json | null
          is_read: boolean
          email_sent: boolean
          telegram_sent: boolean
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          type: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
          title: string
          message: string
          metadata?: Json | null
          is_read?: boolean
          email_sent?: boolean
          telegram_sent?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          type?: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
          title?: string
          message?: string
          metadata?: Json | null
          is_read?: boolean
          email_sent?: boolean
          telegram_sent?: boolean
          created_at?: string
        }
      }
      alert_rules: {
        Row: {
          id: string
          user_id: string
          store_id: string | null
          name: string
          type: string
          condition: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          store_id?: string | null
          name: string
          type: string
          condition: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          store_id?: string | null
          name?: string
          type?: string
          condition?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          email: string
          name: string | null
          company: string | null
          message: string | null
          source: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          company?: string | null
          message?: string | null
          source?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          company?: string | null
          message?: string | null
          source?: string | null
          created_at?: string
        }
      }
      blog_posts: {
        Row: {
          id: string
          title: string
          slug: string
          excerpt: string | null
          content: string
          cover_image: string | null
          author_id: string | null
          status: 'draft' | 'published' | 'archived'
          published_at: string | null
          created_at: string
          updated_at: string
          views: number | null
          tags: string[] | null
          seo_title: string | null
          seo_description: string | null
          seo_og_image: string | null
          seo_keywords: string | null
          is_page: boolean | null
        }
        Insert: {
          id?: string
          title: string
          slug: string
          excerpt?: string | null
          content: string
          cover_image?: string | null
          author_id?: string | null
          status?: 'draft' | 'published' | 'archived'
          published_at?: string | null
          created_at?: string
          updated_at?: string
          views?: number | null
          tags?: string[] | null
          seo_title?: string | null
          seo_description?: string | null
          seo_og_image?: string | null
          seo_keywords?: string | null
          is_page?: boolean | null
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          excerpt?: string | null
          content?: string
          cover_image?: string | null
          author_id?: string | null
          status?: 'draft' | 'published' | 'archived'
          published_at?: string | null
          created_at?: string
          updated_at?: string
          views?: number | null
          tags?: string[] | null
          seo_title?: string | null
          seo_description?: string | null
          seo_og_image?: string | null
          seo_keywords?: string | null
          is_page?: boolean | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
