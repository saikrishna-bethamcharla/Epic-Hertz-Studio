/**
 * Central portfolio data — generated from Sai Krishna Bethamcharla's real projects,
 * resume, and technical toolkit.
 * Creative & Technical Lead at Zai Labs Private Limited.
 * Every fact on the site comes from this file.
 */

export type Palette = { from: string; via: string; to: string; accent: string };

export const profile = {
  fullName: 'Sai Krishna Bethamcharla',
  displayName: 'Sai Krishna',
  firstName: 'SAI KRISHNA',
  seriesTag: 'CREATIVE & TECHNICAL LEAD',
  /** Fictional studio card shown at the very start of the opening sequence. */
  originalLabel: 'A SAI KRISHNA ORIGINAL',
  role: 'Creative & Technical Lead',
  tagline: ['Creative & Technical Lead', 'AI Filmmaking', 'Web Development', 'Post-Production'],
  intro:
    'Creative & Technical Lead at Zai Labs Private Limited, working across AI-driven video production, website development, and graphic design, with hands-on experience directing multi-shot AI filmmaking projects from concept through post-production.',
  location: 'Hyderabad, India',
  phone: '+91-7995197160',
  email: 'saikrishnabethamcharla@gmail.com',
  links: {
    linkedin: 'https://linkedin.com/in/sai-krishna-bethamcharla',
    github: 'https://github.com/saikrishna-bethamcharla',
    instagram: 'https://www.instagram.com/saikrishna_bethamcharla',
  },
  resumePdf: './assets/Sai_Krishna_Bethamcharla_Resume.pdf',
  portrait: {
    src: './assets/portrait-v3-720.webp',
    srcSet: './assets/portrait-v3-420.webp 420w, ./assets/portrait-v3-720.webp 720w, ./assets/portrait-v3-1100.webp 1100w',
    alt: 'Portrait of Sai Krishna Bethamcharla',
  },
  interests: [
    'Generative AI Video Pipelines (Seedance, Kling, Higgsfield)',
    'Bilingual Structured Prompt Bibles (EN+ZH)',
    'Beat-Synced Editorial & Color Grading (DaVinci Resolve)',
    'Modern Web & CRM Infrastructure',
    'Interactive Media & Mobile Showcase Platforms',
  ],
};

export const education = [
  {
    school: 'Kingston University',
    place: 'London, United Kingdom',
    degree: 'Postgraduate Diploma (PGD)',
    period: '2022',
    score: 'PGD',
  },
];

export const experience = [
  {
    company: 'Zai Labs Private Limited',
    role: 'Creative & Technical Lead',
    place: 'Hyderabad, India',
    period: 'August 2026 – Present',
    points: [
      'Leading creative and technical delivery across website development, AI-driven video production, and graphic design for client engagements.',
      'Directing multi-shot AI filmmaking projects from concept through post-production with hands-on technical execution.',
      'Coordinated a client website, CRM, and hosting engagement covering full scope of work and production delivery.',
      'Owns client business documentation — standardized to a consistent formal brand template across work orders, quotations, and invoices.',
      'Organizing and leading a small creative/technical team around a shared production pipeline and conventions.',
    ],
  },
];

export type Metric = { value: string; label: string };

export type SubWebsite = {
  id: string;
  name: string;
  category: string;
  logline: string;
  image: string;
  liveUrl?: string;
  github?: string;
  tags: string[];
  metrics: string[];
};

export type Project = {
  id: string;
  title: string;
  year: string;
  genre: string;
  logline: string;
  image?: string;
  liveUrl?: string;
  websites?: SubWebsite[];
  stack: string[];
  build: string[];
  features: string[];
  metrics: Metric[];
  github?: string;
  palette: Palette;
  motif: 'shield' | 'flow' | 'tenants';
};

