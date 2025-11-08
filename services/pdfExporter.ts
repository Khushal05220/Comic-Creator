
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Project } from '../types';
import { getImage } from './dbService';
import { layoutToGridClasses, getPanelGridClass } from './layoutUtils';

// Helper to convert Tailwind-like classes to inline styles for html2canvas
const layoutClassesToStyle = (classes: string): string => {
  const styles: string[] = [];
  const classList = classes.split(' ');
  for (const cls of classList) {
    if (cls.startsWith('grid-cols-')) {
      const cols = cls.split('-')[2];
      styles.push(`grid-template-columns: repeat(${cols}, minmax(0, 1fr));`);
    } else if (cls.startsWith('grid-rows-')) {
      const rows = cls.split('-')[2];
      styles.push(`grid-template-rows: repeat(${rows}, minmax(0, 1fr));`);
    }
  }
  return styles.join(' ');
};

const panelClassesToStyle = (classes: string): string => {
    const styles: string[] = [];
    const classList = classes.split(' ');
    for (const cls of classList) {
        if (cls.startsWith('col-span-')) {
            const span = cls.split('-')[2];
            styles.push(`grid-column: span ${span} / span ${span};`);
        } else if (cls.startsWith('row-span-')) {
            const span = cls.split('-')[2];
            styles.push(`grid-row: span ${span} / span ${span};`);
        }
    }
    return styles.join(' ');
};


// Helper to create the loading overlay
const createOverlay = (): [HTMLElement, HTMLElement] => {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.background = 'rgba(17, 24, 39, 0.8)';
    overlay.style.color = 'white';
    overlay.style.fontFamily = `'Inter', sans-serif`;

    const spinner = `<div style="width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.3); border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>`;
    const text = `<p id="pdf-progress-text" style="margin-top: 20px; font-size: 16px; font-weight: 500;">Preparing PDF...</p>`;

    overlay.innerHTML = `
        <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        ${spinner}
        ${text}
    `;
    document.body.appendChild(overlay);
    const progressTextElement = overlay.querySelector('#pdf-progress-text') as HTMLElement;
    return [overlay, progressTextElement];
};


// Helper to add the cover page
const addCoverPage = (doc: jsPDF, project: Project) => {
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    doc.setFont('helvetica', 'bold');
    let fontSize = 40;
    if (project.title.length > 20) fontSize = 32;
    if (project.title.length > 35) fontSize = 24;
    doc.setFontSize(fontSize);
    doc.text(project.title, pageW / 2, pageH * 0.45, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text(`A "${project.style}" Style Comic`, pageW / 2, pageH * 0.45 + 25, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Created with Comics Creator`, pageW / 2, pageH - 20, { align: 'center' });
}


export const exportProjectToPdf = async (project: Project): Promise<void> => {
  const [overlay, progressText] = createOverlay();

  const renderContainer = document.createElement('div');
  renderContainer.style.position = 'fixed';
  renderContainer.style.top = '0';
  renderContainer.style.left = '0';
  renderContainer.style.opacity = '0';
  renderContainer.style.pointerEvents = 'none';
  renderContainer.style.zIndex = '-1';
  document.body.appendChild(renderContainer);

  try {
    if (!project.pages.length) {
      alert("This project has no pages to export!");
      return;
    }

    const pdf = new jsPDF("p", "px", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    progressText.innerText = 'Creating cover page...';
    addCoverPage(pdf, project);

    const sortedPages = [...project.pages].sort((a, b) => a.pageNumber - b.pageNumber);

    for (let i = 0; i < sortedPages.length; i++) {
        const page = sortedPages[i];
        progressText.innerText = `Rendering page ${i + 1} of ${sortedPages.length}...`;
      
        const imageUrls = new Map<string, string>();
        const imageKeys = page.panels.map(p => p.image).filter((k): k is string => !!k);
        await Promise.all(imageKeys.map(async key => {
            const imageData = await getImage(key);
            if (imageData) {
                imageUrls.set(key, `data:${imageData.mimeType};base64,${imageData.base64}`);
            }
        }));
        
        const RENDER_WIDTH = 800;
        const GUTTER = 8;
        const RENDER_HEIGHT = RENDER_WIDTH * (3 / 2);

        const pageHtml = `
            <div style="width: ${RENDER_WIDTH}px; height: ${RENDER_HEIGHT}px; background-color: #ffffff; padding: ${GUTTER}px; box-sizing: border-box;">
                <div id="capture-grid" style="display: grid; gap: ${GUTTER}px; height: 100%; width: 100%; ${layoutClassesToStyle(layoutToGridClasses[page.layout])}">
                    ${page.panels.map((panel, index) => {
                      const panelContainerStyles = panelClassesToStyle(getPanelGridClass(page.layout, index));
                      const hasImage = panel.image && imageUrls.has(panel.image);
                      
                      const backgroundStyles = hasImage
                        ? `
                          background-image: url('${imageUrls.get(panel.image)}');
                          background-size: cover;
                          background-position: center;
                          background-repeat: no-repeat;
                        `
                        : 'background-color: #f0f0f0;';

                      return `
                        <div style="${panelContainerStyles} ${backgroundStyles}">
                            <!-- Image is now a background, preventing any stretching -->
                        </div>
                      `;
                    }).join('')}
                </div>
            </div>
        `;
        renderContainer.innerHTML = pageHtml;
        const gridElement = renderContainer.querySelector('#capture-grid') as HTMLElement;
        
        // Wait for browser to process the new HTML, including background images.
        gridElement.scrollIntoView({ behavior: "instant", block: "center" });
        await new Promise((resolve) => setTimeout(resolve, 500)); // Increased delay for safety
        
        // Capture ONLY the grid, not the padding around it.
        const canvas = await html2canvas(gridElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#FFFFFF",
        });
        
        if (canvas.width < 10 || canvas.height < 10) {
            console.warn(`Skipping page ${page.pageNumber}, canvas render was empty.`);
            continue;
        }

        const imgData = canvas.toDataURL("image/png");
        
        const PAGE_MARGIN = 40;
        const contentWidth = pageWidth - PAGE_MARGIN;
        const contentHeight = pageHeight - PAGE_MARGIN;
        const canvasRatio = canvas.width / canvas.height;
        const pageRatio = contentWidth / contentHeight;

        let finalWidth, finalHeight;

        if (canvasRatio > pageRatio) {
            finalWidth = contentWidth;
            finalHeight = finalWidth / canvasRatio;
        } else {
            finalHeight = contentHeight;
            finalWidth = finalHeight * canvasRatio;
        }

        const marginX = (pageWidth - finalWidth) / 2;
        const marginY = (pageHeight - finalHeight) / 2;
        
        pdf.addPage();
        pdf.addImage(imgData, "PNG", marginX, marginY, finalWidth, finalHeight);
        
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        const footerY = pageHeight - 15;
        pdf.text(`${project.title}`, PAGE_MARGIN / 2, footerY);
        pdf.text(`Page ${page.pageNumber}`, pageWidth - (PAGE_MARGIN / 2), footerY, { align: "right" });
    }

    progressText.innerText = 'Saving PDF...';
    const filename = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
    pdf.save(filename);

  } catch (err) {
    console.error("❌ PDF Export Error:", err);
    alert("Something went wrong while exporting your comic. Please check the console for details and try again.");
  } finally {
    document.body.removeChild(renderContainer);
    document.body.removeChild(overlay);
  }
};
