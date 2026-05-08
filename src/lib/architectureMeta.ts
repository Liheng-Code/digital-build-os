export interface RoomData {
  id: string;
  wbs_node_id: string;
  floor_finish: string | null;
  wall_finish: string | null;
  ceiling_finish: string | null;
  skirting_finish: string | null;
  cornice_finish: string | null;
  sanitary_fixtures?: string | null;
  ironmongery_set?: string | null;
  acoustic_rating?: string | null;
  mep_requirements: {
    power_points?: number;
    light_fixtures?: string[];
    data_points?: number;
    ac_type?: string;
  };
  remarks: string | null;
}

export interface MaterialBoard {
  id: string;
  project_id: string;
  wbs_node_id: string | null;
  category: string;
  material_name: string;
  sample_reference: string | null;
  photo_url: string | null;
  status: string;
}

export interface DoorEntry {
  id: string;
  wbs_node_id: string;
  mark_number: string;
  door_type: string | null;
  width_mm: number | null;
  height_mm: number | null;
  thickness_mm: number | null;
  hardware_set: string | null;
  fire_rating: string | null;
}

export interface WindowEntry {
  id: string;
  wbs_node_id: string;
  mark_number: string;
  window_type: string | null;
  width_mm: number | null;
  height_mm: number | null;
  glazing_type: string | null;
  remarks: string | null;
}

export const COMMON_FINISHES = {
  floor: ["Polished Concrete", "Ceramic Tile", "Vinyl Plank", "Carpet", "Epoxy Coating", "Raised Floor"],
  wall: ["Plaster & Paint", "Wall Tiles", "Wallpaper", "Timber Cladding", "Stone Cladding"],
  ceiling: ["Skim Coat & Paint", "Acoustic Ceiling Tile", "Exposed Concrete", "Plasterboard"],
};
