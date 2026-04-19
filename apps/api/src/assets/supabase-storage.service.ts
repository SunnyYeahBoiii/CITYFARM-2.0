import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseStorageService {
  private supabase: SupabaseClient;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
    const supabaseKey = this.configService.getOrThrow<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    this.bucketName = this.configService.getOrThrow<string>(
      'SUPABASE_BUCKET_NAME',
    );

    if (!supabaseUrl || !supabaseKey || !this.bucketName) {
      throw new Error(
        'Supabase configuration is missing in environment variables',
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async uploadFile(
    file: Express.Multer.File,
    path: string,
  ): Promise<{ publicUrl: string; storageKey: string }> {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      throw new InternalServerErrorException(
        `Supabase upload error: ${error.message}`,
      );
    }

    const { data: publicUrlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(data.path);

    return {
      publicUrl: publicUrlData.publicUrl,
      storageKey: data.path,
    };
  }

  async deleteFile(path: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([path]);
    if (error) {
      console.error(`Failed to delete file from Supabase: ${error.message}`);
    }
  }
}
