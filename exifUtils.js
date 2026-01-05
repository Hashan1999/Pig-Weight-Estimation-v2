import { Buffer } from 'buffer';
import RNFS from 'react-native-fs';
import exifParser from 'exif-parser';

export const extractFocalLengthFromTags = (tags) => {
  if (!tags) return null;
  return (
    tags.FocalLength ||
    tags.FocalLenIn35mmFilm ||
    tags.FocalLengthIn35mmFilm ||
    tags['{Exif}FocalLength'] ||
    tags['{Exif}FocalLenIn35mmFilm'] ||
    null
  );
};

export const readExifFromFile = async (uriOrPath) => {
  try {
    const path = uriOrPath.startsWith('file://') ? uriOrPath.replace('file://', '') : uriOrPath;
    const base64 = await RNFS.readFile(path, 'base64');
    const buffer = Buffer.from(base64, 'base64');
    const parser = exifParser.create(buffer);
    const result = parser.parse();
    return result?.tags || null;
  } catch (error) {
    console.warn('Failed to read EXIF', error);
    return null;
  }
};