export const projects: Project[] = [
  {
    id: 'website-development',
    title: 'Website Development',
    year: '2026',
    genre: 'Production Web Systems • Enterprise Pharma • Agency Portal • Energy Healing',
    logline: 'Full-scope architecture, engineering, and deployment of production web applications — including the Vasudha Pharma Chem Limited Global Portal (80+ export nations, Zoho CRM), the Zai Labs Corporate AI Agency Platform, and the Pranic Healing AP & Telangana Chapter Web Portal.',
    image: './assets/projects/website-development-suite.jpg',
    liveUrl: 'https://saikrishna-bethamcharla.github.io/vasudhapharma/',
    github: 'https://github.com/saikrishna-bethamcharla/vasudhapharma',
    websites: [
      {
        id: 'vasudha-pharma-global',
        name: 'Vasudha Pharma Chem Limited',
        category: 'Global Enterprise Portal • 80+ Export Nations • Zoho CRM',
        logline: 'World-class corporate pharmaceutical portal exporting cGMP APIs, intermediates, and pellets to 80+ countries with interactive 3D global market footprint, automated Zoho CRM web-to-lead funnels, and 6-language localization.',
        image: './assets/projects/vasudha-pharma-site.jpg',
        liveUrl: 'https://saikrishna-bethamcharla.github.io/vasudhapharma/',
        github: 'https://github.com/saikrishna-bethamcharla/vasudhapharma',
        tags: ['Zoho CRM Lead Routing', '3D Interactive Globe', '6 Languages', 'cGMP API Catalog', 'SalesIQ Live Chat'],
        metrics: ['80+ Nations', '6 Languages', 'Zoho CRM Automated', 'cGMP Compliant'],
      },
      {
        id: 'zailabs-corporate',
        name: 'Zai Labs Private Limited',
        category: 'Corporate AI Agency Platform • Dark Cinematic UX • 3D Physics',
        logline: 'Production digital headquarters for Zai Labs built with dark cinematic design, real-time 3D card tilt & spotlight physics, laser progress telemetry, interactive CMS case study viewer, and custom video theater.',
        image: './assets/projects/zailabs-site.png',
        liveUrl: 'https://zailabs.co.in/',
        tags: ['Dark Cinematic UX', '3D Card Tilt & Physics', 'Laser Progress Telemetry', 'Video Theater Modal', 'Interactive CMS'],
        metrics: ['Sub-Second Load', '3D Physics Engine', 'Full Responsive', 'Production Live'],
      },
      {
        id: 'pranic-healing-aptelangana',
        name: 'Pranic Healing — AP & Telangana Chapter',
        category: 'Energy Healing Portal • Twin Hearts Live RSVP • GMCKS Courses',
        logline: 'Official digital portal for World Pranic Healing Foundation & Institute for Inner Studies (AP & Telangana Chapter), featuring dynamic aura energy visualizers, 8:40 PM Twin Hearts meditation WhatsApp booking, and GMCKS course directory.',
        image: './assets/projects/pranic-healing-site.jpg',
        liveUrl: 'https://www.pranichealingaptelangana.com/',
        tags: ['Twin Hearts 8:40 PM RSVP', 'Dynamic Energy Aura', 'GMCKS Course Directory', 'WhatsApp Booking Bridge', 'Digital Literature Library'],
        metrics: ['Live RSVP Booking', 'Dual State Chapter', 'GMCKS Certified', '100% Mobile Ready'],
      },
    ],
    stack: ['HTML5', 'Modern JavaScript (ES6+)', 'TypeScript', 'CSS3 / Tailwind', '3D Canvas & Physics', 'Zoho CRM Web-to-Lead', 'Cloud Deployment'],
    build: [
      'Engineered and launched 3 complete production web platforms spanning global corporate pharmaceuticals, an AI agency digital portal, and an energy healing state chapter portal.',
      'Configured automated customer acquisition funnels incorporating Zoho CRM web-to-lead scripts, SalesIQ chat, and multi-language routing for international markets.',
      'Architected dark cinematic user interfaces with 3D card tilt physics, spotlight lighting, and instant WhatsApp booking bridges for live event attendance.',
      'Managed full-scope client deliverables covering responsive frontends, managed cloud hosting, DNS configuration, and standardized brand documentation across work orders, quotes, and invoices.',
    ],
    features: [
      'Vasudha Global: Interactive 3D export globe & 6-language localization',
      'Zai Labs Portal: Dark cinematic UX, 3D card tilt physics & video theater',
      'Pranic Healing: Energy aura visualizer & 8:40 PM Twin Hearts WhatsApp RSVP',
      'Zoho CRM automation, SalesIQ live chat & regulatory compliance displays',
      'Fully responsive, mobile-first performance architecture with sub-second loads',
    ],
    metrics: [
      { value: '3 Platforms', label: 'production web platforms deployed' },
      { value: '80+ Nations', label: 'global export market footprint' },
      { value: 'Zoho CRM', label: 'automated lead capture funnels' },
      { value: 'GMCKS & AI', label: 'pharma, agency & healing portals' },
      { value: 'Full-Scope', label: 'architecture, CRM, hosting & brand' },
    ],
    palette: { from: '#04121f', via: '#0f4c6e', to: '#05080d', accent: '#4cc9ff' },
    motif: 'flow',
  },
  {
    id: 'ai-cinematic-pipeline',
    title: 'Multi-Shot AI Film Direction',
    year: '2026',
    genre: 'AI Cinema • Seedance 2.0 • Kling 3.0 • Higgsfield',
    logline: 'End-to-end multi-shot AI filmmaking pipeline with structured bilingual prompt engineering, shot bibles, and character consistency.',
    stack: ['Seedance 2.0', 'Kling 3.0', 'Higgsfield', 'ComfyUI', 'Bilingual Prompt Bibles (EN+ZH)', 'DaVinci Resolve'],
    build: [
      'Architected and directed end-to-end multi-shot AI filmmaking projects from concept, storyboard, and shot planning through post-production finishing.',
      'Engineered structured bilingual (EN+ZH) prompts, comprehensive shot bibles, and reference-image consistency strategies ensuring character, wardrobe, and environment continuity.',
      'Combined generative video generation with DaVinci Resolve color grading and beat-synced rhythm cutting for commercial and narrative campaigns.',
    ],
    features: [
      'Multi-shot shot planning and cinematic camera choreography',
      'Structured bilingual (EN+ZH) prompt engineering architecture',
      'Reference-image consistency for characters and environments',
      'AI generation with Seedance 2.0, Kling 3.0, and Higgsfield',
      'Multi-scene commercial and narrative assembly',
    ],
    metrics: [
      { value: 'End-to-End', label: 'concept to post-production pipeline' },
      { value: 'Multi-Shot', label: 'character & environment continuity' },
      { value: 'Bilingual', label: 'EN + ZH structured prompt bibles' },
      { value: '3 Engines', label: 'Seedance 2.0, Kling 3.0, Higgsfield' },
    ],
    palette: { from: '#2a0610', via: '#7a0f24', to: '#0b0710', accent: '#ff3d5a' },
    motif: 'shield',
  },
  {
    id: 'post-production-motion',
    title: 'Cinematic Post & Motion Graphics',
    year: '2025 – 2026',
    genre: 'DaVinci Resolve • Premiere Pro • After Effects • Audition',
    logline: 'Beat-synced editorial assembly, visual effects compositing, match-cutting, narrative color grading, and sound design.',
    stack: ['DaVinci Resolve', 'Adobe Premiere Pro', 'Adobe After Effects', 'Adobe Audition', 'CapCut'],
    build: [
      'Executed high-precision post-production workflows with DaVinci Resolve and Adobe Premiere Pro, creating beat-synced cuts and cinematic rhythm for commercial campaigns.',
      'Designed custom motion graphics and visual compositing in Adobe After Effects with match-cutting and montage assembly for narrative storytelling.',
      'Implemented industry-standard color science and mood grading in DaVinci Resolve and sound design in Adobe Audition.',
    ],
    features: [
      'Beat-synced precision editing & montage cutting',
      'Motion graphics & visual compositing in After Effects',
      'Cinematic color grading & LUT workflows in DaVinci Resolve',
      'Sound design, pacing, and audio finishing in Audition',
      'Short-form and long-form video pipeline assembly',
    ],
    metrics: [
      { value: 'Beat-Synced', label: 'rhythmic editorial pacing' },
      { value: '4 Suites', label: 'DaVinci, Premiere, AE & Audition' },
      { value: 'Motion FX', label: 'After Effects compositing' },
      { value: 'Finishing', label: 'color grade & sound design' },
    ],
    palette: { from: '#120822', via: '#3d1a6e', to: '#07060c', accent: '#b98bff' },
    motif: 'flow',
  },
  {
    id: 'brand-identity-operations',
    title: 'Brand Systems & Client Delivery',
    year: '2026',
    genre: 'Design Systems • Typography • Brand Operations',
    logline: 'Standardized client documentation frameworks, typography systems, and vector brand asset systems.',
    stack: ['Adobe Illustrator', 'Adobe Photoshop', 'Design Systems', 'Typography', 'Client Scoping'],
    build: [
      'Created branded visual assets, color palettes, and structured typography systems using Adobe Illustrator and Photoshop for formal client engagements.',
      'Standardized end-to-end client business documentation — formal work orders, technical quotations, and invoices aligned to a consistent brand standard.',
    ],
    features: [
      'Standardized formal work orders, quotes & invoices',
      'Curated color palettes & typography systems',
      'Vector logo and marketing visual asset creation',
      'Cross-functional creative-to-technical pipeline SOPs',
    ],
    metrics: [
      { value: '100%', label: 'brand-consistent client documentation' },
      { value: 'Standardized', label: 'work orders, quotations & invoices' },
      { value: 'Branded', label: 'typography and color palettes' },
      { value: 'Team Ops', label: 'shared conventions & workflows' },
    ],
    palette: { from: '#120822', via: '#3d1a6e', to: '#07060c', accent: '#b98bff' },
    motif: 'tenants',
  },
];

