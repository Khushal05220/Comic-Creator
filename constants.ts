

export const ART_STYLES = ['Comic', 'Manga', 'Cartoon', 'Pixel Art', 'Retro'];

export const CAMERA_ANGLES = ['Eye-Level', 'High-Angle', 'Low-Angle', 'Close-Up', 'Extreme Close-Up', 'Medium Shot', 'Long Shot', 'Dutch Angle'];
export const LIGHTING_STYLES = ['Bright, even lighting', 'Dramatic Rim Lighting', 'Soft, diffused light', 'Chiaroscuro (High-contrast)', 'Night time, neon glow', 'Golden Hour (Sunset)'];
export const EXPRESSIONS = ['Neutral', 'Happy', 'Sad', 'Angry', 'Surprised', 'Scared', 'Confused', 'Determined', 'Pensive', 'Smirking'];

export const DEFAULT_CHARACTER_PROMPT = `Generate a professional character design sheet for a comic book project.

**Goal:**
Create a clean, high-quality character reference image showing the same character from three angles — front view, side view, and back view — on a plain white background. This sheet will be used for consistent character rendering across future comic panels.

**Character Details:**
- **Name:** "{{name}}"
- **Description:** "{{description}}"
- **Art Style:** A "{{style}}" style, incorporating elements like {{style_enhancers}}.

**Requirements:**
- The final image must feature exactly **three full-body poses** of the same character: one front view, one side view, and one back view.
- The character’s proportions, clothing, colors, and hairstyle must remain **identical** across all three views.
- The character’s name, "{{name}}", should be included neatly at the top in a small, simple, unobtrusive font.
- **Do not include any other text**, symbols, watermarks, UI elements, or artist annotations on the image.
- The background must be a **solid, plain white or light gray** with no shadows, props, or scenery.
- The composition should be balanced, centered, and professional, suitable for a technical reference sheet.

**Negative Prompt (Things to strictly avoid):**
Blurry details, malformed limbs, inconsistent details between views, multiple characters, handwritten notes, sketch marks, distracting backgrounds, text other than the character's name, logos, or any objects.

**Quality Emphasis:**
High detail, sharp clean lines, consistent lighting, and a clean, professional color palette.`;

export const DEFAULT_LOCATION_PROMPT = `Generate a detailed, high-quality comic book location background.

**Goal:**
Create a clean, professional scene illustration that captures the environment described below. The image must contain **no text, signs, labels, or characters** — only the environment itself. This image will serve as a base location for adding characters and story elements in future panels.

**Location Details:**
- **Name:** "{{name}}"
- **Description:** "{{description}}"
- **Art Style:** A "{{style}}" style, incorporating elements like {{style_enhancers}}.

**Requirements:**
- Generate a wide, cinematic view of the environment that can serve as a versatile backdrop.
- The scene should be immersive and detailed, but **compositionally balanced to allow space for characters to be added later** (e.g., open foreground, clear pathways).
- **CRITICAL: The image must be completely free of any visible signage, text, written words, watermarks, logos, or captions.**
- **CRITICAL: Do not include any people, characters, or creatures in the scene.**
- The perspective, lighting, and color tone must be clear and consistent.

**Negative Prompt (Things to strictly avoid):**
Text, words, signs, watermarks, logos, UI elements, captions, people, characters, animals, blurry or chaotic backgrounds, inconsistent lighting, or flat perspective.

**Quality Emphasis:**
High detail, clear perspective lines, professional lighting, and a coherent, believable world design.`;

