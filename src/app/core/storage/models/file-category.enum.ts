// src/app/core/storage/models/file-category.enum.ts

/**
 * File categories matching backend FileCategory enum.
 *
 * Each category has specific validation rules defined server-side:
 * - Allowed MIME types
 * - Max file size
 * - Image dimensions (for image categories)
 *
 * @see storage.yml for category configurations
 */
export enum FileCategory {
  /** User profile pictures - images only, typically small */
  AVATAR = 'AVATAR',

  /** General documents - PDF, Word, Excel, etc. */
  DOCUMENT = 'DOCUMENT',

  /** Product images - images only, may have specific dimensions */
  PRODUCT_IMAGE = 'PRODUCT_IMAGE',

  /** Temporary files - auto-cleaned after retention period */
  TEMPORARY = 'TEMPORARY'
}
