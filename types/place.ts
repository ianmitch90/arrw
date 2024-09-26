export interface Place {
  id: string;
  name: string;
  description: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  created_by: string;
  icon: string;
  username?: string;
}
