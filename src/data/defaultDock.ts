import { Character, ArchiveItem } from '../types';

export const DOCK_DEFAULT_ITEM: ArchiveItem = {
  id: 'item_dock_model_sheet_001',
  type: 'image',
  content: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
  thumbnailContent: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
  originalName: 'Dock_ModelSheet_MS_v5.0.png',
  hash: 'hash_dock_ms_v5',
  description: 'Master turnaround character model sheet MS v5.0 for Dock & Duke (Armentero Studios). Features front view, back view, helmet on/off, and golden retriever studies.',
  isSketch: false,
  charactersCount: 1,
  fileDate: new Date('2024-11-29').getTime(),
  artStyle: 'Digital Character Sheet / Anime Concept Art',
  medium: 'Digital Pen & Ink',
  rating: 5,
  fileSize: 4250000,
  createdAt: new Date('2024-11-29').getTime(),
  isFavorite: true
};

export const DOCK_DEFAULT_CHARACTER: Character = {
  id: 'char_dock_master_001',
  name: 'Dock',
  gender: 'Male',
  species: 'Human',
  description: "Dock — one name, no other. He is the King's Loyal Guard, protagonist of the series that carries his name, and the man the kingdom trusts with the one errand no one else could be trusted with: saving the King's dog.",
  tagline: "The King's Loyal Guard • Created by Alberto Armentero (Armentero Studios)",
  profileLayout: 'classic',
  bannerAlignment: 'center',
  bannerFit: 'cover',
  iconAlignment: 'center',
  iconFit: 'cover',
  iconScale: 1,
  iconShape: 'rounded',
  showIndicators: false,
  status: 'Sorted',
  sourceId: 'item_dock_model_sheet_001',
  sourceType: 'image',
  entityType: 'Character',
  age: '28',
  role: "King's Loyal Guard / Protagonist",
  history: `Dock is one of Armentero Studios' longest-lived creations. He was born in a September 21, 2016 paper sketch (hand-labeled "Dock"), explored further in helmet expression variants (9/23/16) and facial feature studies (9/28/16), revived in a September 23, 2023 redraw — which inset the original sketch in the corner, establishing the studio's Ref-Inset Rule — and finalized in the November 29, 2024 model sheets (MS v5.0). His design DNA — the three-slit helmet with nose guard, long angular nose, and stern mouth — has been locked since 2016.`,
  personality: `Stoic, obedient, uncomplaining, and precise on the outside. Accepts any task with "Yes, sir. It will be done." Kneels when summoned, rises when dismissed. Inside, he possesses a rich, dry, honest monologue ("A dog... really?"). His pride is quiet but real; reflection becomes change as duty transforms into love.`,
  appearance: `Without helmet: shaggy black hair over a tanned, weathered, stern face; a long angular nose; chin with a few wispy sprouts of hair. Dark, tired, watchful eyes with a resting expression of quiet severity. With helmet: steel helm with three vertical slits and central nose guard. Grey tunic, brown leather chest piece, leather pauldrons, belt with pouch, brown travel-worn boots.`,
  abilities: `Strategic mind for traps, bait, terrain, and timing. Masters using an enemy's hot temper against it (knife-taunting dragons into traps). High foot endurance, sleep anywhere, eat anything. Expert swordsmanship and knife work.`,
  strengths: `Strategic intellect, total follow-through, absolute loyalty, quiet observation, swordsmanship and knife utility.`,
  weaknesses: `Bottles emotions until they leak as silence, undervalues morale and care initially, pride makes asking for help difficult.`,
  completionRating: '100% - Production Master Model Sheet',
  colorPalette: ['#2e3d52', '#8c98a6', '#6e4b3c', '#f5f0eb'],
  originalColorPalette: ['#2e3d52', '#8c98a6', '#6e4b3c', '#f5f0eb'],
  isFavorite: true,
  isUniqueName: true,
  highlightedImageSrc: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
  bannerImageSrc: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
  dateCreated: '2016-09-21',
  dateUploaded: '2024-11-29',
  creator: 'Alberto Armentero',
  firstPublication: 'Armentero Studios Character Bible v1.2',
  firstAppearance: 'Dock & Duke (Comic Concept)',
  firstAppearanceType: 'comic',
  categories: ['Male', 'Protagonist', 'Guard', 'Armentero Studios'],
  biblePages: [
    {
      id: 'page_dock_1',
      title: 'IDENTITY & ORIGIN TRAIL',
      content: `DOCK — CHARACTER BIBLE (BIOGRAPHIC ENTRY)
Armentero Studios • Created by Alberto Armentero • Doc CB-DOCK v1.2 • All facts current as of today's updates

IDENTITY:
Dock — one name, no other, exactly as it was first penciled onto a paper sketch on September 21, 2016. He is the King's Loyal Guard, the protagonist of the series that carries his name, and the man the kingdom trusts with the one errand no one else could be trusted with.

VITALS & SPECS:
- Age: 28 years old
- Height: 5'10" (178 cm)
- Build: Lean, wiry, high foot endurance
- Role: King's Loyal Guard / Protagonist
- Creator: Alberto Armentero (Armentero Studios)

ORIGIN TRAIL:
- September 21, 2016: First foundational pencil sketch hand-labeled 'Dock'.
- September 23, 2016: Helmet expression variants and profile studies.
- September 28, 2016: Facial feature study without helmet.
- September 23, 2023: Redraw establishing the studio's 'Ref-Inset Rule' (original 2016 sketch inset in the corner).
- November 29, 2024: Master Model Sheet MS v5.0 merged turnaround finalized.`
    },
    {
      id: 'page_dock_2',
      title: 'CODE OF HONOR & COMBAT DOCTRINE',
      content: `CODE OF HONOR:
1. The King's word is the mission, and the mission is the life.
2. Honor is doing the task no one else was trusted with.
3. Strength without thought is waste — wit is the gift from the heavens.
4. A guard complains to no one, least of all about a dog.
5. What is carried must be delivered; what is protected must return whole.

COMBAT & STRATEGY DOCTRINE:
- Never fight the size; fight the mind.
- Dragons and warlords are bigger and bolder; humans win by being smarter — poke, provoke, lure, trap.
- Master of knife-taunts and terrain traps.
- Gear: Standard steel sword, utility knife, travel pouch with rare medicinal herbs, brown leather pauldrons, grey tunic, and the iconic three-slit steel helm.`
    },
    {
      id: 'page_dock_3',
      title: 'THE DEFINING MISSION & CHARACTER ARC',
      content: `THE DEFINING MISSION:
Kneeling before the throne: escort the kingdom's beloved, dying retriever (Eros / Duke) to the rare herb that grows only in the high caves of sleeping dragons.
Travel on foot — no horse, because the sick retriever must be carried or walked gently. Bare-minimum supplies.

THE ARC:
Indifference → Duty → Reluctant care → Devotion.
The guard who knelt thinking "A dog... really?" becomes the man who would die for that dog. Duty transforms into quiet love.`
    }
  ],
  devTracker: {
    startDate: '2016-09-21',
    targetDeadline: 'Production Ready',
    credits: [
      { role: 'Creator & Writer', name: 'Alberto Armentero' },
      { role: 'Production House', name: 'Armentero Studios' }
    ],
    logs: [
      { id: 'log_d1', date: '2016-09-21', hoursSpent: 4, description: 'First foundational pencil sketch hand-labeled Dock.' },
      { id: 'log_d2', date: '2016-09-23', hoursSpent: 6, description: 'Helmet expression variants and facial studies completed.' },
      { id: 'log_d3', date: '2023-09-23', hoursSpent: 8, description: 'Redraw establishing the studio Ref-Inset Rule.' },
      { id: 'log_d4', date: '2024-11-29', hoursSpent: 12, description: 'Merged Master Model Sheet MS v5.0 finalized.' }
    ]
  },
  subImages: [
    {
      id: 'sub_dock_1',
      src: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
      title: 'Model Sheet 11/29/24 - Dock & Duke',
      description: 'Official master turnaround sheet MS v5.0 showing front, back, helmet variations, and Duke the golden retriever.'
    },
    {
      id: 'sub_dock_2',
      src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      title: 'Unhelmed Facial Study (9/28/16)',
      description: 'Shaggy black hair, weathered stern face, long angular nose, and watchful dark eyes.'
    },
    {
      id: 'sub_dock_3',
      src: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=800&q=80',
      title: 'Steel Helmet Portrait (3-Slit Visor)',
      description: 'Steel helm with three vertical slits and central nose guard.'
    },
    {
      id: 'sub_dock_4',
      src: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
      title: 'Original Pencil Sketch (9/21/16)',
      description: 'The foundational first pencil sketch hand-labeled Dock.'
    }
  ],
  audios: [
    {
      id: 'audio_dock_1',
      src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      title: "Voice Line - 'A dog... really?'",
      description: `[Vocal Script / Monologue]\n"A dog... really? Kneeling at the throne, I expected dragons or rebellious warlords... but a sick retriever?\n\n[Aloud]\nYes, sir. It will be done. I will fulfill my mission."`,
      category: 'Voice Lines'
    },
    {
      id: 'audio_dock_2',
      src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      title: 'Rainy Journey & Village Chants',
      description: 'Atmospheric theme music playing during Dock and Duke\'s foot travel through the stormy kingdom.',
      category: 'Soundtrack'
    }
  ],
  videos: [
    {
      id: 'video_dock_1',
      src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      title: 'Dock Removing Helmet in the Rain',
      description: 'File: dock_rain_unhelm.mp4 | Specs: 1080p H.264, Duration: 0:15 | Cinematic scene of Dock taking off his three-slit helmet in the pouring rain with Duke by his side.',
      category: 'Cinematics'
    }
  ],
  projects: [
    {
      id: 'proj_dock_ep1',
      projectName: "Dock: The King's Loyal Guard (Chapter 1)",
      roleOrRelation: 'Protagonist / Lead Arc',
      status: 'Official',
      description: 'The defining introductory chapter detailing the mission assignment at the royal castle and the beginning of the journey with Duke.'
    }
  ],
  relationships: [
    {
      id: 'rel_king',
      targetName: 'The King',
      relationshipType: 'Absolute Sovereign',
      notes: 'Absolute loyalty; the only man Dock kneels to. Entrusted Dock with his dying dog Eros.',
      iconUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
    },
    {
      id: 'rel_eros',
      targetName: 'Eros (Duke)',
      relationshipType: 'Companion Retriever',
      notes: 'The King\'s white retriever with the brown collar. Started as a burden, became Dock\'s reason to fight.',
      iconUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=200&q=80'
    }
  ]
};

