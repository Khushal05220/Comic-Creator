

export interface ImageData {
  base64: string;
  mimeType: string;
}

export interface Asset {
  id: string;
  name: string;
  description: string;
  style: string;
  image: string | null; // This is now an IndexedDB key
}

export interface Character extends Asset {}
export interface Location extends Asset {}


export interface Panel {
  id: string;
  description: string;
  dialogue: string;
  characterIds: string[];
  locationIds?: string[];
  propIds?: string[];
  image: string | null; // This is now an IndexedDB key
  cameraAngle?: string;
  lighting?: string;
  characterExpressions?: { characterId: string; expression: string }[];
}

export type PageLayout = '1x1' | '1x2' | '2x1' | '2x2' | '3x1' | 'dominant-top' | 'dominant-left' | 'timeline-vert' | 'four-varied';

export interface ComicPage {
  id: string;
  pageNumber: number;
  layout: PageLayout;
  panels: Panel[];
}

export interface PromptSettings {
  character: string;
  panel: string;
  location: string;
}

export interface Project {
  id:string;
  title: string;
  characters: Character[];
  locations: Location[];
  storyboard: string;
  pages: ComicPage[];
  style: string;
  promptSettings: PromptSettings;
}

export type View = 'DASHBOARD' | 'PROJECT_WORKSPACE';

export type AssetType = 'Character' | 'Location';

export type ImageSource = 
  | { type: 'asset'; assetType: AssetType; assetId: string }
  | { type: 'panel'; pageId: string; panelId: string };