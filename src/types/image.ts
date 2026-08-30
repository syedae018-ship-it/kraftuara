export type ImageSourceType =
  | "uploaded"
  | "external_direct"
  | "google_drive"
  | "google_images_extracted"
  | "youtube_thumbnail"
  | "instagram_media"
  | "unsplash"
  | "imgur"
  | "data_url"
  | "relative";

export interface ImageValidationResult {
  isValid: boolean;
  resolvedUrl: string;
  sourceType: ImageSourceType;
  contentType?: string;
  error?: string;
  guidance?: string;
}

export interface ExternalImageResult {
  url: string;
  sourceType: ImageSourceType;
  originalInput: string;
  isTransformed: boolean;
  warning?: string;
}
