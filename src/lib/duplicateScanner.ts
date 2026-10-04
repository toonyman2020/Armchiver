import { ArchiveItem, Character, GenericFileAttachment } from '../types';

export interface ScanResult {
  duplicatesFound: number;
  flaggedItems: string[];
  updatedItems: ArchiveItem[];
  updatedCharacters: Character[];
}

/**
 * Scans archive items and character media for duplicate files based on size, content hash/length, and file properties.
 */
export function scanAndFlagDuplicates(items: ArchiveItem[], characters: Character[]): ScanResult {
  const seenFiles = new Map<string, string>(); // signature -> first item/file id
  let duplicatesFound = 0;
  const flaggedItems: string[] = [];

  const updatedItems = items.map(item => {
    // Generate a file signature from content length, mime/type, or name
    const sig = `${item.type}_${item.content?.length || 0}_${item.originalName.toLowerCase()}`;
    if (seenFiles.has(sig)) {
      duplicatesFound++;
      flaggedItems.push(item.id);
      return { ...item, status: 'Duplicate' as const };
    } else {
      seenFiles.set(sig, item.id);
      return item;
    }
  });

  const updatedCharacters = characters.map(char => {
    const updatedAudios = char.audios?.map(a => {
      const sig = `audio_${a.src?.length || 0}_${a.title.toLowerCase()}`;
      if (seenFiles.has(sig)) {
        duplicatesFound++;
        return { ...a, isDuplicate: true, duplicateOfId: seenFiles.get(sig) };
      } else {
        seenFiles.set(sig, a.id);
        return a;
      }
    });

    const updatedVideos = char.videos?.map(v => {
      const sig = `video_${v.src?.length || 0}_${v.title.toLowerCase()}`;
      if (seenFiles.has(sig)) {
        duplicatesFound++;
        return { ...v, isDuplicate: true, duplicateOfId: seenFiles.get(sig) };
      } else {
        seenFiles.set(sig, v.id);
        return v;
      }
    });

    return {
      ...char,
      audios: updatedAudios,
      videos: updatedVideos
    };
  });

  return {
    duplicatesFound,
    flaggedItems,
    updatedItems,
    updatedCharacters
  };
}

/**
 * Extracts creation date from File object or fallback to today
 */
export function extractCreationDate(file: File): string {
  if (file.lastModified) {
    return new Date(file.lastModified).toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}

/**
 * Auto-organizes files and formats names for sketches/character assets
 */
export function autoOrganizeAndRename(char: Character): Character {
  const charName = char.name.replace(/[^a-zA-Z0-0]/g, '_');
  
  const renamedAudios = char.audios?.map((a, idx) => ({
    ...a,
    title: a.title.startsWith('Track') ? `${charName}_Soundtrack_${idx + 1}` : a.title
  }));

  const renamedVideos = char.videos?.map((v, idx) => ({
    ...v,
    title: v.title.startsWith('Video') ? `${charName}_Clip_${idx + 1}` : v.title
  }));

  return {
    ...char,
    audios: renamedAudios,
    videos: renamedVideos
  };
}
