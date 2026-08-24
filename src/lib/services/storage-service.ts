import { createClient } from "@/lib/supabase/client";
import { Result, ok, err } from "@/lib/utils/result";

export type StorageBucket = "product-images" | "store-branding" | "creative-assets";

export class StorageService {
  private static getSupabase() {
    return createClient();
  }

  static async uploadFile(
    bucket: StorageBucket,
    filePath: string,
    file: File
  ): Promise<Result<{ url: string; path: string }>> {
    try {
      const supabase = this.getSupabase();
      const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
        upsert: true,
      });

      if (error) return err(new Error(error.message));

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

      return ok({
        url: publicUrlData.publicUrl,
        path: data.path,
      });
    } catch (e: any) {
      return err(new Error(e.message || "Failed to upload file to storage"));
    }
  }

  static async deleteFile(bucket: StorageBucket, filePath: string): Promise<Result<boolean>> {
    try {
      const supabase = this.getSupabase();
      const { error } = await supabase.storage.from(bucket).remove([filePath]);
      if (error) return err(new Error(error.message));
      return ok(true);
    } catch (e: any) {
      return err(new Error(e.message || "Failed to delete file from storage"));
    }
  }
}
