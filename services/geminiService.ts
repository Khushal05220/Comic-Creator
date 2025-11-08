

import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Character, AssetType, ImageData, Location, StoryPageGenData, PageLayout } from "../types";
import { DEFAULT_STORY_GENERATOR_PROMPT } from "../constants";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const getBase64FromResponse = (response: any): ImageData | null => {
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return {
        base64: part.inlineData.data,
        mimeType: part.inlineData.mimeType,
      };
    }
  }
  return null;
};

const styleEnhancers: { [key: string]: string } = {
  'Comic': 'dynamic ink lines, bold colors, halftone patterns, dramatic shadows',
  'Manga': 'clean line art, screentones, expressive eyes, dynamic action lines',
  'Cartoon': 'simple shapes, bright saturated colors, thick outlines',
  'Pixel Art': '8-bit, grid-based, limited color palette, retro gaming aesthetic',
  'Retro': 'vintage comic aesthetic, faded colors, paper texture, 1960s style',
}

export const generateAssetSheet = async (
  description: string, 
  name: string, 
  style: string, 
  promptTemplate: string,
  assetType: AssetType,
  referenceImage?: ImageData | null
): Promise<ImageData | null> => {
  let finalPrompt = promptTemplate
    .replace('{{name}}', name)
    .replace('{{description}}', description)
    .replace('{{style}}', style)
    .replace('{{style_enhancers}}', styleEnhancers[style] || '');
  
  if (referenceImage) {
    const referenceText = `CRITICAL: Use the provided image as the primary visual reference for the ${assetType.toLowerCase()}'s appearance and overall design. Base the final art on this image.`;
    const promptLines = finalPrompt.split('\n');
    promptLines.splice(1, 0, referenceText);
    finalPrompt = promptLines.join('\n');
  }

  const parts: any[] = [];
  if (referenceImage) {
    parts.push({
      inlineData: {
        data: referenceImage.base64,
        mimeType: referenceImage.mimeType,
      },
    });
  }
  parts.push({ text: finalPrompt });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: { responseModalities: [Modality.IMAGE] },
  });

  return getBase64FromResponse(response);
};

export const generateComicPanel = async (
  sceneDescription: string,
  dialogue: string,
  characters: (Omit<Character, 'image'> & { image: ImageData | null })[],
  locations: (Omit<Location, 'image'> & { image: ImageData | null })[],
  style: string,
  promptTemplate: string,
  advancedPrompt?: string,
  previousPanelImage?: ImageData | null,
  cameraAngle?: string,
  lighting?: string
): Promise<ImageData | null> => {
  
  const characterReferencesSection = characters.length > 0
    ? `**Character References:**\n${characters.map(c => `- Reference sheet for "${c.name}".`).join('\n')}\nCRITICAL: Adhere *strictly* to the visual design, clothing, and colors shown in the character reference sheets. This is the highest priority for character consistency.`
    : '';
  
  const locationReferencesSection = locations.length > 0
    ? `**Location/Background References:**\n${locations.map(l => `- Reference image for the location "${l.name}".`).join('\n')}\nUse this as the primary guide for the panel's background and setting.`
    : '';

  const sceneContextPrompt = previousPanelImage
    ? "This panel is a direct continuation of the scene from the final reference image (the previous panel). CRITICALLY IMPORTANT: Maintain consistency with the previous panel's background, lighting, and character poses/positions. The 'Core Action/Change' description below specifies ONLY what is different in this new panel."
    : "This panel starts a new scene. Establish the environment and characters based on the scene description.";
  
  const prompt = promptTemplate
    .replace('{{style}}', style)
    .replace('{{character_references_section}}', characterReferencesSection)
    .replace('{{location_references_section}}', locationReferencesSection)
    .replace('{{scene_context}}', sceneContextPrompt)
    .replace('{{camera_angle}}', cameraAngle || 'A standard eye-level medium shot.')
    .replace('{{lighting}}', lighting || 'Standard, neutral lighting.')
    .replace('{{advanced_prompt}}', advancedPrompt || 'None.')
    .replace('{{scene_description}}', sceneDescription)
    .replace('{{dialogue}}', dialogue);

  const characterImageParts = characters
    .filter(c => c.image)
    .map(c => ({
      inlineData: { data: c.image!.base64, mimeType: c.image!.mimeType }
    }));
  
  const locationImageParts = locations
    .filter(l => l.image)
    .map(l => ({
      inlineData: { data: l.image!.base64, mimeType: l.image!.mimeType }
    }));

  const imageParts = [...characterImageParts, ...locationImageParts];

  if (previousPanelImage) {
      imageParts.push({
          inlineData: { data: previousPanelImage.base64, mimeType: previousPanelImage.mimeType }
      });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        ...imageParts,
        { text: prompt },
      ],
    },
    config: { responseModalities: [Modality.IMAGE] },
  });

  return getBase64FromResponse(response);
};


export const editImage = async (base64Image: string, mimeType: string, prompt: string): Promise<ImageData | null> => {
  const enhancedPrompt = `${prompt}. High quality, professional edit.`;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: mimeType } },
        { text: enhancedPrompt },
      ],
    },
    config: { responseModalities: [Modality.IMAGE] },
  });
  return getBase64FromResponse(response);
};

export const analyzeImage = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: mimeType } },
        { text: prompt },
      ],
    },
  });
  return response.text;
};

export const generateStoryboardFromStory = async (story: string, characters: Character[], style: string): Promise<StoryPageGenData[]> => {
  const characterList = characters.map(c => c.name).join(', ');
  const characterNameExample = characters.length > 0 ? characters[0].name : 'the main character';
  const prompt = DEFAULT_STORY_GENERATOR_PROMPT
    .replace('{{user_story_text}}', story)
    .replace('{{style}}', style)
    .replace('{{character_list}}', characterList)
    .replace('{{character_name_example}}', characterNameExample);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        description: "A list of comic book pages.",
        items: {
          type: Type.OBJECT,
          properties: {
            layout: {
              type: Type.STRING,
              description: "The suggested layout for this page.",
              enum: ['1x1', '1x2', '2x1', '2x2', '3x1', 'dominant-top', 'dominant-left', 'timeline-vert', 'four-varied']
            },
            panels: {
              type: Type.ARRAY,
              description: "A list of panels on this page.",
              items: {
                type: Type.OBJECT,
                properties: {
                  scene_description: {
                    type: Type.STRING,
                    description: "A visual description of the scene in the panel."
                  },
                  dialogue: {
                    type: Type.STRING,
                    description: "The dialogue or caption text for the panel. Empty if none."
                  },
                  characters_present: {
                    type: Type.ARRAY,
                    description: "An array of character names present in the panel.",
                    items: { type: Type.STRING }
                  }
                },
                required: ['scene_description', 'dialogue', 'characters_present']
              }
            }
          },
          required: ['layout', 'panels']
        }
      }
    }
  });

  try {
    const jsonText = response.text.trim();
    // Gemini can sometimes wrap the JSON in ```json ... ```
    const sanitizedJsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
    const parsed = JSON.parse(sanitizedJsonText);
    return parsed as StoryPageGenData[];
  } catch (e) {
    console.error("Failed to parse storyboard JSON:", response.text);
    throw new Error("The AI failed to generate a valid storyboard structure. Please try rephrasing your story.");
  }
};
