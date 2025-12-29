import { SupportedFileType } from './FileViewerTypes';

export function resolveViewer(fileType: SupportedFileType): string {
  if (fileType === 'text' || fileType === 'markdown' || fileType === 'json' || fileType === 'csv') return 'text_viewer';
  if (fileType === 'image') return 'image_viewer';
  if (fileType === 'video') return 'video_viewer';
  if (fileType === 'audio') return 'audio_viewer';
  if (fileType === 'pdf') return 'pdf_viewer';
  if (fileType === '3d') return '3d_viewer';
  return 'hex_viewer';
}