export const ARTIE_DEFAULT_ITEM: ArchiveItem = {
  id: 'item_artie_concept_sheet_001',
  type: 'image',
  content: '/src/assets/images/wooden_dummy_1786259892970.jpg',
  thumbnailContent: '/src/assets/images/wooden_dummy_1786259892970.jpg',
  originalName: 'Artie_Mascot_Turnaround_v1.0.png',
  hash: 'hash_artie_mascot_v1',
  description: 'Concept sheet and digital paint of Artie, the official studio mannequin mascot with signature googly eyes and joint pegs.',
  isSketch: false,
  charactersCount: 1,
  fileDate: new Date('2026-08-09').getTime(),
  artStyle: 'Playful 3D Cartoon / Digital Paint',
  medium: 'Digital Paint & Charcoal Wash',
  rating: 5,
  fileSize: 1840000,
  createdAt: new Date('2026-08-09').getTime(),
  isFavorite: true
};

export const ARTIE_DEFAULT_CHARACTER: Character = {
  id: 'char_artie_master_001',
  name: 'Artie',
  gender: 'Others',
  species: 'Jointed Wooden Art Mannequin',
  description: "Artie is a lovable, quirky wooden artist mannequin brought to life. He is covered in pencil smudges, has mismatched oversized googly eyes that wobble wildly when he runs, and possesses an uncontrollable urge to strike dramatic poses for creators.",
  tagline: "The Studio Mascot • Posable Partner in Creative Crimes",
  profileLayout: 'side',
  bannerAlignment: 'center',
  bannerFit: 'cover',
  iconAlignment: 'center',
  iconFit: 'contain',
  iconScale: 1.15,
  iconShape: 'circle',
  showIndicators: false,
  status: 'Sorted',
  sourceId: 'item_artie_concept_sheet_001',
  sourceType: 'image',
  entityType: 'Character',
  age: 'Timeless Creation (Animated August 2026)',
  role: "Lead Studio Mascot & Posable Assistant",
  worldName: 'Armentero Studio Universe',
  affiliation: 'Armentero Creative Guild & Animation Wing',
  placeOfOrigin: 'Studio Desk #4, Lindenwood Woodshop',
  alignment: 'Chaotic Good / Creative Muse',
  occupation: 'Studio Drawing Dummy & Animation Mascot',
  history: `Artie was built in Armentero Studios as a standard jointed wooden drawing dummy. However, during a late-night session, an artist dropped a jar of magical charcoal dust onto his joints while gluing two oversized plastic googly eyes onto his smooth wooden face. Artie immediately sat up, did a dramatic backflip, and started sketching a self-portrait on the studio floor. He has been the resident mascot ever since.`,
  personality: `Curious, expressive, dramatic, and mute but highly communicative. He speaks through over-exaggerated poses, sign language, and squeaks. He gets extremely excited when someone starts drawing, and will do anything to assist, even if it means holding heavy sketchbooks with his tiny wooden hands.`,
  appearance: `A beautifully polished pinewood mannequin with ball-and-socket joints made of light-brass hardware. His face is completely featureless except for two hilarious, asymmetrical, plastic googly eyes that wobble. He is stained with grey graphite smudges on his hands and feet, and wears a miniature light blue-gray knitted scarf given to him by the chief animator.`,
  abilities: `Perfect Posability: Can bend and hold any anatomical pose indefinitely without cramping. Graphite Scribing: Can secrete soft HB graphite from his wooden fingertips to draw on any surface. High Agility: Lightweight and bouncy, allowing him to jump several feet in the air.`,
  strengths: `Unlimited patience, incredible flexibility, humorous expressions, and infectious creative enthusiasm.`,
  weaknesses: `Cannot speak out loud, fragile joints (sometimes an arm pops off and needs to be popped back in), terrified of wood borers and pencil sharpeners.`,
  completionRating: '100% - Fully Rigged 3D Mascot Concept',
  colorPalette: ['#d7a15c', '#efe0cd', '#4a4031', '#5a8fa8', '#b45309', '#fef3c7', '#334155'],
  originalColorPalette: ['#d7a15c', '#efe0cd', '#4a4031', '#5a8fa8', '#b45309', '#fef3c7', '#334155'],
  isFavorite: true,
  isUniqueName: true,
  highlightedImageSrc: '/src/assets/images/wooden_dummy_1786259892970.jpg',
  bannerImageSrc: '/src/assets/images/wooden_banner_1786259913109.jpg',
  defaultThumbnailSrc: '/src/assets/images/wooden_dummy_1786259892970.jpg',
  dateCreated: '2026-08-08',
  dateUploaded: '2026-08-09',
  creator: 'Alberto Armentero & Mascot Team',
  firstPublication: 'Studio Sketchbook #42',
  firstAppearance: 'Armentero Mascot Concept Art',
  firstAppearanceType: 'animation',
  categories: ['Mascot', 'Neutral', 'Wooden', 'Art Tool', '3D Rigged', 'Playable Character'],
  attributes: {
    'Height': `1'4" (40 cm)`,
    'Weight': '4.2 lbs (1.9 kg)',
    'Material': 'Polished Lindenwood & Brass Pin Screws',
    'Eye Spec': 'Asymmetrical Wobble Googly Eyes (20mm / 15mm)',
    'Joint Count': '14 Precision Ball-and-Socket Joints',
    'Signature Tool': 'Giant Yellow HB Graphite Scribing Pencil',
    'Movement Speed': 'High Agility / 45 mph Sprint on Studio Desks',
    'Audio Frequency': '440 Hz (Resonant Lindenwood Click)',
    'Rigging Complexity': '38 Deform Bones + Spring Physics IK'
  },
  biblePages: [
    {
      id: 'page_artie_1',
      title: 'ANATOMY & ARTICULATION CODEX',
      content: `THE ANATOMY OF AN ART MODEL
Artie's body consists of hand-carved lindenwood segments.
- Joints: Threaded brass screws with spring-tension washers inside. This allows him to hold intense postures.
- Weight balance: His heavy-metal baseplate is removable, allowing him to jump freely but stand solid when sketching.
- Googly Eyes: Sourced from a discount craft box. Left eye is 20mm, right eye is 15mm. This asymmetry enhances his chaotic, lovable charm.`
    },
    {
      id: 'page_artie_2',
      title: 'THE LANGUAGE OF SILHOUETTE & POSING',
      content: `MUTE DRAMATURGY
Since Artie has no mouth or vocal cords, he communicates entirely through physical silhouette:
1. "The Eureka Pose": Standing on one leg, arms pointed to the sky, googly eyes rattling.
2. "The Critic Pose": Arms folded, head tilted 45 degrees, one leg tapped forward, shaking head disapprovingly at a messy sketch.
3. "The Exhausted Artist": Drooping joints, arms dragging on floor, head completely bent down. Perfect for 3 AM drawing sessions.`
    },
    {
      id: 'page_artie_3',
      title: 'STUDIO ORIGIN: THE CHARCOAL DUST INCIDENT',
      content: `THE ENCHANTED SKETCHBOOK REVELATION
Late one Tuesday night, an experimental vial of carboniferous enchanted charcoal tipped over the animation table. Upon absorbing the particulate dust into his porous wood grains, Artie's joints snapped to life with a satisfying wooden click. Rather than causing mischief, his first instinct was to grab a brush and help complete in-between frames for the upcoming animation pilot.`
    },
    {
      id: 'page_artie_4',
      title: 'EQUIPMENT & CREATIVE WEAPONRY',
      content: `TOOLS OF THE DUMMY
- The 2B Lance: A 3-foot long sharpened yellow drafting pencil used as both a walking staff and a rapid drafting tool.
- Kneaded Eraser Shield: A squishy malleable dough used to absorb impacts or shape into impromptu stairs.
- Brass Hex Wrench: Artie keeps a miniature 4mm wrench in his scarf pocket for self-tightening loose knee joints.`
    }
  ],
  devTracker: {
    startDate: '2026-08-08',
    targetDeadline: 'Completed - Master Production Asset',
    credits: [
      { role: 'Character Design & Concept', name: 'Armentero Studios Mascot Team' },
      { role: '3D Modeler & Texture Artist', name: 'Alberto Armentero' },
      { role: 'Rigging & Animation Lead', name: 'Studio Animation Wing' },
      { role: 'Sound Design & Foley', name: 'Foley Guild' }
    ],
    logs: [
      { id: 'log_a1', date: '2026-08-08', hoursSpent: 5, description: 'Idea generation, silhouette drafts, and googly-eyes rigging study.' },
      { id: 'log_a2', date: '2026-08-09', hoursSpent: 8, description: 'Created 3D concept render and applied procedural pinewood shader texture.' },
      { id: 'log_a3', date: '2026-08-10', hoursSpent: 6, description: 'Recorded squeaky joint foley sound effects and added orchestral theme track.' },
      { id: 'log_a4', date: '2026-08-11', hoursSpent: 12, description: 'Completed Episode 0 Animated Pilot and integrated video game storyboard tables.' }
    ]
  },
  subImages: [
    {
      id: 'sub_artie_1',
      src: '/src/assets/images/wooden_dummy_1786259892970.jpg',
      title: 'Master Mascot Pose',
      description: 'The definitive concept render of Artie displaying his signature googly eyes and smooth wooden joints.'
    },
    {
      id: 'sub_artie_2',
      src: '/src/assets/images/wooden_banner_1786259913109.jpg',
      title: 'Studio Banner & Pose Array',
      description: 'Dynamic composition of Artie striking heroic and comedic drafting stances across the workbench.'
    }
  ],
  audios: [
    {
      id: 'audio_artie_1',
      src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      title: "Artie's Wooden Waltz (Main Theme)",
      description: 'Lively orchestral theme featuring pizzicato strings, wooden marimbas, and playful woodwind melodies.',
      category: 'Soundtrack Theme',
      albumTitle: 'Armentero Studio Symphony Vol. 1',
      albumCover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
      artist: 'Armentero Studio Orchestra',
      trackNo: '01',
      duration: '2:45',
      metadata: {
        album: 'Armentero Studio Symphony Vol. 1',
        artist: 'Armentero Studio Orchestra',
        trackNo: '01',
        genre: 'Orchestral / Soundtrack',
        albumCover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
        year: '2026'
      }
    },
    {
      id: 'audio_artie_2',
      src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      title: 'Squeaky Joint Rhythm & Foley Tap',
      description: 'Authentic squeak-squeak wooden articulation sounds of Artie bounding across cedar workbenches.',
      category: 'Sound Effects',
      albumTitle: 'Studio Foley & Sound Library',
      albumCover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80',
      artist: 'Artie Foley Sessions',
      trackNo: '02',
      duration: '1:15',
      metadata: {
        album: 'Studio Foley & Sound Library',
        artist: 'Artie Foley Sessions',
        trackNo: '02',
        genre: 'Foley / Sound Effects',
        albumCover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80',
        year: '2026'
      }
    },
    {
      id: 'audio_artie_3',
      src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      title: 'Midnight Sketching Jazz Jam',
      description: 'Cozy lo-fi jazz beat inspired by late-night drafting and graphite sketching sessions.',
      category: 'Soundtrack Theme',
      albumTitle: 'Armentero Studio Symphony Vol. 1',
      albumCover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
      artist: 'Armentero Jazz Ensemble',
      trackNo: '03',
      duration: '3:20',
      metadata: {
        album: 'Armentero Studio Symphony Vol. 1',
        artist: 'Armentero Jazz Ensemble',
        trackNo: '03',
        genre: 'Lo-Fi Jazz',
        albumCover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
        year: '2026'
      }
    }
  ],
  videos: [
    {
      id: 'video_artie_pilot',
      src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      title: 'Artie: Origin of the Wooden Mascot (Pilot Episode)',
      description: 'The animated pilot showcasing the magical charcoal dust incident on Studio Desk #4.',
      category: 'Animated Pilot',
      seasonNo: 'Pilot Season',
      episodeNo: 'Ep 00',
      episodeTitle: 'The First Pose',
      isPilot: true,
      duration: '4:30',
      thumbnailSrc: '/src/assets/images/wooden_dummy_1786259892970.jpg',
      coverArtSrc: '/src/assets/images/wooden_banner_1786259913109.jpg'
    },
    {
      id: 'video_artie_ep1',
      src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      title: 'Episode 1: The Case of the Missing 2B Pencil',
      description: 'Artie embarks on an epic quest through the studio trash cans to retrieve an artist\'s lucky pencil.',
      category: 'Animated Series',
      seasonNo: 'Season 1',
      episodeNo: 'Ep 01',
      episodeTitle: 'The Missing 2B Pencil',
      duration: '11:20',
      thumbnailSrc: '/src/assets/images/wooden_dummy_1786259892970.jpg',
      coverArtSrc: '/src/assets/images/wooden_banner_1786259913109.jpg'
    },
    {
      id: 'video_artie_turntable',
      src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      title: '360° Posability & Rigging Turntable',
      description: 'Complete 3D mesh breakdown demonstrating the 14 articulation points and procedural wood shader.',
      category: 'Technical Showcase',
      duration: '1:45',
      thumbnailSrc: '/src/assets/images/wooden_dummy_1786259892970.jpg',
      coverArtSrc: '/src/assets/images/wooden_dummy_1786259892970.jpg'
    }
  ],
  projects: [
    {
      id: 'proj_artie_game',
      projectName: "Artie's Sketchbook Adventure",
      category: 'Video Game',
      platform: 'PC / Nintendo Switch / iOS',
      releaseYear: '2026',
      roleOrRelation: 'Title Protagonist & Playable Hero',
      status: 'In Progress',
      coverArtSrc: '/src/assets/images/wooden_banner_1786259913109.jpg',
      description: 'A 2.5D physics-platformer where Artie uses his graphite fingers and posable limbs to solve creative puzzle stages.',
      tables: [
        {
          id: 'table_game_act1',
          title: 'Act I: The Drafting Table Escape',
          columns: ['Scene / Level', 'Objective', 'Key Mechanic', 'Boss / Challenge'],
          rows: [
            [
              { id: 'c1', content: 'Stage 1-1: Inking Danger' },
              { id: 'c2', content: 'Navigate spilled Indian ink rivers' },
              { id: 'c3', content: 'Eraser bounce jump' },
              { id: 'c4', content: 'Tipping Inkwell' }
            ],
            [
              { id: 'c5', content: 'Stage 1-2: Ruler Bridge' },
              { id: 'c6', content: 'Balance across 30cm steel ruler' },
              { id: 'c7', content: 'Joint friction locking' },
              { id: 'c8', content: 'Drafting Fan Gusts' }
            ]
          ]
        }
      ]
    },
    {
      id: 'proj_artie_series',
      projectName: "The Armentero Studio Shorts",
      category: 'Animated Series',
      platform: 'Streaming & Web Shorts',
      season: 'Season 1 (12 Episodes)',
      releaseYear: '2026',
      roleOrRelation: 'Main Animated Star',
      status: 'Official',
      coverArtSrc: '/src/assets/images/wooden_dummy_1786259892970.jpg',
      description: 'Slapstick comedy series highlighting the secret late-night lives of studio tools and sketchpad drawings.'
    },
    {
      id: 'proj_artie_app',
      projectName: "Artie 3D Pose Studio",
      category: 'Mobile App',
      platform: 'iOS & Android',
      releaseYear: '2026',
      roleOrRelation: 'Interactive Posable Model Assistant',
      status: 'Published',
      coverArtSrc: '/src/assets/images/wooden_banner_1786259913109.jpg',
      description: 'Digital mannequin companion app enabling digital painters to pose Artie under custom virtual 3-point lighting.'
    }
  ],
  relationships: [
    {
      id: 'rel_dock_friend',
      targetName: 'Dock',
      relationshipType: 'Studio Colleague & Stoic Mentor',
      notes: 'Artie loves imitating Dock\'s stoic guard stance, often using his pencil as a wooden sword. Dock finds him mildly baffling but keeps a watchful eye out so Artie doesn\'t fall off the desk.',
      iconUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=200&q=80'
    },
    {
      id: 'rel_stan_friend',
      targetName: 'Stickman Stan',
      relationshipType: '2D & 3D Studio Pals',
      notes: 'Stan and Artie are great studio pals! They are both artist tools come to life. Stan often hides behind Artie\'s wooden legs to play hide-and-seek.',
      iconUrl: '/src/assets/images/stick_figure_stan_1786262675136.jpg'
    },
    {
      id: 'rel_armentero_creator',
      targetName: 'Alberto Armentero',
      relationshipType: 'Creator & Lead Animator',
      notes: 'The master animator who hand-glued Artie\'s googly eyes and carved his lindenwood joints.',
      iconUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80'
    }
  ],
  codeFiles: [
    {
      id: 'code_artie_1',
      name: 'ArtieJointRigging.ts',
      language: 'typescript',
      description: 'IK solver and joint constraint manager for Artie\'s 14 brass articulation nodes.',
      dateAdded: '2026-08-09',
      content: `// Artie Brass Joint Constraint Solver
export class MannequinRig {
  readonly jointCount = 14;
  readonly maxTension = 100;

  lockPose(jointId: number, angles: [number, number, number]): boolean {
    console.log(\`Joint \${jointId} locked at Euler: \${angles.join(',')}\`);
    return true;
  }
}`
    }
  ],
  genericFiles: [
    {
      id: 'file_artie_fbx',
      name: 'Artie_Rigged_Mannequin_v2.fbx',
      type: '3D FBX Mesh',
      size: '14.2 MB',
      url: '/src/assets/models/artie_rig.fbx',
      description: 'Master FBX 3D mesh with vertex groups, procedural pinewood UVs, and spring bone weights.'
    },
    {
      id: 'file_artie_palette',
      name: 'Artie_Color_Swatches.json',
      type: 'JSON Palette Spec',
      size: '2.4 KB',
      url: '/src/assets/data/artie_palette.json',
      description: 'Standardized sRGB and hex palette codes for 2D animation and 3D rendering teams.'
    }
  ]
};