export type Achievement = {
  id: string;
  title: string;
  org: string;
  detail: string;
  laurel: string;
  link?: string;
};

export const achievements: Achievement[] = [
  {
    id: 'zai-labs-lead',
    title: 'Creative & Technical Lead',
    org: 'Zai Labs Private Limited',
    detail: 'Leading creative and technical delivery across AI video, web development, and graphic design.',
    laurel: 'Leadership Role',
  },
  {
    id: 'kingston-pgd',
    title: 'Postgraduate Diploma (PGD)',
    org: 'Kingston University, London',
    detail: 'Completed postgraduate qualification in 2022 with focus on multidisciplinary creative execution.',
    laurel: 'Kingston Alum',
  },
  {
    id: 'ai-filmmaking-direction',
    title: 'Multi-Shot AI Filmmaking',
    org: 'Seedance 2.0 • Kling 3.0 • Higgsfield',
    detail: 'Developed proprietary bilingual (EN+ZH) shot bibles and reference consistency pipelines for cinematic productions.',
    laurel: 'AI Direction',
  },
  {
    id: 'website-development-platforms',
    title: 'Website Development & Platforms',
    org: 'Vasudha Pharma • Zai Labs • Pranic Healing',
    detail: 'Architected 3 production web platforms across corporate pharma (80+ export nations, Zoho CRM), AI agency portal, and GMCKS energy healing chapter.',
    laurel: 'Web Platforms',
    link: 'https://saikrishna-bethamcharla.github.io/vasudhapharma/',
  },
  {
    id: 'pranic-healing-platform',
    title: 'Pranic Healing State Chapter Portal',
    org: 'World Pranic Healing Foundation (AP & Telangana)',
    detail: 'Engineered official chapter portal featuring dynamic energy aura visualizers, GMCKS course directory, and 8:40 PM Twin Hearts WhatsApp RSVP.',
    laurel: 'Healing Portal',
    link: 'https://www.pranichealingaptelangana.com/',
  },
  {
    id: 'brand-standardization',
    title: 'Standardized Brand System',
    org: 'Client Operations & Scoping',
    detail: 'Unified work orders, technical quotations, and invoices into a consistent formal brand template.',
    laurel: 'Brand System',
  },
];

