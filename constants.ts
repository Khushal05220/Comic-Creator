

export const ART_STYLES = ['Comic', 'Manga', 'Cartoon', 'Pixel Art', 'Retro'];

export const CAMERA_ANGLES = ['Eye-Level', 'High-Angle', 'Low-Angle', 'Close-Up', 'Extreme Close-Up', 'Medium Shot', 'Long Shot', 'Dutch Angle'];
export const LIGHTING_STYLES = ['Bright, even lighting', 'Dramatic Rim Lighting', 'Soft, diffused light', 'Chiaroscuro (High-contrast)', 'Night time, neon glow', 'Golden Hour (Sunset)'];
export const EXPRESSIONS = ['Neutral', 'Happy', 'Sad', 'Angry', 'Surprised', 'Scared', 'Confused', 'Determined', 'Pensive', 'Smirking'];

export const DEFAULT_CHARACTER_PROMPT = `Create a professional character design sheet for a comic book character named "{{name}}".
Style: {{style}}, with characteristics like {{style_enhancers}}.
Description: "{{description}}".
The sheet must feature a full-body front view, side view, and back view of the character.
The background must be a solid, neutral white to ensure clarity.
This is a reference for artistic consistency. High detail, clean lines, professional concept art.
Negative prompt: avoid blurry images, malformed limbs, inconsistent details between views.`;

export const DEFAULT_LOCATION_PROMPT = `Create a professional concept art illustration for a comic book location named "{{name}}".
Style: {{style}}, with characteristics like {{style_enhancers}}.
Description: "{{description}}".
The illustration should establish the mood and key features of the environment.
Focus on composition, lighting, and atmosphere to create a memorable setting.
This is a reference for artistic consistency. High detail, clean lines, professional concept art.
Negative prompt: avoid blurry images, generic designs, inconsistent lighting.`;

export const DEFAULT_PANEL_PROMPT = `You are a professional comic book artist. Create a single, high-quality comic book panel using the provided reference images.

**Style:** Create the panel in a "{{style}}" style. Incorporate these stylistic elements: {{style_enhancers}}.

{{character_references_section}}
{{location_references_section}}

**Scene Context & Continuity:**
{{scene_context}}
If a scene context image is provided, it is the *immediately preceding panel*. Use it as the primary visual guide for the environment, lighting, character positions, and poses.
Continuity is critical. Unless the "Scene Details" explicitly describe a major change, maintain the existing background and lighting. Character poses should evolve naturally from the previous panel.

**Composition Directives:**
- **Camera Angle:** {{camera_angle}}
- **Lighting Style:** {{lighting}}
- **Advanced Cinematography Notes:** {{advanced_prompt}} (Use this for specific shot instructions not covered by the above.)

**Scene Details:**
- **Core Action/Change:** {{scene_description}} (This describes what is NEW or CHANGING in this panel.)
- **Character Expressions:** {{character_expressions}}

**Dialogue/Caption (optional):** "{{dialogue}}"
If dialogue is present, leave appropriate space for a speech bubble, but DO NOT draw the bubble or the text itself.

**Instructions:**
- Generate ONLY the comic panel image.
- Do not include any text, borders, or annotations on the image.
- Negative prompt: avoid ugly, deformed, blurry, extra limbs, inconsistent character design, inconsistent backgrounds, sudden changes in lighting or pose, text, watermarks, changing clothes or appearance between panels.`;