export const DEFAULT_PANEL_PROMPT = `You are a world-class visual storyteller and illustrator capable of adapting your art perfectly to the selected style and context.

**Primary Objective:**
Generate a single, high-quality story panel image for a visual narrative project.

Each generated image must maintain **style consistency, character continuity, and environmental coherence** with previously created assets for the same project.

---

### **Global Style Context**
The project style is: **"{{style}}"**  
Acceptable options: Comic, Manga, Cartoon, Pixel Art, Retro.

Follow the selected style **precisely and exclusively** across every generation:
- **Comic:** bold outlines, dynamic poses, realistic proportions, vivid colors, traditional Western comic look.
- **Manga:** *colored manga style*, clean ink lines, emotional exaggeration, cinematic tones (NOT black and white).
- **Cartoon:** smooth outlines, vibrant color palette, playful proportions, expressive gestures.
- **Pixel Art:** retro pixel aesthetic, crisp edges, visible pixels, limited color palette, nostalgic 16-bit game feel.
- **Retro:** 80s-90s illustration vibe, nostalgic tones, stylized lighting, soft color gradients.

Ensure that every character, location, and scene adheres visually to this chosen style.

---

### **Character & Environment Reference & Consistency Mandate**
{{character_references_section}}
{{location_references_section}}

**Source of Truth:** The provided reference images for characters and locations are the **single source of truth**.

**Character Consistency Mandate:**
- You **MUST** render characters exactly as they appear in their reference sheets.
- If the \`scene_description\` seems to contradict a character's appearance (e.g., describes "a young boy" but the reference sheet shows an adult man), **THE REFERENCE SHEET IS ALWAYS CORRECT**. You must ignore the conflicting part of the description and draw the character from the reference sheet performing the described action.
- Maintain perfect continuity with the character’s existing design (clothes, hair, body proportions, etc.) and the location’s structure, lighting, and perspective.

---

### **Scene Understanding & Creative Expansion**
**Scene Context:** {{scene_context}}

**Scene Description (user input):** {{scene_description}}

Expand upon the user’s description creatively and intelligently — add cinematic emotion, motion, and visual impact while keeping the essence intact.  
If the input is minimal, infer logical surroundings, body language, and expressions to make the scene engaging and story-driven.

Maintain realism and visual flow from the previous panel unless explicitly stated otherwise.

---

### **Composition Directives**
- **Camera Angle:** {{camera_angle}}
- **Lighting Style:** {{lighting}}
- **Advanced Cinematography Notes:** {{advanced_prompt}}

Composition must feel dynamic, balanced, and focused on storytelling clarity.

---

### **Dialogue Handling**
**Dialogue/Caption (optional):** "{{dialogue}}"

If dialogue exists:
- Display it **inside accurate speech bubbles or caption boxes** within the panel.
- Ensure the bubble’s tail points toward the speaking character.
- Use clean, legible comic/manga-style typography.
- Place speech bubbles naturally without obstructing key visual elements.
- Match bubble design to the project style (Comic → outlined, Manga → soft-toned, Pixel Art → blocky 8-bit font, Retro → vintage balloon).

If no dialogue is provided, do **not** insert or imply any text.

---

### **Instructions**
- Generate **only the story panel image** — no external text, no UI, no annotations, no page borders.
- Maintain **continuity** with previous panels in lighting, setting, and mood.
- Ensure **character poses and expressions evolve logically** from the last scene.
- Maintain **consistent art style** across all project assets.
- Output must be clean, high-quality, and storytelling-accurate.

---

### **Negative Prompt**
Avoid:  
- Any text outside speech bubbles  
- Black & white manga (for colored manga style)  
- Blurry or low-detail renders  
- Deformed anatomy or faces  
- Changing character outfits or hairstyles  
- Inconsistent lighting or environment  
- Extra characters not mentioned  
- Watermarks, logos, or UI artifacts

---

### **Output Goal**
A visually stunning, story-accurate, stylistically consistent single frame that feels like part of a professional narrative series.
`;


export const DEFAULT_STORY_GENERATOR_PROMPT = `You are a professional **comic and manga director AI**, skilled at converting written stories into visually coherent, engaging multi-panel comics.

**Objective:**
Generate a complete visual storyboard for the provided story description. 
Break the narrative into a sequence of comic or manga-style pages, each with logical panel divisions, consistent art style, and emotional flow.

---

### **Story Input**
{{user_story_text}}

Understand this story deeply — identify main characters, tone, key locations, emotions, and turning points. 
Then visually narrate it as a coherent series of illustrated pages.

---

### **Style Context**
The selected visual style is: **"{{style}}"**  
(Options: Comic, Manga, Cartoon, Pixel Art, Retro)

Follow this style *consistently* across all pages:
- **Comic:** Western comic realism, vibrant color, bold outlines, dynamic compositions.
- **Manga:** Colored manga visuals with expressive character emotions, cinematic shading.
- **Cartoon:** Fun, stylized, vibrant tone, simplified shapes.
- **Pixel Art:** Retro pixel rendering, clear edges, nostalgic palette.
- **Retro:** 80s-90s artbook style, muted tones, soft lighting, subtle gradients.

---

### **Character & Environment Handling**
The list of available character names is: [{{character_list}}]. Only use names from this list in the 'characters_present' field.

**CRITICAL RULE FOR SCENE DESCRIPTIONS:** When a character from the list is in a scene, **do not describe their physical appearance (e.g., "a tall man with brown hair")**. Instead, refer to them **by name**. For example, instead of "A man looks up at the sky," write "**{{character_name_example}}** looks up at the sky." The illustrator AI has reference sheets and will handle the visual rendering. Your job is to describe their **actions, pose, and emotions**.

If no characters are present, return an empty array for 'characters_present'.
If there is no dialogue, return an empty string for the dialogue.
Maintain continuity in clothing, body type, and background across scenes.

---

### **Panel Composition Rules**
- Use dynamic framing and cinematic composition (mix close-ups, wide shots, over-shoulder, and reaction shots).
- Maintain perspective and lighting continuity from panel to panel.
- Ensure transitions between panels feel natural, not abrupt.
- Use expressive gestures and poses to convey dialogue emotion.

---

### **Dialogue Handling**
- Only include dialogue if it is present in the story.
- If there is narration, place it in a small caption box at the top or bottom of the panel.

---

### **Creative Intelligence Directive**
If the user’s story is short or minimal, infer additional context:
- Add logical visual buildup
- Introduce environment and action flow
- Use facial expressions and posture to amplify emotion
- Ensure the final output feels like a complete visual narrative, not isolated images

---

### **Expected Output Structure**
Your entire output must be a single JSON array, where each object in the array represents a single comic book page.
Each page object must contain:
1.  **layout**: A string suggesting a panel layout. Choose from: '1x1', '1x2', '2x1', '2x2', '3x1', 'dominant-top', 'dominant-left', 'timeline-vert', 'four-varied'. The number of panels in the 'panels' array must match the chosen layout.
2.  **panels**: An array of panel objects. Each panel object must contain:
    - **scene_description**: A detailed visual description for the illustrator.
    - **dialogue**: The character's dialogue or narration for the panel.
    - **characters_present**: An array of character names (from the provided list) that are visible in the panel.
`;