export type ProfessionalHighlight = { issuer: string; name: string; link?: string };

export const professionalHighlights: ProfessionalHighlight[] = [
  { issuer: 'Education', name: 'Postgraduate Diploma (PGD) • Kingston University, London' },
  { issuer: 'Professional Experience', name: 'Creative & Technical Lead • Zai Labs' },
  { issuer: 'Web Architecture', name: 'Website Development & Zoho CRM Infrastructure', link: 'https://saikrishna-bethamcharla.github.io/vasudhapharma/' },
  { issuer: 'Zai Labs Platform', name: 'Corporate AI Agency Portal & 3D Interactive UX', link: 'https://zailabs.co.in/' },
  { issuer: 'Pranic Healing', name: 'AP & Telangana Chapter Web Portal & RSVP Bridge', link: 'https://www.pranichealingaptelangana.com/' },
  { issuer: 'AI Video', name: 'Generative video workflows and multi-shot direction' },
  { issuer: 'Post-Production', name: 'Editing, colour grading, and motion graphics' },
  { issuer: 'Creative Design', name: 'Branding, visual design, and compositing' },
  { issuer: 'Client Delivery', name: 'Project scoping, documentation, and web deployment' },
];

export type Skill = { name: string; mono: string; note?: string };
export type SkillCategory = { id: string; title: string; subtitle: string; skills: Skill[] };

