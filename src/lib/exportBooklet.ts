import { Character, SubImage, ProjectRelation, ProjectTable } from '../types';
import { getAccessToken } from './auth';

// Helper to convert any image URL to a base64 Data URL using Blob fetching (with canvas fallback)
export const toDataURL = async (url: string): Promise<string | null> => {
  if (!url) return null;
  if (url.startsWith('data:')) return url;

  // Try fetching the image as a Blob first (highly robust, avoids canvas tainting / CORS issues)
  try {
    const response = await fetch(url);
    if (response.ok) {
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    }
  } catch (e) {
    console.warn('Failed to fetch image as Blob, falling back to Canvas method:', url, e);
  }

  // Fallback to Image + Canvas drawing
  return new Promise((resolve) => {
    const img = new Image();
    // Only use anonymous crossOrigin for external URLs to avoid same-origin issues in some contexts
    if (!url.startsWith('/') && !url.startsWith(window.location.origin)) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
          return;
        }
      } catch (e) {
        console.error('Error drawing canvas in fallback for toDataURL:', e);
      }
      resolve(null);
    };
    img.onerror = () => {
      console.warn('Failed to load image in fallback toDataURL:', url);
      resolve(null);
    };
    img.src = url;
  });
};

interface ExportBookletOptions {
  character: Character;
  format: 'pdf' | 'word' | 'gdocs';
  onProgress?: (msg: string) => void;
}

