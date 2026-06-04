export type PropertyType = 'Sale' | 'Rent';

export type PropertyLocation =
  | 'Dekwaneh'
  | 'Sin el Fil'
  | 'Horch Tabet'
  | 'Surrounding Areas';

export type PropertyCategory =
  | 'Residential Apartment'
  | 'Commercial Office'
  | 'Retail Shop'
  | 'Industrial/Warehouse'
  | 'Land';

export type PropertyStatus = 'Available' | 'Pending' | 'Sold' | 'Rented';

export interface Property {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  price: number;
  location: PropertyLocation;
  property_type: PropertyType;
  category: PropertyCategory;
  status: PropertyStatus;
  image_url: string | null;
  image_urls?: string[] | null;
  google_maps_url: string | null;
  natoor_notes: string | null;
  phone_number: string | null;
  involved_brokers: boolean;
  rental_period: 'Monthly' | 'Yearly' | null;
  user_id: string;
}

export interface PropertyFormData {
  title: string;
  description: string;
  price: string; // string in form, parsed to number on submit
  location: PropertyLocation;
  property_type: PropertyType;
  category: PropertyCategory;
  status: PropertyStatus;
  image_urls: string[];
  image_files: File[];
  google_maps_url: string;
  natoor_notes: string;
  phone_number: string;
  involved_brokers: boolean;
  rental_period: 'Monthly' | 'Yearly' | '';
}

export const PROPERTY_LOCATIONS: PropertyLocation[] = [
  'Dekwaneh',
  'Sin el Fil',
  'Horch Tabet',
  'Surrounding Areas',
];

export const PROPERTY_CATEGORIES: PropertyCategory[] = [
  'Residential Apartment',
  'Commercial Office',
  'Retail Shop',
  'Industrial/Warehouse',
  'Land',
];

export const PROPERTY_STATUSES: PropertyStatus[] = [
  'Available',
  'Pending',
  'Sold',
  'Rented',
];

export const PROPERTY_TYPES: PropertyType[] = ['Sale', 'Rent'];
