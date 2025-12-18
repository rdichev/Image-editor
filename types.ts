
export interface ImageState {
  original: string | null;
  edited: string | null;
  mimeType: string | null;
}

export interface EditRequest {
  image: string;
  mimeType: string;
  instruction: string;
}

export enum EditStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
