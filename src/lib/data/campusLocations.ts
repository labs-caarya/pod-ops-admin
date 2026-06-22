/** Campus / pod hub locations on the India map silhouette.
 *
 * Coordinates are percentages within the map canvas (0–100), tuned to align
 * with public/india-map.svg (mapsicon potrace, viewBox 0 0 1024 × 1024).
 */

export interface CampusMarker {
  id: string;
  label: string;
  /** Short tag shown on hover / mobile legend */
  hint?: string;
  x: number;
  y: number;
}

export const CAMPUS_MARKERS: CampusMarker[] = [
  { id: "delhi", label: "Delhi NCR", hint: "SRCC · LSR · Hansraj", x: 34, y: 27 },
  { id: "chandigarh", label: "Chandigarh", hint: "North crew", x: 30, y: 21 },
  { id: "jaipur", label: "Jaipur", hint: "BITS Pilani corridor", x: 26, y: 33 },
  { id: "ahmedabad", label: "Ahmedabad", x: 22, y: 39 },
  { id: "mumbai", label: "Mumbai", hint: "West crew", x: 24, y: 51 },
  { id: "pune", label: "Pune", x: 27, y: 49 },
  { id: "hyderabad", label: "Hyderabad", x: 38, y: 54 },
  { id: "bengaluru", label: "Bengaluru", hint: "South hub", x: 36, y: 66 },
  { id: "chennai", label: "Chennai", x: 41, y: 71 },
  { id: "kolkata", label: "Kolkata", hint: "East crew", x: 58, y: 41 },
  { id: "bhubaneswar", label: "Bhubaneswar", x: 52, y: 48 },
  { id: "kochi", label: "Kochi", x: 34, y: 79 },
];
