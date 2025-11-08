import { PageLayout } from '../types';

export const layoutToGridClasses: { [key in PageLayout]: string } = {
  '1x1': 'grid-cols-1 grid-rows-1',
  '1x2': 'grid-cols-2 grid-rows-1',
  '2x1': 'grid-cols-1 grid-rows-2',
  '2x2': 'grid-cols-2 grid-rows-2',
  '3x1': 'grid-cols-1 grid-rows-3',
  'dominant-top': 'grid-cols-2 grid-rows-2',
  // FIX: dominant-left should be a 2x2 grid to accommodate a tall panel
  'dominant-left': 'grid-cols-2 grid-rows-2',
  'timeline-vert': 'grid-cols-1 grid-rows-3',
  'four-varied': 'grid-cols-2 grid-rows-3',
};

export const getPanelGridClass = (layout: PageLayout, panelIndex: number): string => {
    switch (layout) {
        case 'dominant-top':
            return panelIndex === 0 ? 'col-span-2' : '';
        case 'dominant-left':
            // FIX: The first panel should span 2 rows in a 2-col grid
            return panelIndex === 0 ? 'row-span-2' : '';
        case 'four-varied':
            if (panelIndex === 0) return 'row-span-2';
            if (panelIndex === 3) return 'col-span-2';
            return '';
        default:
            return '';
    }
}