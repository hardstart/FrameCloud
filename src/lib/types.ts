export interface Photo {
  filename: string;
  caption?: string;
  dateTaken?: string;
}

export interface AlbumManifest {
  title: string;
  slug: string;
  date: string;
  description?: string;
  photographer?: string;
  passwordHash: string;
  isPasswordProtected: boolean;
  coverImage: string;
  photos: Photo[];
  totalPhotos: number;
}

export interface AlbumPublicMeta {
  slug: string;
  title: string;
  date: string;
  coverImage: string;
  totalPhotos: number;
  isPasswordProtected: boolean;
  description?: string;
}

export interface AuthRequest {
  slug: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  albumTitle?: string;
  totalPhotos?: number;
  error?: string;
}
