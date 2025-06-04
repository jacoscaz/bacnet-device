
/**
 * BACnet character string encodings
 * 
 * This enumeration represents the possible encodings for character strings
 * in BACnet as defined in the BACnet standard. It is used to specify the
 * encoding for CHARACTER_STRING values.
 */
export enum CharacterStringEncoding {
  /** UTF-8 encoding (default) */
  UTF_8 = 0,
  /** Microsoft Double Byte Character Set */
  MICROSOFT_DBCS = 1,
  /** Japanese Industrial Standard */
  JIS_X_0208 = 2,
  /** Universal Character Set 4-byte encoding */
  UCS_4 = 3,
  /** Universal Character Set 2-byte encoding */
  UCS_2 = 4,
  /** ISO 8859-1 Latin 1 encoding */
  ISO_8859_1 = 5,
};
