
/**
 * BACnet device status values
 * 
 * This enumeration represents the possible operational states of a BACnet device
 * as defined in the BACnet standard. It is used in the SYSTEM_STATUS property
 * of a Device object.
 */
export enum BDDeviceStatus { 
  /** Device is fully operational */
  OPERATIONAL = 0,
  /** Device is operational but only read operations are permitted */
  OPERATIONAL_READ_ONLY = 1,
  /** Device requires a download of operational parameters */
  DOWNLOAD_REQUIRED = 2,
  /** Device is currently downloading operational parameters */
  DOWNLOAD_IN_PROGRESS = 3,
  /** Device is not operational */
  NON_OPERATIONAL = 4,
  /** Device is performing a backup operation */
  BACKUP_IN_PROGRESS = 5,
}

/**
 * BACnet segmentation capabilities
 * 
 * This enumeration represents the segmentation capabilities of a BACnet device
 * as defined in the BACnet standard. It is used in the SEGMENTATION_SUPPORTED property
 * of a Device object to indicate the device's ability to send and receive segmented messages.
 */
export enum BDSegmentation {
  /** Device can both transmit and receive segmented messages */
  SEGMENTED_BOTH = 0,
  /** Device can transmit segmented messages but cannot receive them */
  SEGMENTED_TRANSMIT = 1,
  /** Device can receive segmented messages but cannot transmit them */
  SEGMENTED_RECEIVE = 2,
  /** Device cannot transmit or receive segmented messages */
  NO_SEGMENTATION = 3,
}
