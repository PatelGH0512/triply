import { ActivityIcon } from './enums';

export const ActivityIconMap: Record<ActivityIcon, string> = {
  [ActivityIcon.Flight]: 'airplane',
  [ActivityIcon.Hotel]: 'bed',
  [ActivityIcon.Restaurant]: 'restaurant',
  [ActivityIcon.Activity]: 'star',
  [ActivityIcon.Transport]: 'car',
  [ActivityIcon.Shopping]: 'cart',
  [ActivityIcon.Beach]: 'umbrella',
  [ActivityIcon.Hiking]: 'trail-sign',
  [ActivityIcon.Museum]: 'business',
  [ActivityIcon.Entertainment]: 'musical-notes',
  [ActivityIcon.Coffee]: 'cafe',
  [ActivityIcon.Bar]: 'wine',
  [ActivityIcon.Health]: 'medkit',
  [ActivityIcon.Meeting]: 'people',
  [ActivityIcon.Other]: 'ellipsis-horizontal',
};

export const ActivityIconLabel: Record<ActivityIcon, string> = {
  [ActivityIcon.Flight]: 'Flight',
  [ActivityIcon.Hotel]: 'Hotel',
  [ActivityIcon.Restaurant]: 'Restaurant',
  [ActivityIcon.Activity]: 'Activity',
  [ActivityIcon.Transport]: 'Transport',
  [ActivityIcon.Shopping]: 'Shopping',
  [ActivityIcon.Beach]: 'Beach',
  [ActivityIcon.Hiking]: 'Hiking',
  [ActivityIcon.Museum]: 'Museum',
  [ActivityIcon.Entertainment]: 'Entertainment',
  [ActivityIcon.Coffee]: 'Coffee',
  [ActivityIcon.Bar]: 'Bar',
  [ActivityIcon.Health]: 'Health',
  [ActivityIcon.Meeting]: 'Meeting',
  [ActivityIcon.Other]: 'Other',
};
