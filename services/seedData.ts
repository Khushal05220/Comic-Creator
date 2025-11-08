

import { Project, ImageData } from '../types';
import { DEFAULT_CHARACTER_PROMPT, DEFAULT_LOCATION_PROMPT, DEFAULT_PANEL_PROMPT } from '../constants';

const createPlaceholderImage = (text: string): ImageData => {
    if (typeof window === 'undefined') {
        const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        return { base64, mimeType: 'image/png' };
    }
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = '#4B5563';
        ctx.fillRect(0, 0, 256, 256);
        ctx.font = '600 24px Inter, sans-serif';
        ctx.fillStyle = '#F9FAFB';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 128, 128);
    }
    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    return { base64, mimeType: 'image/png' };
};

const zephyrProjectStructure: Project = {
    id: 'seed_proj_1',
    title: 'Chronicles of Zephyr (Sample)',
    style: 'Comic',
    characters: [
        {
            id: 'seed_char_1',
            name: 'Captain Zephyr',
            description: 'A former pilot granted the power of wind control. He protects Neo-Veridia with his supersonic speed and powerful gusts. Wears a sleek, aerodynamic suit of silver and cyan.',
            style: 'Comic',
            image: 'zephyrSheet', // Placeholder key
        },
    ],
    locations: [
        {
            id: 'seed_loc_1',
            name: 'Neo-Veridia',
            description: 'A futuristic city with towering skyscrapers, flying vehicles, and neon lights everywhere.',
            style: 'Comic',
            image: 'neoVeridia', // Placeholder key
        }
    ],
    storyboard: `A quiet night in Neo-Veridia is interrupted. Captain Zephyr is on patrol when he spots something unusual below.`,
    pages: [
        {
            id: 'seed_page_1',
            pageNumber: 1,
            layout: '2x1',
            panels: [
                {
                    id: 'seed_panel_1_1',
                    description: 'A wide shot of Captain Zephyr soaring high above the glittering skyscrapers of Neo-Veridia at night. The city lights blur below him.',
                    dialogue: 'Another quiet night... almost too quiet.',
                    characterIds: ['seed_char_1'],
                    image: 'zephyrFlying', // Placeholder key
                },
                {
                    id: 'seed_panel_1_2',
                    description: 'A close-up on Captain Zephyr\'s face. He has a concerned expression as he looks down towards a specific point in the city.',
                    dialogue: 'Wait... what\'s that?',
                    characterIds: ['seed_char_1'],
                    image: 'zephyrConcerned', // Placeholder key
                },
            ],
        },
    ],
    promptSettings: {
        character: DEFAULT_CHARACTER_PROMPT,
        panel: DEFAULT_PANEL_PROMPT,
        location: DEFAULT_LOCATION_PROMPT,
    }
};

export const getSeedProjects = (): Project[] => {
    // Deep copy to avoid mutation issues
    return [JSON.parse(JSON.stringify(zephyrProjectStructure))];
}

export const getSeedImages = () => ({
    zephyrSheet: createPlaceholderImage('Captain Zephyr Sheet'),
    zephyrFlying: createPlaceholderImage('Zephyr Flying'),
    zephyrConcerned: createPlaceholderImage('Zephyr Concerned'),
    neoVeridia: createPlaceholderImage('Neo-Veridia'),
});
