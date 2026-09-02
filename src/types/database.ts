export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          onboarding_status?: string | null;
          onboarding_step?: number | null;
          onboarding_data?: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          onboarding_status?: string | null;
          onboarding_step?: number | null;
          onboarding_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          onboarding_status?: string | null;
          onboarding_step?: number | null;
          onboarding_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      themes: {
        Row: {
          id: string;
          name: string;
          slug: string;
          config_schema: Json;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          config_schema?: Json;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          config_schema?: Json;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      stores: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          banner_url: string | null;
          theme_id: string | null;
          primary_color: string;
          secondary_color: string;
          description: string | null;
          whatsapp: string | null;
          instagram: string | null;
          facebook: string | null;
          email: string | null;
          business_address: string | null;
          currency: string;
          timezone: string;
          language: string;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          banner_url?: string | null;
          theme_id?: string | null;
          primary_color?: string;
          secondary_color?: string;
          description?: string | null;
          whatsapp?: string | null;
          instagram?: string | null;
          facebook?: string | null;
          email?: string | null;
          business_address?: string | null;
          currency?: string;
          timezone?: string;
          language?: string;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          banner_url?: string | null;
          theme_id?: string | null;
          primary_color?: string;
          secondary_color?: string;
          description?: string | null;
          whatsapp?: string | null;
          instagram?: string | null;
          facebook?: string | null;
          email?: string | null;
          business_address?: string | null;
          currency?: string;
          timezone?: string;
          language?: string;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stores_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      store_settings: {
        Row: {
          id: string;
          store_id: string;
          custom_domain: string | null;
          tax_rate: number;
          shipping_enabled: boolean;
          metadata: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          custom_domain?: string | null;
          tax_rate?: number;
          shipping_enabled?: boolean;
          metadata?: Json;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          custom_domain?: string | null;
          tax_rate?: number;
          shipping_enabled?: boolean;
          metadata?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "store_settings_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: true;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          }
        ];
      };
      categories: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          slug: string;
          description: string | null;
          position: number;
          is_visible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          slug: string;
          description?: string | null;
          position?: number;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          position?: number;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          }
        ];
      };
      products: {
        Row: {
          id: string;
          store_id: string;
          category_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          compare_at_price: number | null;
          is_published: boolean;
          inventory_count: number;
          sku: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          category_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          price?: number;
          compare_at_price?: number | null;
          is_published?: boolean;
          inventory_count?: number;
          sku?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          category_id?: string | null;
          name?: string;
          slug?: string;
          description?: string | null;
          price?: number;
          compare_at_price?: number | null;
          is_published?: boolean;
          inventory_count?: number;
          sku?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          }
        ];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          store_id: string;
          url: string;
          alt_text: string | null;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          store_id: string;
          url: string;
          alt_text?: string | null;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          store_id?: string;
          url?: string;
          alt_text?: string | null;
          position?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          }
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          store_id: string | null;
          user_id: string | null;
          plan: string;
          status: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          razorpay_customer_id?: string | null;
          razorpay_subscription_id?: string | null;
          razorpay_order_id?: string | null;
          razorpay_signature?: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          trial_start?: string | null;
          trial_end?: string | null;
          next_billing_date?: string | null;
          amount?: number | null;
          currency?: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id?: string | null;
          user_id?: string | null;
          plan?: string;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          razorpay_customer_id?: string | null;
          razorpay_subscription_id?: string | null;
          razorpay_order_id?: string | null;
          razorpay_signature?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          trial_start?: string | null;
          trial_end?: string | null;
          next_billing_date?: string | null;
          amount?: number | null;
          currency?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string | null;
          user_id?: string | null;
          plan?: string;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          razorpay_customer_id?: string | null;
          razorpay_subscription_id?: string | null;
          razorpay_order_id?: string | null;
          razorpay_signature?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          trial_start?: string | null;
          trial_end?: string | null;
          next_billing_date?: string | null;
          amount?: number | null;
          currency?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: true;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          }
        ];
      };
      payments: {
        Row: {
          id: string;
          store_id: string | null;
          user_id: string | null;
          plan: string;
          razorpay_payment_id: string | null;
          razorpay_order_id: string | null;
          razorpay_subscription_id: string | null;
          amount: number;
          currency: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id?: string | null;
          user_id?: string | null;
          plan: string;
          razorpay_payment_id?: string | null;
          razorpay_order_id?: string | null;
          razorpay_subscription_id?: string | null;
          amount: number;
          currency?: string;
          status: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string | null;
          user_id?: string | null;
          plan?: string;
          razorpay_payment_id?: string | null;
          razorpay_order_id?: string | null;
          razorpay_subscription_id?: string | null;
          amount?: number;
          currency?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      creative_orders: {
        Row: {
          id: string;
          store_id: string;
          title: string;
          description: string | null;
          status: string;
          assets_url: string | null;
          priority: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          title: string;
          description?: string | null;
          status?: string;
          assets_url?: string | null;
          priority?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          title?: string;
          description?: string | null;
          status?: string;
          assets_url?: string | null;
          priority?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "creative_orders_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          }
        ];
      };
      orders: {
        Row: {
          id: string;
          store_id: string;
          order_number: string;
          customer_name: string;
          customer_phone: string;
          shipping_address: string;
          total_amount: number;
          status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          order_number: string;
          customer_name: string;
          customer_phone: string;
          shipping_address: string;
          total_amount?: number;
          status?: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          order_number?: string;
          customer_name?: string;
          customer_phone?: string;
          shipping_address?: string;
          total_amount?: number;
          status?: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          }
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          price: number;
          quantity: number;
          line_total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          price: number;
          quantity: number;
          line_total: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_name?: string;
          price?: number;
          quantity?: number;
          line_total?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read: boolean;
          link: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type?: string;
          is_read?: boolean;
          link?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: string;
          is_read?: boolean;
          link?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      activity_logs: {
        Row: {
          id: string;
          store_id: string | null;
          user_id: string | null;
          action: string;
          details: Json;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id?: string | null;
          user_id?: string | null;
          action: string;
          details?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string | null;
          user_id?: string | null;
          action?: string;
          details?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      analytics_daily: {
        Row: {
          id: string;
          store_id: string;
          date: string;
          page_views: number;
          total_orders: number;
          total_sales: number;
          unique_visitors: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          date: string;
          page_views?: number;
          total_orders?: number;
          total_sales?: number;
          unique_visitors?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          date?: string;
          page_views?: number;
          total_orders?: number;
          total_sales?: number;
          unique_visitors?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      growth_quest_templates: {
        Row: {
          id: string;
          name: string;
          description: string;
          difficulty: "easy" | "moderate" | "difficult";
          month_duration: number;
          revenue_target: number;
          orders_target: number;
          products_target: number;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          difficulty: "easy" | "moderate" | "difficult";
          month_duration?: number;
          revenue_target?: number;
          orders_target?: number;
          products_target?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          difficulty?: "easy" | "moderate" | "difficult";
          month_duration?: number;
          revenue_target?: number;
          orders_target?: number;
          products_target?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      growth_quests: {
        Row: {
          id: string;
          merchant_id: string;
          store_id: string;
          quest_name: string;
          source_type: "custom" | "template";
          template_id: string | null;
          difficulty: string | null;
          start_date: string;
          end_date: string;
          revenue_target: number;
          orders_target: number;
          products_target: number;
          status: "active" | "completed" | "expired" | "paused" | "archived";
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          store_id: string;
          quest_name: string;
          source_type?: "custom" | "template";
          template_id?: string | null;
          difficulty?: string | null;
          start_date: string;
          end_date: string;
          revenue_target?: number;
          orders_target?: number;
          products_target?: number;
          status?: "active" | "completed" | "expired" | "paused" | "archived";
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          store_id?: string;
          quest_name?: string;
          source_type?: "custom" | "template";
          template_id?: string | null;
          difficulty?: string | null;
          start_date?: string;
          end_date?: string;
          revenue_target?: number;
          orders_target?: number;
          products_target?: number;
          status?: "active" | "completed" | "expired" | "paused" | "archived";
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      growth_quest_points: {
        Row: {
          id: string;
          merchant_id: string;
          store_id: string;
          quest_id: string | null;
          event_type: string;
          reference_id: string;
          points: number;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          store_id: string;
          quest_id?: string | null;
          event_type: string;
          reference_id: string;
          points: number;
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          store_id?: string;
          quest_id?: string | null;
          event_type?: string;
          reference_id?: string;
          points?: number;
          description?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      growth_quest_point_rules: {
        Row: {
          id: string;
          points_per_order: number;
          revenue_unit: number;
          points_per_revenue_unit: number;
          points_per_product_sold: number;
          milestone_25_points: number;
          milestone_50_points: number;
          milestone_75_points: number;
          milestone_100_points: number;
          craftaura_quest_default_points: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          points_per_order?: number;
          revenue_unit?: number;
          points_per_revenue_unit?: number;
          points_per_product_sold?: number;
          milestone_25_points?: number;
          milestone_50_points?: number;
          milestone_75_points?: number;
          milestone_100_points?: number;
          craftaura_quest_default_points?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          points_per_order?: number;
          revenue_unit?: number;
          points_per_revenue_unit?: number;
          points_per_product_sold?: number;
          milestone_25_points?: number;
          milestone_50_points?: number;
          milestone_75_points?: number;
          milestone_100_points?: number;
          craftaura_quest_default_points?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      craftaura_quests: {
        Row: {
          id: string;
          name: string;
          description: string;
          start_date: string;
          end_date: string;
          target_type: "orders" | "revenue" | "products";
          target_value: number;
          points_reward: number;
          mystery_reward_description: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          start_date: string;
          end_date: string;
          target_type: "orders" | "revenue" | "products";
          target_value: number;
          points_reward?: number;
          mystery_reward_description?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          start_date?: string;
          end_date?: string;
          target_type?: "orders" | "revenue" | "products";
          target_value?: number;
          points_reward?: number;
          mystery_reward_description?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      craftaura_quest_participants: {
        Row: {
          id: string;
          craftaura_quest_id: string;
          merchant_id: string;
          store_id: string;
          is_completed: boolean;
          completed_at: string | null;
          points_awarded: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          craftaura_quest_id: string;
          merchant_id: string;
          store_id: string;
          is_completed?: boolean;
          completed_at?: string | null;
          points_awarded?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          craftaura_quest_id?: string;
          merchant_id?: string;
          store_id?: string;
          is_completed?: boolean;
          completed_at?: string | null;
          points_awarded?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      growth_quest_monthly_results: {
        Row: {
          id: string;
          month: number;
          year: number;
          merchant_id: string;
          store_id: string;
          final_points: number;
          rank: number;
          is_winner: boolean;
          reward_status: "pending" | "delivered" | "claimed";
          created_at: string;
        };
        Insert: {
          id?: string;
          month: number;
          year: number;
          merchant_id: string;
          store_id: string;
          final_points?: number;
          rank: number;
          is_winner?: boolean;
          reward_status?: "pending" | "delivered" | "claimed";
          created_at?: string;
        };
        Update: {
          id?: string;
          month?: number;
          year?: number;
          merchant_id?: string;
          store_id?: string;
          final_points?: number;
          rank?: number;
          is_winner?: boolean;
          reward_status?: "pending" | "delivered" | "claimed";
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_store_owner: {
        Args: { check_store_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