export const skillCategories: SkillCategory[] = [
  {
    id: 'ai-filmmaking',
    title: 'AI Video & Filmmaking',
    subtitle: 'Generative cinema & shot bibles',
    skills: [
      { name: 'Seedance 2.0', mono: 'Se', note: 'AI Video' },
      { name: 'Kling 3.0', mono: 'Kl', note: 'AI Video' },
      { name: 'Higgsfield', mono: 'Hg' },
      { name: 'Stable Diffusion', mono: 'Sd', note: 'Generative' },
      { name: 'Midjourney', mono: 'Mj' },
      { name: 'Runway Gen-3', mono: 'Rw' },
      { name: 'ComfyUI', mono: 'Cu', note: 'Node Workflows' },
      { name: 'Structured Prompting', mono: 'Pr', note: 'Bilingual EN+ZH' },
      { name: 'Shot Bibles', mono: 'Sb' },
      { name: 'Reference Consistency', mono: 'Rc' },
      { name: 'Multi-Shot Planning', mono: 'Ms' },
    ],
  },
  {
    id: 'post-production',
    title: 'Video Editing & Post',
    subtitle: 'Beat-synced editorial & compositing',
    skills: [
      { name: 'DaVinci Resolve', mono: 'Dr', note: 'Editorial & Color' },
      { name: 'Adobe Premiere Pro', mono: 'Pr' },
      { name: 'Adobe After Effects', mono: 'Ae', note: 'Motion & VFX' },
      { name: 'CapCut', mono: 'Cc' },
      { name: 'Adobe Audition', mono: 'Au', note: 'Sound Design' },
      { name: 'Beat-Synced Editing', mono: 'Bs' },
      { name: 'Match-Cutting', mono: 'Mc' },
      { name: 'Montage Assembly', mono: 'Ma' },
      { name: 'Color Grading', mono: 'Cg', note: 'LUTs & Mood' },
    ],
  },
  {
    id: 'web-dev',
    title: 'Software & Web Development',
    subtitle: 'Frontend, graphics engines & client systems',
    skills: [
      { name: 'Python', mono: 'Py', note: 'Automation & Media' },
      { name: 'JavaScript (ES6+)', mono: 'Js' },
      { name: 'TypeScript', mono: 'Ts' },
      { name: 'HTML5 / Canvas', mono: 'Cv', note: 'Real-time Graphics' },
      { name: 'CSS3 / Tailwind', mono: 'Cs' },
      { name: 'WebCodecs API', mono: 'Wc', note: 'Alpha Video' },
      { name: 'CRM Integration', mono: 'Cr' },
      { name: 'Hosting & DNS', mono: 'Hs' },
      { name: 'Git & GitHub', mono: 'Gt' },
    ],
  },
  {
    id: 'graphic-design',
    title: 'Graphic Design & 3D',
    subtitle: 'Vector branding, visual systems & 3D',
    skills: [
      { name: 'Adobe Illustrator', mono: 'Ai' },
      { name: 'Adobe Photoshop', mono: 'Ps' },
      { name: 'Blender', mono: 'Bl', note: '3D Layout' },
      { name: 'Color Palettes', mono: 'Cp' },
      { name: 'Typography Systems', mono: 'Ty' },
      { name: 'Branded Visual Assets', mono: 'Va' },
      { name: 'Template Design', mono: 'Td' },
    ],
  },
  {
    id: 'leadership',
    title: 'Leadership & Client Delivery',
    subtitle: 'Production pipelines & conventions',
    skills: [
      { name: 'Creative & Tech Direction', mono: 'Cd', note: 'Zai Labs' },
      { name: 'Production Pipelines', mono: 'Pp' },
      { name: 'Team Coordination', mono: 'Tc' },
      { name: 'Client Scoping', mono: 'Cs' },
      { name: 'Work Orders & Invoices', mono: 'Wo' },
      { name: 'Brand Documentation', mono: 'Bd' },
      { name: 'End-to-End Ownership', mono: 'Eo' },
    ],
  },
];

