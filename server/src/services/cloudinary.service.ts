import { v2 as cloudinary } from 'cloudinary';

export interface UploadResult {
  fileUrl: string;
  publicId: string;
  fileType: 'image' | 'video';
  size: number;
}

/**
 * Service tích hợp lưu trữ đám mây Cloudinary
 * Tự động đọc biến môi trường; nếu thiếu credentials thì kích hoạt Mock Storage (RISK-01)
 */
export class CloudinaryService {
  private static isConfigured = false;

  private static init() {
    if (this.isConfigured) return;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.isConfigured = true;
    }
  }

  /**
   * Tải tệp lên Cloudinary từ bộ đệm Buffer (hỗ trợ cả ảnh và video)
   */
  public static async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<UploadResult> {
    this.init();
    const isVideo = mimeType.startsWith('video/');
    const fileType: 'image' | 'video' = isVideo ? 'video' : 'image';

    // Nếu đã cấu hình Cloudinary thật từ ENV
    if (this.isConfigured) {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: isVideo ? 'video' : 'image',
            folder: 'kaban_attachments',
            public_id: `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
          },
          (error, result) => {
            if (error || !result) {
              return reject(error || new Error('Không thể tải tệp lên Cloudinary'));
            }
            resolve({
              fileUrl: result.secure_url,
              publicId: result.public_id,
              fileType,
              size: result.bytes || buffer.length,
            });
          }
        );
        uploadStream.end(buffer);
      });
    }

    // Cơ chế Fallback an toàn (Mock Storage) khi chưa cung cấp key env (RISK-01)
    const mockPublicId = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const fileUrl = isVideo
      ? `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4#${mockPublicId}`
      : `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80#${mockPublicId}`;

    return {
      fileUrl,
      publicId: mockPublicId,
      fileType,
      size: buffer.length,
    };
  }

  /**
   * Xoá tệp khỏi Cloudinary bằng publicId
   */
  public static async deleteFile(publicId: string, fileType: 'image' | 'video'): Promise<void> {
    this.init();
    if (!this.isConfigured || !publicId || publicId.startsWith('mock_')) return;

    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: fileType === 'video' ? 'video' : 'image',
      });
    } catch (error) {
      console.warn('Lỗi xoá tệp trên Cloudinary (bỏ qua nếu tệp không tồn tại):', error);
    }
  }
}
