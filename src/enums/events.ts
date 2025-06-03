
import { invertEnum } from '../utils.js';

export enum EventState { 
  NORMAL = 0,
  FAULT = 1,
  OFFNORMAL = 2,
  HIGH_LIMIT = 3,
  LOW_LIMIT = 4,
  LIFE_SAFETY_ALARM = 5,
}

export const EventStateName = invertEnum(EventState);