export const skillEvidence: Record<string, string[]> = {
  'Seedance 2.0': ['Multi-Shot AI Filmmaking', 'Zai Labs Productions'],
  'Kling 3.0': ['Multi-Shot AI Filmmaking', 'Commercial Client Campaigns'],
  Higgsfield: ['AI Video Generation', 'Concept Prototyping'],
  'Stable Diffusion': ['Generative Visuals', 'Stylized Concept Frames'],
  Midjourney: ['Visual Concept Art', 'Moodboards'],
  'Runway Gen-3': ['AI Video Extensions', 'Camera Moves'],
  ComfyUI: ['Custom Node Pipelines', 'Consistent Characters'],
  'Structured Prompting': ['Bilingual (EN+ZH) Prompts', 'Character Continuity'],
  'Shot Bibles': ['Multi-Scene Narrative Consistency'],
  'DaVinci Resolve': ['Beat-Synced Editing', 'Cinematic Color Grading'],
  'Adobe Premiere Pro': ['Commercial Montage', 'Master Assembly'],
  'Adobe After Effects': ['Motion Graphics', 'Visual Compositing'],
  CapCut: ['Short-Form Beat-Synced Edits'],
  'Adobe Audition': ['Audio Mastering', 'Sound Design'],
  Python: ['Automation Scripts', 'Batch Media Processors'],
  'JavaScript (ES6+)': ['Frontend Client Platforms', 'StreamHub Engine'],
  TypeScript: ['Component Architecture', 'Interactive Web Apps'],
  'HTML5 / Canvas': ['Real-Time Graphics', 'StreamHub Showcase'],
  'CSS3 / Tailwind': ['Responsive Layouts & Motion'],
  'WebCodecs API': ['Video & Media Processing'],
  'CRM Integration': ['Zai Labs Client Delivery', 'Lead Automation'],
  'Hosting & DNS': ['Client Web Engagements', 'Cloud Deployment'],
  'Adobe Illustrator': ['Vector Assets', 'Brand Systems'],
  'Adobe Photoshop': ['Digital Art', 'Document Templates'],
  Blender: ['3D Modeling', 'Camera Choreography'],
  'Creative & Tech Direction': ['Zai Labs Leadership', 'End-to-End Delivery'],
  'Production Pipelines': ['Cross-Functional Team Coordination'],
  'Work Orders & Invoices': ['Standardized Brand Documentation'],
};

export type Episode = {
  code: string;
  title: string;
  description: string;
  tags: string[];
  runtime: string;
  palette: Palette;
};

export type Season = {
  number: number;
  title: string;
  period: string;
  synopsis: string;
  episodes: Episode[];
};

const crimson: Palette = { from: '#24060b', via: '#6e0d1d', to: '#09070a', accent: '#ff3d5a' };
const amber: Palette = { from: '#1c1003', via: '#6b3c06', to: '#0a0806', accent: '#ffb547' };
const ocean: Palette = { from: '#04121f', via: '#0f4c6e', to: '#05080d', accent: '#4cc9ff' };
const violet: Palette = { from: '#120822', via: '#3d1a6e', to: '#07060c', accent: '#b98bff' };
const jade: Palette = { from: '#03150f', via: '#0d5a40', to: '#050a08', accent: '#46e3a8' };

export const seasons: Season[] = [
  {
    number: 1,
    title: 'The Academic Foundation',
    period: '2022',
    synopsis: 'Postgraduate Diploma (PGD) at Kingston University, London — establishing core creative and multidisciplinary foundations.',
    episodes: [
      {
        code: 'S01 E01',
        title: 'Kingston Years',
        description: 'Postgraduate Diploma (PGD) at Kingston University — rigorous creative methodologies, research, and technical foundations.',
        tags: ['Kingston University', 'PGD', 'London'],
        runtime: 'Graduated 2022',
        palette: violet,
      },
    ],
  },
  {
    number: 2,
    title: 'Visual Craft & Post-Production',
    period: '2023 – 2024',
    synopsis: 'Mastering the post-production suite — DaVinci Resolve, Premiere Pro, After Effects, and graphic design systems.',
    episodes: [
      {
        code: 'S02 E01',
        title: 'The Editorial Suite',
        description: 'Beat-synced editing, match-cutting, and narrative montages in DaVinci Resolve and Adobe Premiere Pro.',
        tags: ['DaVinci Resolve', 'Premiere Pro', 'Editorial'],
        runtime: 'Post-Production',
        palette: amber,
      },
      {
        code: 'S02 E02',
        title: 'Motion & Visual Identity',
        description: 'Adobe After Effects motion graphics, compositing, and brand identity design in Illustrator and Photoshop.',
        tags: ['After Effects', 'Illustrator', 'Photoshop'],
        runtime: 'Motion & Brand',
        palette: crimson,
      },
    ],
  },
  {
    number: 3,
    title: 'Software & Web Systems',
    period: '2025',
    synopsis: 'Python scripting for media automation, front-end development with HTML/CSS/JavaScript, CRM integration, and cloud architectures.',
    episodes: [
      {
        code: 'S03 E01',
        title: 'Python Automation & Media Processing',
        description: 'Developing automated media processing scripts, batch utilities, and workflow tools in Python.',
        tags: ['Python', 'Automation', 'Batch Media'],
        runtime: 'Software Scripting',
        palette: ocean,
      },
      {
        code: 'S03 E02',
        title: 'Interactive Frontend & CRM',
        description: 'Building responsive web applications, CRM configuration, customer lead routing, and cloud hosting.',
        tags: ['JavaScript', 'HTML5', 'CRM Integration'],
        runtime: 'Web & Systems',
        palette: jade,
      },
    ],
  },
  {
    number: 4,
    title: 'Creative & Technical Lead',
    period: 'August 2026 – Present',
    synopsis: 'Creative & Technical Lead at Zai Labs Private Limited — directing multi-shot AI filmmaking pipelines and full-scope client deliveries.',
    episodes: [
      {
        code: 'S04 E01',
        title: 'AI Filmmaking Direction',
        description: 'Directing multi-shot AI filmmaking from concept through post-production using Seedance 2.0, Kling 3.0, and bilingual shot bibles.',
        tags: ['Seedance 2.0', 'Kling 3.0', 'Shot Bibles'],
        runtime: 'Zai Labs',
        palette: crimson,
      },
      {
        code: 'S04 E02',
        title: 'Full-Scope Production Lead',
        description: 'Coordinated complete client website, CRM, and hosting engagements while leading a cross-functional creative/technical team.',
        tags: ['Full-Scope', 'Zai Labs', 'Leadership'],
        runtime: 'Production Lead',
        palette: ocean,
      },
      {
        code: 'S04 E03',
        title: 'Brand Standards & Documentation',
        description: 'Standardized client business operations — formal work orders, technical quotations, and brand design systems.',
        tags: ['Brand Templates', 'Work Orders', 'Invoicing'],
        runtime: 'Operations',
        palette: amber,
      },
    ],
  },
  {
    number: 5,
    title: 'Next-Gen Platforms & Cinema',
    period: 'Now Streaming',
    synopsis: 'Building interactive StreamHub mobile QR platforms and advancing multi-shot generative AI filmmaking pipelines.',
    episodes: [
      {
        code: 'S05 E01',
        title: 'StreamHub & QR Ecosystem',
        description: 'Creating frictionless mobile testing and live video showcase platforms with real-time QR generation.',
        tags: ['StreamHub', 'QR Bridge', 'Video Theater'],
        runtime: 'Interactive Platform',
        palette: ocean,
      },
      {
        code: 'S05 E02',
        title: 'Autonomous AI Cinema Pipelines',
        description: 'Directing multi-scene continuous narratives with Seedance 2.0, Kling 3.0, and bilingual character bibles.',
        tags: ['AI Cinema', 'Bilingual Bibles', 'Multi-Shot'],
        runtime: 'Generative Cinema',
        palette: crimson,
      },
    ],
  },
];

