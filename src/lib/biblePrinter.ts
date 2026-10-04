import { Character, SubImage, ProjectRelation, ProjectTable, BiblePage, AudioMetadata } from '../types';
import { executePrintDocument } from '../utils/printHelper';

export interface BibleSectionOption {
  id: string;
  title: string;
  desc: string;
  description?: string;
  category?: string;
}

export type BibleTheme = 
  | 'magazine' 
  | 'portfolio' 
  | 'high-tech' 
  | 'vintage' 
  | 'noir' 
  | 'comic'
  | 'clean-editorial'
  | 'glossy-magazine'
  | 'cyber-dossier'
  | 'vintage-archive'
  | 'dark-anthology';

export interface BiblePrintOptions {
  character?: Character;
  mode?: 'bible' | 'magazine' | 'dossier' | 'custom' | string;
  printMode?: string;
  theme?: BibleTheme;
  pageSize?: 'letter' | 'a4' | 'a3' | 'legal' | string;
  galleryLayout?: '1-per-page' | '2-per-page' | '2-grid' | '4-grid' | '6-grid' | '12-grid' | string;
  imageFit?: 'contain' | 'cover' | 'fill' | 'scale-down' | string;
  customHeader?: string;
  customFooter?: string;
  runningHeader?: string;
  runningFooter?: string;
  selectedSections?: string[];
  sections?: string[];
  includeCoverBanner?: boolean;
  fontSize?: string;
}

export const ALL_BIBLE_SECTIONS: BibleSectionOption[] = [
  { id: 'cover', title: 'Front Cover & Title Sheet', desc: 'Large title, subtitle/tagline, hero portrait, core badges, and creator metadata', category: 'Overview' },
  { id: 'profile', title: 'Biography & Historical Chronology', desc: 'Narrative origin story, legacy milestones, physical/psychological stats table, and color palette', category: 'Lore & Identity' },
  { id: 'codex', title: 'Character Codex & Bible Lore Chapters', desc: 'Complete hierarchical story chapters, subpages, world rules, and personality dossiers', category: 'Codex' },
  { id: 'gallery', title: 'Visual Media Gallery & Asset Roster', desc: 'Curated 2D artworks, design turnarounds, sketches, and reference plates', category: 'Visual Assets' },
  { id: 'videos', title: 'Video Production & Storyboard Frames', desc: 'Video rosters, timecodes, storyboard frames, and animation scene references', category: 'Media' },
  { id: 'audio', title: 'Audio Tracks & Voice Discography', desc: 'Soundtrack cues, voice logs, waveform graphics, and dialogue transcripts', category: 'Media' },
  { id: '3d-specs', title: '3D Model Rigging & Mannequin Specs', desc: 'Polycount, bone hierarchy, animation sets, armor/weapon attachment sockets', category: 'Technical' },
  { id: 'code', title: 'Source Code & Application Scripts', desc: 'Scripts, configurations, shaders, and automation utilities formatted in monospace syntax', category: 'Technical' },
  { id: 'projects', title: 'Projects Portfolio & Storyboard Tables', desc: 'Collaborative works, publication statuses, storyboards, and connected roles', category: 'Portfolio' },
  { id: 'relations', title: 'Relationship & Connected Entity Matrix', desc: 'Allies, rivals, mentors, factions, and lore connection notes', category: 'Social Network' },
  { id: 'specs', title: 'Technical Specifications & Metadata Ledger', desc: 'Creation dates, upload timestamps, sourcing logs, and attributes dictionary', category: 'Technical' },
  { id: 'dev-logs', title: 'Development Tracker & Credits Roster', desc: 'Production hours ledger, milestones, and full contributor credit roster', category: 'Archival' },
  { id: 'back', title: 'Back Cover & Master Index', desc: 'Table of contents index, archive verification stamp, and publication colophon', category: 'Archival' }
];