export const STAN_DEFAULT_ITEM: ArchiveItem = {
  id: 'item_stan_concept_sheet_001',
  type: 'image',
  content: '/src/assets/images/stick_figure_stan_1786262675136.jpg',
  thumbnailContent: '/src/assets/images/stick_figure_stan_1786262675136.jpg',
  originalName: 'Stan_Stick_Figure_Draft.png',
  hash: 'hash_stan_concept_v1',
  description: 'First penciled and inked conceptual drawing of Stickman Stan on ruled notebook paper.',
  isSketch: true,
  charactersCount: 1,
  fileDate: new Date('2026-08-09').getTime(),
  artStyle: 'Minimalist Hand-Drawn Doodle',
  medium: 'Gel Pen & Pencil Wash',
  rating: 5,
  fileSize: 450000,
  createdAt: new Date('2026-08-09').getTime(),
  isFavorite: true
};

export const STAN_DEFAULT_CHARACTER: Character = {
  id: 'char_stan_master_001',
  name: 'Stickman Stan',
  gender: 'Others',
  species: 'Sketchbook Stick Figure',
  description: 'Stan is a simple but highly expressive hand-drawn stick figure who escaped the margins of his notepad. He lives a flat, 2D lifestyle in a 3D studio world.',
  tagline: 'The Sketchbook Escapist • Minimalist Doodle Hero',
  profileLayout: 'classic',
  bannerAlignment: 'center',
  bannerFit: 'cover',
  iconAlignment: 'center',
  iconFit: 'contain',
  iconScale: 1.1,
  iconShape: 'circle',
  showIndicators: false,
  status: 'Sorted',
  sourceId: 'item_stan_concept_sheet_001',
  sourceType: 'image',
  entityType: 'Character',
  age: 'Created during a boring lecture',
  role: 'Escaped Doodle / 2D Explorer',
  history: 'Stan started as a simple wire-frame doodle in the margins of a freshman calculus notebook. After a stray drop of coffee activated the ink molecules, Stan gain consciousness, climbed over the notebook wire binding, and embarked on a flat-world adventure across the studio desks.',
  personality: 'Determined, bouncy, extremely expressive, and constantly exploring. He cannot speak words but communicates through comical facial distortions and bending his body into funny symbols (like exclamation marks or question marks).',
  appearance: 'A minimalist black stick figure with a perfectly circular head, big googly cartoon eyes, and wire-thin limbs drawn with a rich black gel pen. His backdrop is the classic light-blue ruled line of a notepad page.',
  abilities: 'Origami Morphing: Can fold himself into paper planes, boats, or cranes to traverse gaps. Margin-slipping: Can compress his thickness to exactly 0mm, allowing him to slide behind posters, keycaps, and glass sheets.',
  strengths: 'Completely immune to falling damage, highly agile, can hide in plain sight on any sheet of paper.',
  weaknesses: 'Extremely vulnerable to water (ink bleed), eraser friction, and strong desk fans.',
  completionRating: '100% - Fully Rigged Stick-Animation Sheet',
  colorPalette: ['#111827', '#f3f4f6', '#3b82f6', '#ef4444'],
  originalColorPalette: ['#111827', '#f3f4f6', '#3b82f6', '#ef4444'],
  isFavorite: true,
  isUniqueName: true,
  highlightedImageSrc: '/src/assets/images/stick_figure_stan_1786262675136.jpg',
  bannerImageSrc: '/src/assets/images/stick_figure_stan_1786262675136.jpg',
  dateCreated: '2026-08-09',
  dateUploaded: '2026-08-09',
  creator: 'Notebook Margin Doodle Co.',
  firstPublication: 'Calculus Notepad Page 4',
  firstAppearance: 'Lecture Margin Doodle',
  firstAppearanceType: 'other',
  categories: ['Stick Figure', 'Doodle', 'Minimalist', 'Mascot'],
  attributes: {
    'Height': '6 college-ruled margins',
    'Weight': '0.005 ounces of gel ink',
    'Hair Color': 'None',
    'Eye Color': 'Ink Black',
    'Medium': '0.7mm Pilot Gel Pen',
    'Paper Background': '80gsm Ruled Stationery'
  },
  biblePages: [
    {
      id: 'page_stan_1',
      title: 'THE NOTEBOOK ESCAPE LORE',
      content: `THE ANATOMY OF A DOODLE HERO
Stan is constructed from exactly 5 lines of black ink.
- Thickness: 0.7mm.
- Head: A perfect hand-drawn circle with asymmetric hand-dotted googly eyes.
- Traversal limits: Stan can only walk on flat or nearly flat surfaces. To move vertically, he must find high-contrast edges or climb actual stationery margins.`
    },
    {
      id: 'page_stan_2',
      title: 'PHYSICAL RIG & EXPRESSIONS',
      content: `THE INK RIG
Because Stan lacks facial complexity, his limbs do all the talking:
1. "The Exclamation": Standing straight, arms rigid at sides, head floating 2mm above body.
2. "The Question Mark": Spine curved like a hook, legs crossed.
3. "The origami glide": Folds into a paper airplane to coast on AC draft currents.`
    }
  ],
  devTracker: {
    startDate: '2026-08-09',
    targetDeadline: 'Completed',
    credits: [
      { role: 'Original Doodler', name: 'Bored Student' },
      { role: 'Dossier Writer', name: 'Alberto Armentero' }
    ],
    logs: [
      { id: 'log_s1', date: '2026-08-09', hoursSpent: 2, description: 'Created stick figure draft on notepad margin.' }
    ]
  },
  subImages: [
    {
      id: 'sub_stan_1',
      src: '/src/assets/images/stick_figure_stan_1786262675136.jpg',
      title: 'Stan Master Doodle',
      description: 'The foundational sketch of Stickman Stan.'
    }
  ],
  audios: [
    {
      id: 'audio_stan_1',
      src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
      title: 'Scratchy Pen Drawings',
      description: 'Scribbling pencil and pen sound effects capturing Stan moving across the sheet.',
      category: 'Sound Effects'
    }
  ],
  videos: [
    {
      id: 'video_stan_1',
      src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      title: 'Stick Animation Demonstration',
      description: 'A traditional flip-book stick animation showing Stan running and jumping over margins.',
      category: 'Animations'
    }
  ],
  projects: [
    {
      id: 'proj_stan_ch1',
      projectName: "The Great Margin Escape",
      roleOrRelation: 'Main Protagonist',
      status: 'Official',
      description: 'The debut short story about Stan stepping off his ruled page and traversing an office desk.'
    }
  ],
  relationships: [
    {
      id: 'rel_artie_friend',
      targetName: 'Artie',
      relationshipType: 'Studio Companion',
      notes: 'Stan and Artie are great studio pals! They are both artist tools come to life. Stan often hides behind Artie\'s wooden legs to play hide-and-seek.',
      iconUrl: '/src/assets/images/wooden_dummy_1786259892970.jpg'
    }
  ]
};


