
/**
 * BACnet event state values
 * 
 * This enumeration represents the possible event states of a BACnet object
 * as defined in the BACnet standard. It is used in the EVENT_STATE property
 * of BACnet objects to indicate their current alarm or event condition.
 */
export enum BDEventState { 
  /** Object is in a normal state */
  NORMAL = 0,
  /** Object is in a fault state */
  FAULT = 1,
  /** Object is in an off-normal state */
  OFFNORMAL = 2,
  /** Object has exceeded its high limit */
  HIGH_LIMIT = 3,
  /** Object has fallen below its low limit */
  LOW_LIMIT = 4,
  /** Object is in a life safety alarm state */
  LIFE_SAFETY_ALARM = 5,
}

/**
 * BACnet reliability values
 * 
 * This enumeration represents the possible reliability states of a BACnet object
 * as defined in the BACnet standard. It is used in the RELIABILITY property
 * of BACnet objects to indicate whether the Present_Value property is reliable
 * and, if not, why it is unreliable.
 */
export enum BDReliability {
  /** No fault has been detected */
  NO_FAULT_DETECTED = 0,
  /** The sensor is missing or not responding */
  NO_SENSOR = 1,
  /** The measured value is above the configured range */
  OVER_RANGE = 2,
  /** The measured value is below the configured range */
  UNDER_RANGE = 3,
  /** The control loop is open or not functioning */
  OPEN_LOOP = 4,
  /** The control loop has a short circuit */
  SHORTED_LOOP = 5,
  /** The output device is not functioning */
  NO_OUTPUT = 6,
  /** The value is unreliable for a reason not listed here */
  UNRELIABLE_OTHER = 7,
  /** There is an error in the process being monitored */
  PROCESS_ERROR = 8,
  /** The multi-state object is in a fault state */
  MULTI_STATE_FAULT = 9,
  /** The object configuration is incorrect */
  CONFIGURATION_ERROR = 10,
  /** Communication has failed */
  COMMUNICATION_FAILURE = 12,
  /** A member of a group has a fault */
  MEMBER_FAULT = 13,
  /** An object being monitored has a fault */
  MONITORED_OBJECT_FAULT = 14,
  /** A circuit breaker or other device has tripped */
  TRIPPED = 15,
  /** A lamp has failed */
  LAMP_FAILURE = 16,
  /** Activation of an object or device has failed */
  ACTIVATION_FAILURE = 17,
  /** Renewal of a DHCP lease has failed */
  RENEW_DHCP_FAILURE = 18,
  /** Renewal of a foreign device registration has failed */
  RENEW_FD_REGISTRATION_FAILURE = 19,
  /** Restarting of auto-negotiation has failed */
  RESTART_AUTO_NEGOTIATION_FAILURE = 20,
  /** Restarting of a device has failed */
  RESTART_FAILURE = 21,
  /** A proprietary command has failed */
  PROPRIETARY_COMMAND_FAILURE = 22,
  /** Faults are listed in another property */
  FAULTS_LISTED = 23,
  /** A referenced object has a fault */
  REFERENCED_OBJECT_FAULT = 24,
}
