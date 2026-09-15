import {
  supabaseAdmin,
  LEASE_AGREEMENTS_BUCKET,
} from "@/lib/storage/supabase-server";

export class LeaseAgreementStorage {
  static async upload(
    path: string,
    data: Uint8Array,
  ): Promise<string> {
    const { error } = await supabaseAdmin.storage
      .from(LEASE_AGREEMENTS_BUCKET)
      .upload(path, data, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (error) {
      throw new Error(`Agreement upload failed: ${error.message}`);
    }

    return path;
  }

  static async createSignedUrl(
    path: string,
    expiresIn = 60 * 10,
  ): Promise<string> {
    const { data, error } = await supabaseAdmin.storage
      .from(LEASE_AGREEMENTS_BUCKET)
      .createSignedUrl(path, expiresIn);

    if (error || !data?.signedUrl) {
      throw new Error(
        `Agreement URL generation failed: ${
          error?.message ?? "Unknown error"
        }`,
      );
    }

    return data.signedUrl;
  }
}