export type TopPick = { label: string; title: string; detail: string; palette: Palette; image: string };

export const topPicks: TopPick[] = [
  { label: 'Primary Role', title: 'Creative & Tech Lead', detail: 'Zai Labs Private Limited • August 2026 – Present', palette: crimson, image: './assets/picks/pick-1.webp' },
  { label: 'AI Video Engine', title: 'Seedance 2.0 & Kling 3.0', detail: 'Multi-shot AI filmmaking with structured shot bibles', palette: crimson, image: './assets/picks/pick-2.webp' },
  { label: 'Academic Credential', title: 'Kingston University', detail: 'Postgraduate Diploma (PGD) • London', palette: violet, image: './assets/picks/pick-3.webp' },
  { label: 'Prompt Mastery', title: 'Bilingual (EN+ZH)', detail: 'Structured prompts for character & environment consistency', palette: ocean, image: './assets/picks/pick-4.webp' },
  { label: 'Website Development', title: 'Production Web Platforms', detail: 'Vasudha Pharma (80+ nations, Zoho CRM), Zai Labs & Pranic Healing', palette: ocean, image: './assets/picks/pick-5.webp' },
  { label: 'Energy Healing Web', title: 'Pranic Healing Portal', detail: 'AP & Telangana chapter, dynamic aura visualizer & 8:40 PM Twin Hearts RSVP', palette: jade, image: './assets/picks/pick-6.webp' },
  { label: 'Post-Production', title: 'DaVinci Resolve', detail: 'Beat-synced editorial & cinematic color grading', palette: crimson, image: './assets/picks/pick-7.webp' },
  { label: 'Motion Graphics', title: 'After Effects', detail: 'Compositing, visual effects & title animations', palette: violet, image: './assets/picks/pick-8.webp' },
  { label: 'Visual Design', title: 'Adobe Illustrator & Photoshop', detail: 'Branded visual assets & typography systems', palette: amber, image: './assets/picks/pick-9.webp' },
  { label: 'Team Leadership', title: 'Production SOPs', detail: 'Standardized work orders, quotations & client documentation', palette: crimson, image: './assets/picks/pick-10.webp' },
];

export type IntroSlide = { kicker: string; title: string; lines: string[]; chips?: string[] };

