import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseStorageService } from './supabase-storage.service';
import { MediaKind } from 'generated/prisma/enums';

@Injectable()
export class AssetsService {
  constructor(
    private prisma: PrismaService,
    private supabaseStorage: SupabaseStorageService,
  ) {}

  async uploadImage(
    file: Express.Multer.File,
    ownerId: string,
    kind: string = 'OTHER',
  ) {
    const timestamp = Date.now();
    const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const path = `${kind.toLowerCase()}/${ownerId}/${timestamp}-${cleanFileName}`;

    const { publicUrl, storageKey } = await this.supabaseStorage.uploadFile(
      file,
      path,
    );

    return this.prisma.mediaAsset.create({
      data: {
        ownerId,
        kind: kind as any,
        storageKey,
        publicUrl,
        mimeType: file.mimetype,
      },
    });
  }
}