export const exportCharacterBooklet = async ({ character, format, onProgress }: ExportBookletOptions): Promise<void> => {
  const charName = character.name || 'Unnamed_Character';
  onProgress?.('Initializing assets for export...');

  // 1. Gather all images and convert them to base64
  let bannerBase64: string | null = null;
  let portraitBase64: string | null = null;
  const subImagesBase64: { id: string; base64: string | null; title: string; description: string }[] = [];
  const storyboardImagesBase64: Record<string, string | null> = {};

  try {
    if (character.bannerImageSrc) {
      onProgress?.('Converting banner image...');
      bannerBase64 = await toDataURL(character.bannerImageSrc);
    }
    if (character.highlightedImageSrc) {
      onProgress?.('Converting portrait image...');
      portraitBase64 = await toDataURL(character.highlightedImageSrc);
    }

    if (character.subImages && character.subImages.length > 0) {
      onProgress?.(`Converting ${character.subImages.length} gallery/variation images...`);
      for (const sub of character.subImages) {
        const base64 = await toDataURL(sub.src);
        subImagesBase64.push({
          id: sub.id,
          base64,
          title: sub.title || 'Untitled Variation',
          description: sub.description || ''
        });
      }
    }

    // Storyboard images in projects tables
    if (character.projects && character.projects.length > 0) {
      onProgress?.('Checking storyboard sheets for images...');
      for (const proj of character.projects) {
        if (proj.tables) {
          for (const table of proj.tables) {
            for (const row of table.rows) {
              for (const cell of row) {
                if (cell.isImage && cell.content && !storyboardImagesBase64[cell.content]) {
                  const base64 = await toDataURL(cell.content);
                  storyboardImagesBase64[cell.content] = base64;
                }
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error during image base64 conversion:', err);
  }

  // 2. Build plain text content for Google Docs or general fallback
  let textContent = `MASTER ARCHIVE DOCUMENTATION: ${charName.toUpperCase()}\n`;
  textContent += `Type/Species: ${character.species || 'N/A'}\n`;
  textContent += `Gender/Category: ${character.gender || 'N/A'}\n`;
  textContent += `Status: ${character.status || 'N/A'}\n`;
  textContent += `Completion / Rating: ${character.completionRating || 'N/A'}\n`;
  textContent += `Description: ${character.description || 'N/A'}\n`;
  textContent += `Created Date: ${character.dateCreated || 'N/A'} (Source: ${character.dateCreatedSource || 'N/A'})\n`;
  textContent += `Database Registry Date: ${character.dateUploaded || 'N/A'}\n\n`;

  if (character.biblePages && character.biblePages.length > 0) {
    character.biblePages.forEach((p, idx) => {
      textContent += `=========================================\n`;
      textContent += `${idx + 1}. ${p.title.toUpperCase()}\n`;
      textContent += `=========================================\n${p.content || '(No content)'}\n\n`;
    });
  }

  if (character.subImages && character.subImages.length > 0) {
    textContent += `=========================================\n`;
    textContent += `ASSOCIATED GALLERY & VARIATIONS\n`;
    textContent += `=========================================\n`;
    character.subImages.forEach((sub, idx) => {
      textContent += `Image #${idx + 1}: ${sub.title || 'Untitled'}\n`;
      textContent += `Description: ${sub.description || 'N/A'}\n`;
      textContent += `Source URL: ${sub.src ? (sub.src.startsWith('data:') ? 'Embedded base64 asset' : sub.src) : 'N/A'}\n\n`;
    });
  }

  if (character.projects && character.projects.length > 0) {
    textContent += `=========================================\n`;
    textContent += `PROJECTS & ASSOCIATED WORKS\n`;
    textContent += `=========================================\n`;
    character.projects.forEach((proj) => {
      textContent += `- [${proj.status}] ${proj.projectName} (${proj.roleOrRelation}): ${proj.description || ''}\n`;
      if (proj.tables && proj.tables.length > 0) {
        proj.tables.forEach(table => {
          textContent += `  * Storyboard Table: ${table.title}\n`;
          textContent += `    Columns: ${table.columns.join(' | ')}\n`;
          table.rows.forEach((row, rIdx) => {
            const rowStr = row.map(cell => cell.isImage ? `[Image Asset]` : cell.content).join(' | ');
            textContent += `    Frame ${rIdx + 1}: ${rowStr}\n`;
          });
        });
      }
    });
    textContent += `\n`;
  }

  if (character.relationships && character.relationships.length > 0) {
    textContent += `=========================================\n`;
    textContent += `RELATIONSHIPS & CONNECTED ENTITIES\n`;
    textContent += `=========================================\n`;
    character.relationships.forEach((rel) => {
      textContent += `- ${rel.targetName} [${rel.relationshipType}]: ${rel.notes || ''}\n`;
    });
    textContent += `\n`;
  }

  // 3. Export formats
  if (format === 'pdf') {
    onProgress?.('Generating PDF file...');
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    
    let y = 40;
    const margin = 40;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - 2 * margin; // 515pt
    
    const checkPageOverflow = (needed: number) => {
      if (y + needed > pageHeight - 50) {
        pdf.addPage();
        y = 40;
        pdf.setDrawColor(226, 232, 240);
        pdf.rect(margin - 10, margin - 10, pageWidth - 2 * margin + 20, pageHeight - 2 * margin + 20);
      }
    };

    // Draw page outer border
    pdf.setDrawColor(226, 232, 240);
    pdf.rect(margin - 10, margin - 10, pageWidth - 2 * margin + 20, pageHeight - 2 * margin + 20);
    
    // Draw Banner image if available
    if (bannerBase64) {
      try {
        pdf.addImage(bannerBase64, 'JPEG', margin, y, contentWidth, 120);
        y += 130;
      } catch (e) {
        console.error('Error drawing banner to PDF:', e);
        // Fallback header
        pdf.setFillColor(15, 23, 42);
        pdf.rect(margin, y, contentWidth, 50, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.setTextColor(255, 255, 255);
        pdf.text(`ARCHIVE BOOKLET: ${charName.toUpperCase()}`, margin + 15, y + 30);
        y += 70;
      }
    } else {
      pdf.setFillColor(15, 23, 42);
      pdf.rect(margin, y, contentWidth, 50, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`ARCHIVE BOOKLET: ${charName.toUpperCase()}`, margin + 15, y + 30);
      y += 70;
    }

    // Metadata layout & main portrait side-by-side
    checkPageOverflow(170);
    const metaBoxWidth = portraitBase64 ? 300 : contentWidth;
    const portraitWidth = 160;
    const portraitHeight = 160;

    pdf.setDrawColor(226, 232, 240);
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, y, metaBoxWidth, 160, 'FD');

    // Meta texts
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(71, 85, 105);
    pdf.text('Name:', margin + 15, y + 25);
    pdf.text('Type/Species:', margin + 15, y + 45);
    pdf.text('Gender:', margin + 15, y + 65);
    pdf.text('Status:', margin + 15, y + 85);
    pdf.text('Completion:', margin + 15, y + 105);
    pdf.text('Created Date:', margin + 15, y + 125);

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(15, 23, 42);
    pdf.text(String(character.name || 'N/A'), margin + 110, y + 25);
    pdf.text(String(character.species || 'N/A'), margin + 110, y + 45);
    pdf.text(String(character.gender || 'N/A'), margin + 110, y + 65);
    pdf.text(String(character.status || 'N/A'), margin + 110, y + 85);
    pdf.text(String(character.completionRating || 'N/A'), margin + 110, y + 105);
    pdf.text(`${character.dateCreated || 'N/A'} (Source: ${character.dateCreatedSource || 'Added Manually'})`, margin + 110, y + 125);

    if (portraitBase64) {
      try {
        pdf.addImage(portraitBase64, 'JPEG', margin + metaBoxWidth + 15, y, portraitWidth, portraitHeight);
        pdf.setDrawColor(203, 213, 225);
        pdf.rect(margin + metaBoxWidth + 15, y, portraitWidth, portraitHeight, 'D');
      } catch (e) {
        console.error('Error drawing portrait to PDF:', e);
      }
    }
    y += 180;

    // Character Description
    if (character.description) {
      checkPageOverflow(80);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(15, 23, 42);
      pdf.text('BIOGRAPHY & OVERVIEW', margin, y);
      y += 10;
      pdf.setDrawColor(203, 213, 225);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 15;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.setTextColor(51, 65, 85);
      const descLines = pdf.splitTextToSize(character.description, contentWidth);
      descLines.forEach((line: string) => {
        checkPageOverflow(15);
        pdf.text(line, margin, y);
        y += 14;
      });
      y += 20;
    }

    // Bible pages
    if (character.biblePages && character.biblePages.length > 0) {
      character.biblePages.forEach(p => {
        checkPageOverflow(80);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(15, 23, 42);
        pdf.text(p.title.toUpperCase(), margin, y);
        y += 10;
        pdf.setDrawColor(203, 213, 225);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 15;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9.5);
        pdf.setTextColor(51, 65, 85);
        const lines = pdf.splitTextToSize(p.content || '(No content)', contentWidth);
        lines.forEach((line: string) => {
          checkPageOverflow(15);
          pdf.text(line, margin, y);
          y += 14;
        });
        y += 20;
      });
    }

    // ASSOCIATED GALLERY & VARIATIONS
    if (subImagesBase64.length > 0) {
      checkPageOverflow(100);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42);
      pdf.text('ASSOCIATED GALLERY & VARIATIONS', margin, y);
      y += 10;
      pdf.setDrawColor(203, 213, 225);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 20;

      for (const sub of subImagesBase64) {
        checkPageOverflow(150);
        const boxHeight = 110;
        const subImgWidth = 120;
        const subImgHeight = 90;

        // Draw sub image card container
        pdf.setDrawColor(226, 232, 240);
        pdf.setFillColor(250, 250, 250);
        pdf.rect(margin, y, contentWidth, boxHeight, 'F');

        if (sub.base64) {
          try {
            pdf.addImage(sub.base64, 'JPEG', margin + 10, y + 10, subImgWidth, subImgHeight);
            pdf.setDrawColor(203, 213, 225);
            pdf.rect(margin + 10, y + 10, subImgWidth, subImgHeight, 'D');
          } catch (e) {
            console.error('Error drawing gallery image to PDF:', e);
          }
        } else {
          // Draw grey placeholder box if no image
          pdf.setFillColor(240, 240, 240);
          pdf.rect(margin + 10, y + 10, subImgWidth, subImgHeight, 'F');
          pdf.setFont('helvetica', 'italic');
          pdf.setFontSize(8);
          pdf.setTextColor(150, 150, 150);
          pdf.text('[No Image Preview]', margin + 30, y + 50);
        }

        // Draw text description on the right
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(15, 23, 42);
        pdf.text(sub.title.toUpperCase(), margin + 145, y + 25);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.setTextColor(71, 85, 105);
        const subDescLines = pdf.splitTextToSize(sub.description || '(No description provided)', contentWidth - 165);
        let textY = y + 42;
        subDescLines.slice(0, 5).forEach((line: string) => {
          pdf.text(line, margin + 145, textY);
          textY += 12;
        });

        y += boxHeight + 15;
      }
    }

    // PROJECTS & STORYBOARDS
    if (character.projects && character.projects.length > 0) {
      checkPageOverflow(100);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42);
      pdf.text('PRODUCTION PROJECTS & STORYBOARDS', margin, y);
      y += 10;
      pdf.setDrawColor(203, 213, 225);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 20;

      for (const proj of character.projects) {
        checkPageOverflow(80);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(30, 41, 59);
        pdf.text(`${proj.projectName.toUpperCase()} (${proj.roleOrRelation})`, margin, y);
        y += 14;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(71, 85, 105);
        pdf.text(`Status: ${proj.status}`, margin, y);
        y += 14;

        if (proj.description) {
          const projDescLines = pdf.splitTextToSize(proj.description, contentWidth);
          projDescLines.forEach((line: string) => {
            checkPageOverflow(15);
            pdf.text(line, margin, y);
            y += 13;
          });
          y += 10;
        }

        // Render Storyboard tables if any
        if (proj.tables && proj.tables.length > 0) {
          for (const table of proj.tables) {
            checkPageOverflow(100);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(9.5);
            pdf.setTextColor(15, 23, 42);
            pdf.text(`Storyboard Table: ${table.title}`, margin, y);
            y += 15;

            // Draw table columns header
            const colWidth = contentWidth / table.columns.length;
            
            // Draw header background
            pdf.setFillColor(241, 245, 249);
            pdf.rect(margin, y, contentWidth, 20, 'F');
            pdf.setDrawColor(203, 213, 225);
            pdf.rect(margin, y, contentWidth, 20, 'D');

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            pdf.setTextColor(51, 65, 85);
            table.columns.forEach((col, cIdx) => {
              pdf.text(col, margin + (cIdx * colWidth) + 8, y + 13);
            });
            y += 20;

            // Draw rows
            for (const row of table.rows) {
              // Calculate row height (use taller row if there is an image)
              const hasImgInRow = row.some(cell => cell.isImage && cell.content);
              const rowHeight = hasImgInRow ? 70 : 35;

              checkPageOverflow(rowHeight + 10);

              // Draw row background
              pdf.setFillColor(255, 255, 255);
              pdf.rect(margin, y, contentWidth, rowHeight, 'F');
              pdf.setDrawColor(226, 232, 240);
              pdf.rect(margin, y, contentWidth, rowHeight, 'D');

              pdf.setFont('helvetica', 'normal');
              pdf.setFontSize(7.5);
              pdf.setTextColor(71, 85, 105);

              row.forEach((cell, cIdx) => {
                // Vertical grid lines
                if (cIdx > 0) {
                  pdf.setDrawColor(226, 232, 240);
                  pdf.line(margin + (cIdx * colWidth), y, margin + (cIdx * colWidth), y + rowHeight);
                }

                if (cell.isImage && cell.content) {
                  const b64 = storyboardImagesBase64[cell.content];
                  if (b64) {
                    try {
                      // Center the image in cell
                      const imgW = colWidth - 16;
                      const imgH = rowHeight - 16;
                      pdf.addImage(b64, 'JPEG', margin + (cIdx * colWidth) + 8, y + 8, imgW, imgH);
                      pdf.setDrawColor(203, 213, 225);
                      pdf.rect(margin + (cIdx * colWidth) + 8, y + 8, imgW, imgH, 'D');
                    } catch (e) {
                      pdf.text('[Image Render Error]', margin + (cIdx * colWidth) + 8, y + 30);
                    }
                  } else {
                    pdf.text('[No Image Preview]', margin + (cIdx * colWidth) + 8, y + 30);
                  }
                } else {
                  // Text wrapping inside column width
                  const cellTextLines = pdf.splitTextToSize(cell.content || '', colWidth - 16);
                  let lineY = y + 14;
                  cellTextLines.slice(0, 5).forEach((line: string) => {
                    pdf.text(line, margin + (cIdx * colWidth) + 8, lineY);
                    lineY += 10;
                  });
                }
              });
              y += rowHeight;
            }
            y += 15; // Space after table
          }
        }
        y += 20; // Space after project
      }
    }

    pdf.save(`${charName}_Archive_Booklet.pdf`);
    onProgress?.('PDF exported successfully!');

  } else if (format === 'word') {
    onProgress?.('Generating Word file...');
    
    // Build HTML pages for sub-images/variations
    let subImagesHtml = '';
    if (subImagesBase64.length > 0) {
      subImagesHtml += `
        <h2>ASSOCIATED GALLERY & VARIATIONS</h2>
        <div style="display: flex; flex-direction: column; gap: 20px; margin-bottom: 30px;">
      `;
      subImagesBase64.forEach(sub => {
        const imgSrc = sub.base64 || 'https://via.placeholder.com/150?text=[No+Image]';
        subImagesHtml += `
          <table style="width: 100%; border: 1px solid #e2e8f0; border-collapse: collapse; background-color: #fafafa; margin-bottom: 15px;">
            <tr>
              <td style="width: 150px; padding: 12px; text-align: center; vertical-align: top; border: 1px solid #e2e8f0;">
                <img src="${imgSrc}" style="max-width: 130px; max-height: 100px; border: 1px solid #cbd5e1; border-radius: 4px;" />
              </td>
              <td style="padding: 16px; vertical-align: top; border: 1px solid #e2e8f0;">
                <h3 style="margin: 0 0 8px 0; color: #0f172a; font-size: 16px;">${sub.title.toUpperCase()}</h3>
                <p style="margin: 0; color: #475569; font-size: 13px; line-height: 1.5;">${sub.description || '(No description)'}</p>
              </td>
            </tr>
          </table>
        `;
      });
      subImagesHtml += `</div>`;
    }

    // Build HTML pages for projects/storyboard sheets
    let projectsHtml = '';
    if (character.projects && character.projects.length > 0) {
      projectsHtml += `<h2>PRODUCTION PROJECTS & STORYBOARDS</h2>`;
      character.projects.forEach(proj => {
        projectsHtml += `
          <div style="margin-bottom: 25px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 20px;">
            <h3 style="color: #1e293b; margin-bottom: 4px;">${proj.projectName.toUpperCase()} (${proj.roleOrRelation})</h3>
            <p style="color: #64748b; font-size: 12px; margin: 0 0 10px 0;">Status: ${proj.status}</p>
            <p style="font-size: 14px; color: #334155; line-height: 1.6; margin-bottom: 15px;">${proj.description || '(No description)'}</p>
        `;

        if (proj.tables && proj.tables.length > 0) {
          proj.tables.forEach(table => {
            projectsHtml += `
              <h4 style="color: #334155; margin: 15px 0 8px 0;">Storyboard Table: ${table.title}</h4>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
                <thead>
                  <tr style="background-color: #f1f5f9;">
            `;
            table.columns.forEach(col => {
              projectsHtml += `<th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-weight: bold; color: #334155;">${col}</th>`;
            });
            projectsHtml += `
                  </tr>
                </thead>
                <tbody>
            `;
            table.rows.forEach(row => {
              projectsHtml += `<tr>`;
              row.forEach(cell => {
                projectsHtml += `<td style="border: 1px solid #cbd5e1; padding: 10px; vertical-align: top; color: #475569;">`;
                if (cell.isImage && cell.content) {
                  const b64 = storyboardImagesBase64[cell.content];
                  if (b64) {
                    projectsHtml += `<img src="${b64}" style="max-height: 80px; max-width: 120px; border-radius: 4px; border: 1px solid #cbd5e1;" />`;
                  } else {
                    projectsHtml += `[No Image Preview]`;
                  }
                } else {
                  projectsHtml += (cell.content || '').replace(/\n/g, '<br/>');
                }
                projectsHtml += `</td>`;
              });
              projectsHtml += `</tr>`;
            });
            projectsHtml += `
                </tbody>
              </table>
            `;
          });
        }
        projectsHtml += `</div>`;
      });
    }

    const biblePagesHtml = (character.biblePages || []).map((p, idx) => `
      <h2>${idx + 1}. ${p.title.toUpperCase()}</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 25px;">${(p.content || '(No content)').replace(/\n/g, '<br/>')}</p>
    `).join('');

    const bannerHtml = bannerBase64 
      ? `<img src="${bannerBase64}" style="width: 100%; max-height: 250px; object-fit: cover; border-radius: 8px; margin-bottom: 25px;" />` 
      : '';

    const portraitHtml = portraitBase64
      ? `<img src="${portraitBase64}" style="max-width: 100%; max-height: 250px; border-radius: 6px; border: 1px solid #e2e8f0; display: block; margin: 0 auto;" />`
      : '<div style="background-color: #f1f5f9; height: 180px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 13px;">[No Portrait Attached]</div>';

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>Archive Booklet - ${charName}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #334155; margin: 40px; }
          h1 { color: #0f172a; border-bottom: 3px solid #0f172a; padding-bottom: 8px; font-size: 26px; font-weight: bold; margin-bottom: 25px; }
          h2 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; font-size: 18px; margin-top: 35px; font-weight: bold; }
          h3 { color: #334155; font-size: 15px; margin-top: 20px; font-weight: bold; }
          table.meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; background-color: #f8fafc; }
          table.meta-table td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
          .meta-label { font-weight: bold; color: #475569; width: 140px; background-color: #f1f5f9; }
        </style>
      </head>
      <body>
        ${bannerHtml}
        <h1>ARCHIVE DOCUMENTATION: ${charName.toUpperCase()}</h1>
        
        <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 30px;">
          <tr>
            <td style="width: 60%; vertical-align: top; border: none; padding-right: 25px;">
              <table class="meta-table">
                <tr><td class="meta-label">Name</td><td style="font-weight: bold; color: #0f172a;">${character.name || 'Unnamed'}</td></tr>
                <tr><td class="meta-label">Type/Species</td><td>${character.species || 'N/A'}</td></tr>
                <tr><td class="meta-label">Gender</td><td>${character.gender || 'N/A'}</td></tr>
                <tr><td class="meta-label">Status</td><td>${character.status || 'N/A'}</td></tr>
                <tr><td class="meta-label">Completion</td><td>${character.completionRating || 'N/A'}</td></tr>
                <tr><td class="meta-label">Creation Date</td><td>${character.dateCreated || 'N/A'} (${character.dateCreatedSource || 'Added Manually'})</td></tr>
              </table>
            </td>
            <td style="width: 40%; vertical-align: top; border: none; text-align: center;">
              ${portraitHtml}
            </td>
          </tr>
        </table>

        ${character.description ? `<h2>BIOGRAPHY & OVERVIEW</h2><p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 25px;">${character.description.replace(/\n/g, '<br/>')}</p>` : ''}
        
        ${biblePagesHtml}
        
        ${subImagesHtml}

        ${projectsHtml}
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const { saveAs } = await import('file-saver');
    saveAs(blob, `${charName}_Archive_Booklet.doc`);
    onProgress?.('Word file exported successfully!');

  } else if (format === 'gdocs') {
    onProgress?.('Exporting directly to Google Docs...');
    const token = await getAccessToken();
    if (!token) {
      throw new Error("Please link your Google Account via Settings or sign in first to export directly to Google Docs.");
    }
    
    const response = await fetch('/api/export-docs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `${charName} Archive Booklet`,
        text: textContent,
        accessToken: token
      })
    });
    
    if (response.ok) {
      onProgress?.('Google Docs exported successfully!');
    } else {
      const errText = await response.text();
      throw new Error(errText);
    }
  }
};