export function generateBibleHtml(options: BiblePrintOptions): string {
  const character = options.character || ({} as Character);
  const mode = options.mode || options.printMode || 'bible';
  const theme = options.theme || 'magazine';
  const pageSize = options.pageSize || 'letter';
  const galleryLayout = options.galleryLayout || '4-grid';
  const imageFit = options.imageFit || 'contain';
  const customHeader = options.runningHeader || options.customHeader || 'OFFICIAL PRODUCTION BIBLE & MASTER ARCHIVE';
  const customFooter = options.runningFooter || options.customFooter || 'Confidential Documentation • Page {page} of {total}';
  const selectedSections = options.sections || options.selectedSections;

  const charName = character.name || 'Untitled Entity / Character';
  const charTagline = character.tagline || character.description || '';
  const charSpecies = character.species || 'Unknown Nature';
  const charGender = character.gender || 'Others';
  const charStatus = character.status || 'Active';
  const charRating = character.completionRating || '100%';
  const charCreator = character.creator || 'Alberto Armentero';
  const charCreated = character.dateCreated || new Date().toISOString().split('T')[0];
  const charUploaded = character.dateUploaded || charCreated;
  const portraitUrl = character.highlightedImageSrc || character.defaultThumbnailSrc || '';
  const bannerUrl = character.bannerImageSrc || '';

  // Determine active sections based on mode or custom selection
  let activeSections = selectedSections;
  if (!activeSections || activeSections.length === 0) {
    if (mode === 'dossier' || mode === 'basic-dossier') {
      activeSections = ['cover', 'profile', 'specs'];
    } else if (mode === 'magazine' || mode === 'gallery-focus') {
      activeSections = ['cover', 'profile', 'codex', 'gallery', 'projects', 'specs', 'back'];
    } else if (mode === 'lore-focus') {
      activeSections = ['cover', 'profile', 'codex', 'relations', 'projects', 'back'];
    } else {
      // Bible mode (ALL sections)
      activeSections = ALL_BIBLE_SECTIONS.map(s => s.id);
    }
  }

  // Paper size dimensions
  const sizeMap: Record<string, string> = {
    'letter': '8.5in 11in',
    'a4': '210mm 297mm',
    'a3': '297mm 420mm',
    'legal': '8.5in 14in'
  };
  const pageDimension = sizeMap[pageSize] || '8.5in 11in';

  // CSS Styling based on Theme
  let themeStyles = '';
  if (theme === 'magazine' || theme === 'glossy-magazine' || theme === 'clean-editorial') {
    themeStyles = `
      body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; background: #ffffff; }
      h1 { font-family: Georgia, serif; font-size: 32pt; font-weight: 900; color: #4338ca; text-transform: uppercase; letter-spacing: -0.5px; }
      h2 { font-family: Georgia, serif; font-size: 18pt; font-weight: bold; color: #1e1b4b; border-bottom: 2px solid #e0e7ff; padding-bottom: 6px; margin-top: 0; }
      h3 { font-family: 'Helvetica Neue', sans-serif; font-size: 11pt; font-weight: bold; color: #4338ca; }
      .card { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 8px; padding: 12px; }
      .badge { background: #e0e7ff; color: #3730a3; padding: 3px 8px; border-radius: 9999px; font-weight: bold; font-size: 8pt; }
      .accent-box { border-left: 4px solid #4f46e5; background: #f5f3ff; padding: 10px; border-radius: 0 8px 8px 0; }
    `;
  } else if (theme === 'portfolio') {
    themeStyles = `
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; background: #fafafa; }
      h1 { font-size: 28pt; font-weight: 300; letter-spacing: 3px; text-transform: uppercase; border-bottom: 2px solid #0f172a; padding-bottom: 10px; }
      h2 { font-size: 16pt; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 0; }
      h3 { font-size: 10pt; font-weight: 600; text-transform: uppercase; color: #475569; }
      .card { border: 1px solid #e2e8f0; background: #ffffff; border-radius: 4px; padding: 12px; }
      .badge { background: #0f172a; color: #ffffff; padding: 2px 6px; border-radius: 2px; font-size: 7.5pt; text-transform: uppercase; }
      .accent-box { border: 1px solid #0f172a; background: #ffffff; padding: 12px; }
    `;
  } else if (theme === 'high-tech' || theme === 'cyber-dossier') {
    themeStyles = `
      body { font-family: 'Courier New', Courier, monospace; color: #22c55e; background: #050505; }
      h1 { font-size: 26pt; font-weight: bold; color: #4ade80; text-transform: uppercase; letter-spacing: 2px; text-shadow: 0 0 8px rgba(74, 222, 128, 0.4); }
      h2 { font-size: 16pt; font-weight: bold; color: #22c55e; border-bottom: 1px dashed #16a34a; padding-bottom: 4px; margin-top: 0; }
      h3 { font-size: 11pt; font-weight: bold; color: #86efac; }
      .card { border: 1px solid #166534; background: #09170f; border-radius: 4px; padding: 10px; color: #bbf7d0; }
      .badge { background: #14532d; color: #4ade80; border: 1px solid #22c55e; padding: 2px 6px; font-size: 8pt; }
      .accent-box { border: 1px solid #22c55e; background: #022c22; padding: 10px; }
      .header-line, .footer-line { color: #16a34a !important; border-color: #166534 !important; }
      table td, table th { border-color: #166534 !important; }
    `;
  } else if (theme === 'vintage' || theme === 'vintage-archive') {
    themeStyles = `
      body { font-family: 'Times New Roman', Times, serif; color: #451a03; background: #fffbeb; }
      h1 { font-size: 32pt; font-weight: normal; font-style: italic; color: #78350f; text-align: center; border-bottom: 2px double #b45309; padding-bottom: 10px; }
      h2 { font-size: 18pt; font-weight: bold; color: #92400e; border-bottom: 1px solid #d97706; padding-bottom: 4px; margin-top: 0; }
      h3 { font-size: 12pt; font-weight: bold; color: #b45309; }
      .card { border: 1px solid #fde68a; background: #fef3c7; border-radius: 6px; padding: 12px; }
      .badge { background: #fde68a; color: #78350f; border: 1px solid #d97706; padding: 2px 6px; font-size: 8pt; }
      .accent-box { border: 1px solid #d97706; background: #fef3c7; padding: 10px; font-style: italic; }
    `;
  } else if (theme === 'noir' || theme === 'dark-anthology') {
    themeStyles = `
      body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; background: #121212; }
      h1 { font-size: 30pt; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: 1px; }
      h2 { font-size: 17pt; font-weight: 700; color: #e2e8f0; border-bottom: 2px solid #334155; padding-bottom: 6px; margin-top: 0; }
      h3 { font-size: 11pt; font-weight: 700; color: #94a3b8; }
      .card { border: 1px solid #27272a; background: #18181b; border-radius: 8px; padding: 12px; color: #d4d4d8; }
      .badge { background: #27272a; color: #f4f4f5; border: 1px solid #3f3f46; padding: 2px 8px; border-radius: 9999px; font-size: 8pt; }
      .accent-box { border-left: 4px solid #71717a; background: #1c1917; padding: 10px; border-radius: 0 8px 8px 0; }
      .header-line, .footer-line { color: #71717a !important; border-color: #27272a !important; }
      table td, table th { border-color: #27272a !important; }
    `;
  } else {
    // Comic Book theme
    themeStyles = `
      body { font-family: 'Impact', 'Arial Black', sans-serif; color: #111827; background: #ffffff; }
      h1 { font-size: 34pt; font-weight: 900; color: #dc2626; text-transform: uppercase; text-shadow: 2px 2px 0px #000; letter-spacing: 1px; }
      h2 { font-family: 'Impact', sans-serif; font-size: 20pt; color: #2563eb; border-bottom: 3px solid #000; padding-bottom: 4px; text-transform: uppercase; margin-top: 0; }
      h3 { font-family: sans-serif; font-size: 11pt; font-weight: 900; color: #dc2626; text-transform: uppercase; }
      .card { border: 2px solid #000; background: #fffbeb; border-radius: 8px; padding: 12px; box-shadow: 3px 3px 0px #000; }
      .badge { background: #facc15; color: #000; border: 1.5px solid #000; padding: 3px 8px; font-weight: 900; font-size: 8pt; text-transform: uppercase; }
      .accent-box { border: 2px solid #000; background: #fef08a; padding: 10px; box-shadow: 3px 3px 0px #000; }
    `;
  }

  // Calculate Image Fit Style
  const imgFitStyle = `object-fit: ${imageFit}; ${imageFit === 'fill' ? 'width: 100%; height: 100%;' : ''}`;

  // Build the individual printable page sheets
  const pages: string[] = [];

  // ==========================================
  // 1. COVER PAGE
  // ==========================================
  if (activeSections.includes('cover')) {
    pages.push(`
      <div class="booklet-page">
        <div class="header-line">${customHeader}</div>
        <div class="content-body cover-content">
          ${bannerUrl ? `
            <div style="width: 100%; height: 1.8in; border-radius: 8px; overflow: hidden; margin-bottom: 20px; border: 1px solid #cbd5e1;">
              <img src="${bannerUrl}" style="width: 100%; height: 100%; ${imgFitStyle}" referrerPolicy="no-referrer" />
            </div>
          ` : ''}

          <div style="text-align: center; margin: 15px 0;">
            <span class="badge" style="margin-bottom: 12px; font-size: 9pt; letter-spacing: 2px;">
              ${mode === 'bible' ? 'COMPLETE PRODUCTION BIBLE' : mode === 'magazine' ? 'OFFICIAL SPEC SHEET DOSSIER' : 'EXECUTIVE BRIEFING'}
            </span>
            <h1 style="margin: 8px 0;">${charName}</h1>
            ${charTagline ? `<p style="font-size: 13pt; font-style: italic; opacity: 0.85; max-width: 80%; margin: 8px auto 20px auto; line-height: 1.4;">"${charTagline}"</p>` : ''}
          </div>

          ${portraitUrl ? `
            <div style="width: 3.2in; height: 3.2in; margin: 15px auto; border-radius: 12px; overflow: hidden; border: 2px solid #94a3b8; background: #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
              <img src="${portraitUrl}" style="width: 100%; height: 100%; ${imgFitStyle}" referrerPolicy="no-referrer" />
            </div>
          ` : `
            <div style="width: 3in; height: 2.2in; margin: 20px auto; border-radius: 12px; border: 2px dashed #cbd5e1; display: flex; align-items: center; justify-content: center; font-style: italic; opacity: 0.6;">
              [No Primary Portrait Attached]
            </div>
          `}

          <div style="margin-top: 25px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 9pt; text-align: left;" class="card">
            <div>
              <p style="margin: 2px 0;"><strong>Nature / Species:</strong> ${charSpecies}</p>
              <p style="margin: 2px 0;"><strong>Gender / Class:</strong> ${charGender}</p>
              <p style="margin: 2px 0;"><strong>Status:</strong> ${charStatus}</p>
            </div>
            <div>
              <p style="margin: 2px 0;"><strong>Creator / Studio:</strong> ${charCreator}</p>
              <p style="margin: 2px 0;"><strong>Creation Date:</strong> ${charCreated}</p>
              <p style="margin: 2px 0;"><strong>Registry Date:</strong> ${charUploaded}</p>
            </div>
          </div>
        </div>
        <div class="footer-line">
          <span>${customFooter.replace('{page}', String(pages.length + 1)).replace('{total}', '%%TOTAL%%')}</span>
          <span>MASTER ANTHOLOGY • VOL. 1</span>
        </div>
      </div>
    `);
  }

  // ==========================================
  // 2. BIOGRAPHY & HISTORICAL CHRONOLOGY
  // ==========================================
  if (activeSections.includes('profile')) {
    const attributes = character.attributes || {};
    const palette = character.colorPalette || ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b'];

    pages.push(`
      <div class="booklet-page">
        <div class="header-line">${customHeader}</div>
        <div class="content-body">
          <h2>Biography & Historical Chronology</h2>
          
          <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div class="card">
              <h3>Core Narrative Premise</h3>
              <p style="font-size: 9.5pt; line-height: 1.6; margin-top: 4px;">
                ${character.description || 'No long-form narrative biography documented.'}
              </p>
              ${character.personality ? `
                <h3 style="margin-top: 12px;">Personality & Behavioral Traits</h3>
                <p style="font-size: 9pt; line-height: 1.5; opacity: 0.9;">${character.personality}</p>
              ` : ''}
            </div>

            <div class="card">
              <h3>Attributes & Physical Specs</h3>
              <table style="width: 100%; font-size: 8.5pt; border-collapse: collapse; line-height: 1.8;">
                <tr style="border-bottom: 1px solid rgba(0,0,0,0.1);"><td style="font-weight: bold; width: 45%;">Species / Type</td><td>${charSpecies}</td></tr>
                <tr style="border-bottom: 1px solid rgba(0,0,0,0.1);"><td style="font-weight: bold;">Gender / Category</td><td>${charGender}</td></tr>
                <tr style="border-bottom: 1px solid rgba(0,0,0,0.1);"><td style="font-weight: bold;">Age</td><td>${character.age || 'N/A'}</td></tr>
                <tr style="border-bottom: 1px solid rgba(0,0,0,0.1);"><td style="font-weight: bold;">Role / Title</td><td>${character.role || 'Main Entity'}</td></tr>
                <tr style="border-bottom: 1px solid rgba(0,0,0,0.1);"><td style="font-weight: bold;">Completion Rating</td><td>${charRating}</td></tr>
                ${Object.entries(attributes).slice(0, 4).map(([k, v]) => `
                  <tr style="border-bottom: 1px solid rgba(0,0,0,0.1);"><td style="font-weight: bold;">${k}</td><td>${v}</td></tr>
                `).join('')}
              </table>

              <h3 style="margin-top: 12px; margin-bottom: 6px;">Thematic Color Palette</h3>
              <div style="display: flex; gap: 6px; align-items: center;">
                ${palette.map(hex => `
                  <div style="display: flex; flex-direction: column; align-items: center;">
                    <div style="width: 28px; height: 28px; background-color: ${hex}; border-radius: 4px; border: 1px solid rgba(0,0,0,0.2);"></div>
                    <span style="font-size: 6.5pt; font-family: monospace; margin-top: 2px;">${hex}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          ${character.history ? `
            <div class="card" style="margin-top: 10px;">
              <h3>Historic Timeline & Origin Lore</h3>
              <p style="font-size: 9pt; line-height: 1.5; margin-top: 4px;">${character.history}</p>
            </div>
          ` : ''}

          ${(character.abilities || character.strengths || character.weaknesses) ? `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
              ${character.abilities ? `
                <div class="card">
                  <h3>Special Abilities & Power Metrics</h3>
                  <p style="font-size: 8.5pt; line-height: 1.4;">${character.abilities}</p>
                </div>
              ` : ''}
              ${(character.strengths || character.weaknesses) ? `
                <div class="card">
                  <h3>Strengths & Vulnerabilities</h3>
                  ${character.strengths ? `<p style="font-size: 8.5pt; margin: 2px 0;"><strong>Strengths:</strong> ${character.strengths}</p>` : ''}
                  ${character.weaknesses ? `<p style="font-size: 8.5pt; margin: 2px 0;"><strong>Weaknesses:</strong> ${character.weaknesses}</p>` : ''}
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
        <div class="footer-line">
          <span>${customFooter.replace('{page}', String(pages.length + 1)).replace('{total}', '%%TOTAL%%')}</span>
          <span>CHRONOLOGY & BIOGRAPHY</span>
        </div>
      </div>
    `);
  }

  // ==========================================
  // 3. CODEX & BIBLE LORE CHAPTERS
  // ==========================================
  if (activeSections.includes('codex')) {
    const biblePages = character.biblePages || [];
    
    if (biblePages.length === 0) {
      pages.push(`
        <div class="booklet-page">
          <div class="header-line">${customHeader}</div>
          <div class="content-body">
            <h2>Character Codex & Worldbuilding Bible</h2>
            <div class="card" style="margin-top: 20px; text-align: center; padding: 30px;">
              <p style="font-style: italic; opacity: 0.7;">No codex chapters or worldbuilding bible entries initialized yet.</p>
            </div>
          </div>
          <div class="footer-line">
            <span>${customFooter.replace('{page}', String(pages.length + 1)).replace('{total}', '%%TOTAL%%')}</span>
            <span>CODEX & LORE</span>
          </div>
        </div>
      `);
    } else {
      // Chunk bible pages 2 per printed sheet to allow full readability
      for (let i = 0; i < biblePages.length; i += 2) {
        const batch = biblePages.slice(i, i + 2);
        pages.push(`
          <div class="booklet-page">
            <div class="header-line">${customHeader}</div>
            <div class="content-body">
              <h2>Character Codex & Story Bible (Section ${Math.floor(i / 2) + 1})</h2>
              <div style="display: flex; flex-direction: column; gap: 15px; margin-top: 10px;">
                ${batch.map((bp, bpIdx) => `
                  <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 4px; margin-bottom: 8px;">
                      <h3 style="margin: 0;">Chapter ${i + bpIdx + 1}: ${bp.title}</h3>
                      ${bp.isLocked ? `<span class="badge">SECURE LORE</span>` : ''}
                    </div>
                    <div style="font-size: 9pt; line-height: 1.6; white-space: pre-wrap; opacity: 0.95;">
                      ${bp.content || '(No narrative content compiled)'}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="footer-line">
              <span>${customFooter.replace('{page}', String(pages.length + 1)).replace('{total}', '%%TOTAL%%')}</span>
              <span>CODEX • CHAPTERS ${i + 1}-${Math.min(i + batch.length, biblePages.length)}</span>
            </div>
          </div>
        `);
      }
    }
  }

  // ==========================================
  // 4. ART & MEDIA GALLERY (CONFIGURABLE LAYOUTS & STRETCH)
  // ==========================================
  if (activeSections.includes('gallery')) {
    const subImages = character.subImages || [];
    
    if (subImages.length === 0) {
      pages.push(`
        <div class="booklet-page">
          <div class="header-line">${customHeader}</div>
          <div class="content-body">
            <h2>Visual Media Gallery & Artwork Sheets</h2>
            <div class="card" style="margin-top: 20px; text-align: center; padding: 30px;">
              <p style="font-style: italic; opacity: 0.7;">No additional artwork variations or sub-images uploaded.</p>
            </div>
          </div>
          <div class="footer-line">
            <span>${customFooter.replace('{page}', String(pages.length + 1)).replace('{total}', '%%TOTAL%%')}</span>
            <span>GALLERY</span>
          </div>
        </div>
      `);
    } else {
      // Chunk gallery images based on layout
      let chunkSize = 4;
      let gridCss = 'grid-template-columns: 1fr 1fr;';
      let imgHeight = '2.2in';

      if (galleryLayout === '1-per-page') {
        chunkSize = 1;
        gridCss = 'grid-template-columns: 1fr;';
        imgHeight = '5.5in';
      } else if (galleryLayout === '2-per-page') {
        chunkSize = 2;
        gridCss = 'grid-template-columns: 1fr;';
        imgHeight = '3.5in';
      } else if (galleryLayout === '6-grid') {
        chunkSize = 6;
        gridCss = 'grid-template-columns: 1fr 1fr 1fr;';
        imgHeight = '1.8in';
      } else if (galleryLayout === '12-grid') {
        chunkSize = 12;
        gridCss = 'grid-template-columns: repeat(4, 1fr);';
        imgHeight = '1.2in';
      }

      for (let i = 0; i < subImages.length; i += chunkSize) {
        const batch = subImages.slice(i, i + chunkSize);
        pages.push(`
          <div class="booklet-page">
            <div class="header-line">${customHeader}</div>
            <div class="content-body">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h2 style="margin: 0;">Artwork & Concept Gallery (Part ${Math.floor(i / chunkSize) + 1})</h2>
                <span class="badge">${galleryLayout.replace('-', ' ').toUpperCase()} • FIT: ${imageFit.toUpperCase()}</span>
              </div>

              <div style="display: grid; ${gridCss} gap: 12px; margin-top: 8px;">
                ${batch.map((img, imgIdx) => `
                  <div class="card" style="display: flex; flex-direction: column; overflow: hidden; padding: 8px;">
                    <div style="width: 100%; height: ${imgHeight}; overflow: hidden; border-radius: 6px; background: rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.1); margin-bottom: 6px; display: flex; align-items: center; justify-content: center;">
                      <img src="${img.src}" style="width: 100%; height: 100%; ${imgFitStyle}" referrerPolicy="no-referrer" />
                    </div>
                    <div style="padding: 2px 4px;">
                      <p style="font-weight: bold; font-size: 8.5pt; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${img.title || `Artwork Sheet #${i + imgIdx + 1}`}
                      </p>
                      ${img.description ? `
                        <p style="font-size: 7.5pt; margin: 2px 0 0 0; opacity: 0.8; line-height: 1.3; max-height: 2.6em; overflow: hidden;">
                          ${img.description}
                        </p>
                      ` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="footer-line">
              <span>${customFooter.replace('{page}', String(pages.length + 1)).replace('{total}', '%%TOTAL%%')}</span>
              <span>GALLERY • ASSETS ${i + 1}-${Math.min(i + batch.length, subImages.length)} OF ${subImages.length}</span>
            </div>
          </div>
        `);
      }
    }
  }

  // ==========================================
  // 5. VIDEO ROSTER & STORYBOARDS
  // ==========================================
  if (activeSections.includes('videos')) {
    const videos = character.videos || [];
    pages.push(`
      <div class="booklet-page">
        <div class="header-line">${customHeader}</div>
        <div class="content-body">
          <h2>Video Production, Cinematics & Pilot Episodes (${videos.length} items)</h2>
          <p style="font-size: 8.5pt; opacity: 0.8; margin-bottom: 12px;">Animated pilots, series episodes, 3D turntables, game trailers, and storyboard sequences.</p>

          ${videos.length > 0 ? `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              ${videos.map((vid, vidIdx) => {
                const poster = vid.thumbnailSrc || vid.coverArtSrc || portraitUrl;
                const isPilot = vid.isPilot || vid.category?.toLowerCase().includes('pilot');
                const epLabel = vid.seasonNo || vid.episodeNo ? `${vid.seasonNo || ''} ${vid.episodeNo ? '• ' + vid.episodeNo : ''}`.trim() : `Scene #${vidIdx + 1}`;
                return `
                <div class="card" style="padding: 10px; display: flex; flex-direction: column; gap: 6px;">
                  <div style="width: 100%; height: 1.6in; background: #0f172a; border-radius: 6px; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center;">
                    ${poster ? `
                      <img src="${poster}" style="width: 100%; height: 100%; object-fit: cover;" />
                    ` : `
                      <div style="color: #94a3b8; font-size: 8pt; font-style: italic;">[Video Production File]</div>
                    `}
                    <div style="position: absolute; top: 6px; left: 6px; display: flex; gap: 4px;">
                      ${isPilot ? `<span style="background: #dc2626; color: #fff; font-size: 6.5pt; padding: 2px 6px; border-radius: 3px; font-weight: bold; text-transform: uppercase;">PILOT</span>` : ''}
                      ${vid.category ? `<span style="background: rgba(0,0,0,0.75); color: #fff; font-size: 6.5pt; padding: 2px 6px; border-radius: 3px; font-weight: bold;">${vid.category}</span>` : ''}
                    </div>
                    <div style="position: absolute; bottom: 6px; right: 6px; background: rgba(0,0,0,0.85); color: #38bdf8; font-size: 7pt; padding: 2px 6px; border-radius: 3px; font-weight: bold; font-family: monospace;">
                      ${vid.duration || epLabel}
                    </div>
                  </div>
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 4px;">
                      <strong style="font-size: 9pt; line-height: 1.2;">${vid.title || `Video Scene #${vidIdx + 1}`}</strong>
                      ${vid.episodeTitle ? `<span style="font-size: 7.5pt; opacity: 0.8; font-style: italic; white-space: nowrap;">"${vid.episodeTitle}"</span>` : ''}
                    </div>
                    <p style="font-size: 7.5pt; margin: 3px 0 0 0; opacity: 0.85; line-height: 1.3;">${vid.description || 'Production animation sequence and cinematic cut'}</p>
                  </div>
                </div>
              `;
              }).join('')}
            </div>
          ` : `
            <div class="card" style="text-align: center; padding: 25px;">
              <p style="font-style: italic; opacity: 0.7;">No video production files registered for this character.</p>
            </div>
          `}
        </div>
        <div class="footer-line">
          <span>${customFooter.replace('{page}', String(pages.length + 1)).replace('{total}', '%%TOTAL%%')}</span>
          <span>VIDEO & CINEMATICS</span>
        </div>
      </div>
    `);
  }

  // ==========================================
  // 6. AUDIO & MUSIC DISCOGRAPHY
  // ==========================================
  if (activeSections.includes('audio')) {
    const audios = character.audios || [];
    pages.push(`
      <div class="booklet-page">
        <div class="header-line">${customHeader}</div>
        <div class="content-body">
          <h2>Audio Tracks, Themes & Album Discography (${audios.length} tracks)</h2>
          <p style="font-size: 8.5pt; opacity: 0.8; margin-bottom: 12px;">Musical themes, character leitmotifs, official soundtrack releases, and sound effects ledger.</p>

          ${audios.length > 0 ? `
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${audios.map((aud, aIdx) => {
                const cover = aud.albumCover || aud.thumbnailSrc || aud.metadata?.albumCover || portraitUrl;
                const albumName = aud.albumTitle || aud.metadata?.album || 'Official Character Soundtrack';
                const artistName = aud.artist || aud.metadata?.artist || charCreator;
                const trackNum = aud.trackNo || aud.metadata?.trackNo || String(aIdx + 1).padStart(2, '0');
                return `
                <div class="card" style="padding: 10px; display: flex; gap: 12px; align-items: center;">
                  <div style="width: 58px; height: 58px; min-width: 58px; background: #1e293b; border-radius: 6px; overflow: hidden; position: relative; border: 1px solid rgba(0,0,0,0.15); box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    ${cover ? `
                      <img src="${cover}" style="width: 100%; height: 100%; object-fit: cover;" />
                    ` : `
                      <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 14pt;">🎵</div>
                    `}
                    <div style="position: absolute; bottom: 2px; right: 2px; background: rgba(0,0,0,0.8); color: #fff; font-size: 6pt; padding: 1px 3px; border-radius: 2px; font-weight: bold;">
                      #${trackNum}
                    </div>
                  </div>
                  <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 8px;">
                      <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
                        <strong style="font-size: 9pt; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${aud.title || `Audio Track #${aIdx + 1}`}</strong>
                        ${aud.category ? `<span class="badge" style="font-size: 6.5pt; padding: 1px 6px;">${aud.category}</span>` : ''}
                      </div>
                      ${aud.duration ? `<span style="font-size: 8pt; font-weight: bold; font-family: monospace; opacity: 0.85;">${aud.duration}</span>` : ''}
                    </div>
                    <p style="font-size: 7.5pt; margin: 2px 0 0 0; color: #64748b; font-weight: 500;">
                      Album: <strong>${albumName}</strong> • Artist: <em>${artistName}</em>
                    </p>
                    <p style="font-size: 7.5pt; margin: 3px 0 0 0; opacity: 0.85; line-height: 1.3;">${aud.description || 'Character theme and acoustic profile'}</p>
                  </div>
                </div>
              `;
              }).join('')}
            </div>
          ` : `
            <div class="card" style="text-align: center; padding: 25px;">
              <p style="font-style: italic; opacity: 0.7;">No audio tracks or voice lines attached.</p>
            </div>
          `}
        </div>
        <div class="footer-line">
          <span>${customFooter.replace('{page}', String(pages.length + 1)).replace('{total}', '%%TOTAL%%')}</span>
          <span>AUDIO DISCOGRAPHY</span>
        </div>
      </div>
    `);
  }

  // ==========================================
  // 7. SOURCE CODE & SCRIPTS WORKBENCH
  // ==========================================
  if (activeSections.includes('code')) {
    const codeFiles = character.codeFiles || [];
    pages.push(`
      <div class="booklet-page">
        <div class="header-line">${customHeader}</div>
        <div class="content-body">
          <h2>Source Code & Application Scripts (${codeFiles.length} files)</h2>
          <p style="font-size: 8.5pt; opacity: 0.8; margin-bottom: 12px;">Game logic, procedural shaders, web components, and AI automation utilities.</p>

          ${codeFiles.length > 0 ? `
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${codeFiles.slice(0, 3).map((cf) => `
                <div class="card" style="padding: 10px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 4px; margin-bottom: 6px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <span class="badge">${cf.language.toUpperCase()}</span>
                      <strong style="font-size: 8.5pt; font-family: monospace;">${cf.name}</strong>
                    </div>
                    <span style="font-size: 7.5pt; opacity: 0.7;">${cf.description || ''}</span>
                  </div>
                  <pre style="font-family: 'Courier New', Courier, monospace; font-size: 7pt; line-height: 1.35; background: #0f172a; color: #f8fafc; padding: 8px; border-radius: 4px; overflow: hidden; max-height: 1.8in; margin: 0; white-space: pre-wrap;">
${(cf.content || '// Empty script content').split('\n').slice(0, 15).map((line, lIdx) => `${String(lIdx + 1).padStart(2, ' ')} | ${line}`).join('\n')}
                  </pre>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="card" style="text-align: center; padding: 25px;">
              <p style="font-style: italic; opacity: 0.7;">No source code scripts or application modules cataloged.</p>
            </div>
          `}
        </div>
        <div class="footer-line">
          <span>${customFooter.replace('{page}', String(pages.length + 1)).replace('{total}', '%%TOTAL%%')}</span>
          <span>SOURCE CODE & APPS</span>
        </div>
      </div>
    `);
  }

  // ==========================================
  // 8. PROJECTS & STORYBOARD MATRICES
  // ==========================================
  if (activeSections.includes('projects')) {
    const projects = character.projects || [];
    pages.push(`
      <div class="booklet-page">
        <div class="header-line">${customHeader}</div>
        <div class="content-body">
          <h2>Production Projects, Video Games & Series (${projects.length} works)</h2>
          <p style="font-size: 8.5pt; opacity: 0.8; margin-bottom: 12px;">Active video games, mobile apps, animated series, comics, and commercial appearances.</p>

          ${projects.length > 0 ? `
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${projects.map(p => {
                const cover = p.coverArtSrc || (p.tables?.[0]?.rows?.[0]?.[0]?.isImage ? p.tables[0].rows[0][0].content : null);
                return `
                <div class="card" style="padding: 12px;">
                  <div style="display: flex; gap: 12px; align-items: flex-start;">
                    ${cover ? `
                      <div style="width: 80px; height: 95px; min-width: 80px; border-radius: 6px; overflow: hidden; border: 1px solid rgba(0,0,0,0.15); box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                        <img src="${cover}" style="width: 100%; height: 100%; object-fit: cover;" />
                      </div>
                    ` : ''}
                    <div style="flex: 1; min-width: 0;">
                      <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                          <strong style="font-size: 10pt;">${p.projectName}</strong>
                          ${p.category ? `<span class="badge" style="font-size: 7pt; background: #e0f2fe; color: #0369a1;">${p.category}</span>` : ''}
                        </div>
                        <span class="badge">${p.status}</span>
                      </div>
                      <div style="display: flex; gap: 12px; font-size: 7.5pt; opacity: 0.85; margin: 3px 0;">
                        <span>Role: <strong>${p.roleOrRelation}</strong></span>
                        ${p.platform ? `<span>Platform: <strong>${p.platform}</strong></span>` : ''}
                        ${p.releaseYear ? `<span>Year: <strong>${p.releaseYear}</strong></span>` : ''}
                        ${p.season ? `<span>Season: <strong>${p.season}</strong></span>` : ''}
                      </div>
                      ${p.relatedEntities ? `<p style="font-size: 7.5pt; opacity: 0.8; margin: 2px 0;">Connected Roster: <em>${p.relatedEntities}</em></p>` : ''}
                      ${p.description ? `<p style="font-size: 8pt; opacity: 0.9; margin-top: 4px; line-height: 1.4;">${p.description}</p>` : ''}
                    </div>
                  </div>

                  ${p.tables && p.tables.length > 0 ? `
                    <div style="margin-top: 10px; border-top: 1px dashed rgba(0,0,0,0.12); padding-top: 8px;">
                      <span style="font-size: 7.5pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Level / Storyboard Flow: ${p.tables[0].title}</span>
                      <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt; margin-top: 4px;">
                        <tr style="background: rgba(0,0,0,0.05); font-weight: bold;">
                          ${p.tables[0].columns.map(c => `<th style="border: 1px solid rgba(0,0,0,0.1); padding: 4px;">${c}</th>`).join('')}
                        </tr>
                        ${p.tables[0].rows.slice(0, 4).map(r => `
                          <tr>
                            ${r.map(cell => `
                              <td style="border: 1px solid rgba(0,0,0,0.1); padding: 4px;">
                                ${cell.isImage && cell.content ? `<img src="${cell.content}" style="max-height: 35px; border-radius: 2px;" />` : cell.content}
                              </td>
                            `).join('')}
                          </tr>
                        `).join('')}
                      </table>
                    </div>
                  ` : ''}
                </div>
              `;
              }).join('')}
            </div>
          ` : `
            <div class="card" style="text-align: center; padding: 25px;">
              <p style="font-style: italic; opacity: 0.7;">No project relations or storyboard matrices recorded.</p>
            </div>
          `}
        </div>
        <div class="footer-line">
          <span>${customFooter.replace('{page}', String(pages.length + 1)).replace('{total}', '%%TOTAL%%')}</span>
          <span>PROJECTS & GAMES</span>
        </div>
      </div>
    `);
  }

  // ==========================================
  // 9. RELATIONSHIPS & CONNECTED ENTITIES
  // ==========================================
  if (activeSections.includes('relations')) {
    const rels = character.relationships || [];
    pages.push(`
      <div class="booklet-page">
        <div class="header-line">${customHeader}</div>
        <div class="content-body">
          <h2>Connected Entities & Relationship Graph (${rels.length} links)</h2>
          <p style="font-size: 8.5pt; opacity: 0.8; margin-bottom: 12px;">Allies, rivals, mentors, equipment connections, and organizational affiliations.</p>

          ${rels.length > 0 ? `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              ${rels.map(r => `
                <div class="card" style="padding: 10px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong style="font-size: 9pt;">${r.targetName}</strong>
                    <span class="badge">${r.relationshipType}</span>
                  </div>
                  <p style="font-size: 8pt; opacity: 0.85; margin: 4px 0 0 0; line-height: 1.4;">${r.notes || 'Associated entity in universe'}</p>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="card" style="text-align: center; padding: 25px;">
              <p style="font-style: italic; opacity: 0.7;">No relationship networks or entity bonds cataloged.</p>
            </div>
          `}
        </div>
        <div class="footer-line">
          <span>${customFooter.replace('{page}', String(pages.length + 1)).replace('{total}', '%%TOTAL%%')}</span>
          <span>RELATIONSHIP MATRIX</span>
        </div>
      </div>
    `);
  }

  // ==========================================
  // 10. TECHNICAL SPECIFICATIONS & SOURCING
  // ==========================================
  if (activeSections.includes('specs')) {
    const attributes = character.attributes || {};
    pages.push(`
      <div class="booklet-page">
        <div class="header-line">${customHeader}</div>
        <div class="content-body">
          <h2>Technical Specifications & Sourcing Ledger</h2>
          <p style="font-size: 8.5pt; opacity: 0.8; margin-bottom: 15px;">System-derived metadata, creation timestamps, and fine-grained parameter mappings.</p>

          <div class="card" style="margin-bottom: 15px;">
            <h3>Creation & Sourcing Suffixes</h3>
            <table style="width: 100%; font-size: 8.5pt; border-collapse: collapse; line-height: 1.9;">
              <tr style="border-bottom: 1px solid rgba(0,0,0,0.1);"><td style="font-weight: bold; width: 40%;">Entity Classification</td><td>${character.entityType || 'Character / Creative Concept'}</td></tr>
              <tr style="border-bottom: 1px solid rgba(0,0,0,0.1);"><td style="font-weight: bold;">Date Created</td><td>${charCreated}</td></tr>
              <tr style="border-bottom: 1px solid rgba(0,0,0,0.1);"><td style="font-weight: bold;">Date Sourced / Uploaded</td><td>${charUploaded}</td></tr>
              <tr style="border-bottom: 1px solid rgba(0,0,0,0.1);"><td style="font-weight: bold;">Sourcing Method</td><td>${character.dateCreatedSource || 'Added Manually'}</td></tr>
              <tr style="border-bottom: 1px solid rgba(0,0,0,0.1);"><td style="font-weight: bold;">Lead Creator / Author</td><td>${charCreator}</td></tr>
              <tr style="border-bottom: 1px solid rgba(0,0,0,0.1);"><td style="font-weight: bold;">Database Archive ID</td><td><code>${character.id || 'N/A'}</code></td></tr>
            </table>
          </div>

          <div class="card">
            <h3>Full Custom Attributes Ledger</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 8.5pt;">
              ${Object.entries(attributes).map(([k, v]) => `
                <div style="border-bottom: 1px solid rgba(0,0,0,0.06); padding: 4px 0;">
                  <span style="opacity: 0.7;">${k}:</span> <strong>${v}</strong>
                </div>
              `).join('')}
              ${Object.keys(attributes).length === 0 ? '<p style="font-style: italic; opacity: 0.7;">No custom attribute pairs registered.</p>' : ''}
            </div>
          </div>
        </div>
        <div class="footer-line">
          <span>${customFooter.replace('{page}', String(pages.length + 1)).replace('{total}', '%%TOTAL%%')}</span>
          <span>TECHNICAL SPECIFICATIONS</span>
        </div>
      </div>
    `);
  }

  // ==========================================
  // 11. DEVELOPMENT TRACKER & CREDITS
  // ==========================================
  if (activeSections.includes('dev-logs')) {
    const logs = character.devTracker?.logs || [];
    const credits = character.devTracker?.credits || [];
    pages.push(`
      <div class="booklet-page">
        <div class="header-line">${customHeader}</div>
        <div class="content-body">
          <h2>Development Tracker & Creative Credits Roster</h2>
          <p style="font-size: 8.5pt; opacity: 0.8; margin-bottom: 15px;">Logged creation hours, milestone checkpoints, and team contributor assignments.</p>

          <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 15px;">
            <div class="card">
              <h3>Milestone Production Logs (${logs.length} sessions)</h3>
              <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 8px; max-height: 4in; overflow: hidden;">
                ${logs.slice(0, 6).map(l => `
                  <div style="border-bottom: 1px solid rgba(0,0,0,0.08); padding-bottom: 4px;">
                    <div style="display: flex; justify-content: space-between; font-size: 8pt; font-weight: bold;">
                      <span>${l.milestone || 'Work Session'}</span>
                      <span>${l.date} (${l.hoursSpent} hrs)</span>
                    </div>
                    <p style="font-size: 7.5pt; margin: 2px 0 0 0; opacity: 0.8;">${l.description}</p>
                  </div>
                `).join('')}
                ${logs.length === 0 ? '<p style="font-style: italic; opacity: 0.7; font-size: 8.5pt;">No work logs logged yet.</p>' : ''}
              </div>
            </div>

            <div class="card">
              <h3>Creative Credits Roster</h3>
              <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 8px;">
                ${credits.map(c => `
                  <div style="border-bottom: 1px solid rgba(0,0,0,0.08); padding-bottom: 4px;">
                    <p style="font-size: 8.5pt; font-weight: bold; margin: 0;">${c.name}</p>
                    <p style="font-size: 7.5pt; opacity: 0.7; margin: 0;">${c.role}</p>
                  </div>
                `).join('')}
                ${credits.length === 0 ? `
                  <div style="font-size: 8.5pt;">
                    <p style="font-weight: bold; margin: 0;">${charCreator}</p>
                    <p style="font-size: 7.5pt; opacity: 0.7; margin: 0;">Lead Creator & Writer</p>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
        <div class="footer-line">
          <span>${customFooter.replace('{page}', String(pages.length + 1)).replace('{total}', '%%TOTAL%%')}</span>
          <span>DEV TRACKER & CREDITS</span>
        </div>
      </div>
    `);
  }

  // ==========================================
  // 12. BACK COVER & MASTER INDEX
  // ==========================================
  if (activeSections.includes('back')) {
    pages.push(`
      <div class="booklet-page">
        <div class="header-line">${customHeader}</div>
        <div class="content-body" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
          <div>
            <h2>Master Archive Colophon & Index</h2>
            <p style="font-size: 8.5pt; opacity: 0.8; margin-bottom: 20px;">Comprehensive register summary for <strong>${charName}</strong>.</p>
            
            <div class="card" style="padding: 15px; margin-bottom: 20px;">
              <h3>Compiled Document Contents</h3>
              <ul style="font-size: 8.5pt; line-height: 1.8; margin: 8px 0; padding-left: 20px;">
                ${activeSections.map(sId => {
                  const s = ALL_BIBLE_SECTIONS.find(item => item.id === sId);
                  return s ? `<li><strong>${s.title}:</strong> ${s.desc}</li>` : '';
                }).join('')}
              </ul>
            </div>
          </div>

          <div style="text-align: center; border-top: 2px solid rgba(0,0,0,0.15); padding-top: 25px; margin-bottom: 20px;">
            <p style="font-size: 11pt; font-weight: bold; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 6px;">End of Master Publication</p>
            <p style="font-size: 8pt; opacity: 0.6; margin: 0;">Compiled & Printed from ComicManStudios Character Workspace</p>
            <p style="font-size: 7.5pt; opacity: 0.5; margin-top: 4px;">System ID: ${character.id} • Certified Authentic Production Dossier</p>
          </div>
        </div>
        <div class="footer-line">
          <span>${customFooter.replace('{page}', String(pages.length + 1)).replace('{total}', '%%TOTAL%%')}</span>
          <span>BACK COVER • COLOPHON</span>
        </div>
      </div>
    `);
  }

  const totalPages = pages.length;
  // Replace %%TOTAL%% macro across all pages
  const compiledPagesHtml = pages.map(p => p.replace(/%%TOTAL%%/g, String(totalPages))).join('\n');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${charName} - Production Bible & Master Dossier</title>
        <style>
          @page {
            size: ${pageDimension};
            margin: 0.4in;
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 0;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          ${themeStyles}
          .booklet-page {
            page-break-after: always;
            break-after: page;
            height: 100vh;
            min-height: 9.8in;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-sizing: border-box;
            padding: 10px;
          }
          .header-line {
            border-bottom: 1px solid rgba(0,0,0,0.15);
            padding-bottom: 6px;
            margin-bottom: 15px;
            font-size: 7.5pt;
            text-transform: uppercase;
            font-weight: bold;
            letter-spacing: 1.5px;
            opacity: 0.7;
          }
          .footer-line {
            border-top: 1px solid rgba(0,0,0,0.15);
            padding-top: 6px;
            margin-top: 15px;
            font-size: 7.5pt;
            display: flex;
            justify-content: space-between;
            opacity: 0.7;
          }
          .content-body {
            flex: 1;
          }
          img {
            max-width: 100%;
            display: block;
          }
        </style>
      </head>
      <body>
        ${compiledPagesHtml}
      </body>
    </html>
  `;
}

export function printBibleDocument(
  param1: BiblePrintOptions | Character, 
  param2?: Partial<BiblePrintOptions>
): void {
  let opts: BiblePrintOptions;
  if (param1 && 'id' in param1 && typeof (param1 as any).id === 'string' && param2) {
    opts = { ...param2, character: param1 as Character };
  } else if (param1 && 'character' in (param1 as any)) {
    opts = param1 as BiblePrintOptions;
  } else if (param2 && param2.character) {
    opts = param2 as BiblePrintOptions;
  } else {
    opts = { ...(param2 || {}), character: param1 as any };
  }
  const html = generateBibleHtml(opts);
  executePrintDocument(html);
}
