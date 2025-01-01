// types/map.ts
export type Coordinate = [number, number];

export interface RouteStep {
 distance: number;
 duration: number;
 maneuver: {
   instruction: string;
   location: [number, number];
   type: string;
 };
 name: string;
}

export interface RouteData {
 distance: number;
 duration: number;
 geometry: {
   coordinates: [number, number][];
   type: string;
 };
 legs: {
   steps: RouteStep[];
   distance: number;
   duration: number;
 }[];
}