export const introSlides: IntroSlide[] = [
  {
    kicker: 'Leadership',
    title: 'Creative & Technical Lead',
    lines: ['Zai Labs Private Limited', 'August 2026 – Present', 'Hyderabad, India'],
    chips: ['AI Filmmaking', 'Web Development', 'Graphic Design'],
  },
  {
    kicker: 'Education',
    title: 'Kingston University',
    lines: ['Postgraduate Diploma (PGD)', 'London, United Kingdom · 2022'],
    chips: ['Kingston PGD'],
  },
  {
    kicker: 'AI Direction',
    title: 'Cinematic AI Video',
    lines: ['Multi-shot filmmaking pipeline from concept through post-production', 'Seedance 2.0, Kling 3.0, Higgsfield & ComfyUI', 'Bilingual (EN+ZH) prompt engineering & shot bibles'],
    chips: ['Seedance 2.0', 'Kling 3.0', 'Higgsfield', 'Shot Bibles'],
  },
  {
    kicker: 'Post-Production',
    title: 'The Editorial Suite',
    lines: ['DaVinci Resolve, Adobe Premiere Pro & CapCut', 'Adobe After Effects for motion graphics & compositing', 'Beat-synced editing, sound design in Audition & match-cutting'],
    chips: ['DaVinci Resolve', 'Premiere Pro', 'After Effects'],
  },
  {
    kicker: 'Web Platform',
    title: 'Website Development & Delivery',
    lines: ['Full-scope architecture across corporate pharma, agency & wellness platforms', 'Vasudha Pharma (80+ nations, Zoho CRM), Zai Labs & Pranic Healing', 'Frontend development with TypeScript, JavaScript, HTML5 & Tailwind'],
    chips: ['Website Development', 'Zoho CRM', 'JavaScript', 'TypeScript'],
  },
  {
    kicker: 'Creative Operations',
    title: 'Brand & Systems',
    lines: ['Adobe Illustrator & Photoshop for branded assets & vector design', 'Standardized work orders, quotations & invoices to brand template'],
    chips: ['Illustrator', 'Photoshop', 'Brand Systems'],
  },
];

export type ProfileId = 'saikrishna' | 'creative' | 'technical' | 'lead';
export type SectionId = 'about' | 'journey' | 'originals' | 'picks' | 'skills' | 'moments' | 'story';

export const viewerProfiles: {
  id: ProfileId;
  name: string;
  blurb: string;
  color: string;
  order: SectionId[];
}[] = [
  {
    id: 'saikrishna',
    name: 'Sai Krishna',
    blurb: 'The full series, in order',
    color: '#e5132b',
    order: ['about', 'originals', 'journey', 'picks', 'skills', 'moments', 'story'],
  },
  {
    id: 'creative',
    name: 'Creative / Director',
    blurb: 'AI filmmaking, video editing & motion first',
    color: '#ffb547',
    order: ['originals', 'picks', 'skills', 'journey', 'moments', 'about', 'story'],
  },
  {
    id: 'technical',
    name: 'Technical / Web',
    blurb: 'Web development, CRM integration & pipelines first',
    color: '#4cc9ff',
    order: ['originals', 'skills', 'journey', 'moments', 'about', 'picks', 'story'],
  },
  {
    id: 'lead',
    name: 'Client & Leadership',
    blurb: 'Experience, brand systems, leadership & resume first',
    color: '#46e3a8',
    order: ['story', 'moments', 'skills', 'originals', 'about', 'journey', 'picks'],
  },
];

export const sectionMeta: Record<SectionId, { nav: string; card: string; meta: string; palette: Palette }> = {
  about: { nav: 'About', card: 'About Me', meta: 'The Pilot • Education & experience', palette: violet },
  originals: { nav: 'Originals', card: 'My Projects', meta: `${projects.length} Originals • 2026`, palette: crimson },
  journey: { nav: 'Journey', card: 'My Journey', meta: `${seasons.length} Seasons • ${seasons.reduce((n, s) => n + s.episodes.length, 0)} Episodes`, palette: amber },
  picks: { nav: 'Top Picks', card: 'Top Picks', meta: 'Top 10 from the resume', palette: jade },
  skills: { nav: 'Skills', card: 'My Skills', meta: `${skillCategories.length} Categories`, palette: ocean },
  moments: { nav: 'Moments', card: 'Awards & Highlights', meta: `${achievements.length} Moments • ${professionalHighlights.length} Highlights`, palette: crimson },
  story: { nav: 'Resume', card: 'The Full Story', meta: 'Resume • View & download', palette: violet },
};
