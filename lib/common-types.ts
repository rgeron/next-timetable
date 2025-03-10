// Common types used across the application

export type Subject = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  icon: string;
  teachers: string[];
};

export type Activity = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  icon: string;
};

export type ColorOption = {
  id: string;
  value: string;
  name: string;
};

export type IconOption = {
  id: string;
  value: string;
  category: string;
};
