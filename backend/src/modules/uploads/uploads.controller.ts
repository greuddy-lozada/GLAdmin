import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Response } from 'express';
import { extname, join } from 'path';
import {
  createReadStream,
  existsSync,
  mkdirSync,
  openSync,
  readSync,
  closeSync,
  unlinkSync,
} from 'fs';
import {
  MinOrgLevel,
  ROLE_LEVEL,
} from '../../common/decorators/min-level.decorator';

const UPLOAD_DIR = join(process.cwd(), 'uploads');
mkdirSync(UPLOAD_DIR, { recursive: true });
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
};

function validateMagicBytes(filePath: string, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return true;

  const fd = openSync(filePath, 'r');
  const buffer = Buffer.alloc(8);
  readSync(fd, buffer, 0, 8, 0);
  closeSync(fd);

  return signatures.some((sig) =>
    buffer.subarray(0, sig.length).equals(Buffer.from(sig)),
  );
}

@Controller('uploads')
@MinOrgLevel(ROLE_LEVEL.employee)
export class UploadsController {
  @Post('proof')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: MAX_SIZE },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Invalid file type. Allowed: JPEG, PNG, WebP, PDF',
            ),
            false,
          );
        }
      },
    }),
  )
  uploadProof(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!validateMagicBytes(file.path, file.mimetype)) {
      unlinkSync(file.path);
      throw new BadRequestException(
        'File content does not match its declared type',
      );
    }

    return {
      data: {
        filename: file.filename,
        originalName: file.originalname,
        path: `/uploads/${file.filename}`,
        size: file.size,
      },
      message: 'UPLOAD.SUCCESS',
    };
  }

  @Get(':filename')
  serveFile(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) _res: Response,
  ) {
    const filePath = join(UPLOAD_DIR, filename);

    const resolvedPath = filePath.replace(/\\/g, '/');
    const resolvedDir = UPLOAD_DIR.replace(/\\/g, '/');
    if (!resolvedPath.startsWith(resolvedDir)) {
      throw new BadRequestException('Invalid file path');
    }

    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    const file = createReadStream(filePath);
    return new StreamableFile(file);
  }
}
