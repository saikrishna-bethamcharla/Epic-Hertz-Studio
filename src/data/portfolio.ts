/**
 * Central portfolio data — generated from Sai Krishna Bethamcharla's resume.
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
    github: 'https://github.com/saikrishnabethamcharla',
  },
  resumePdf: '/assets/Sai_Krishna_Bethamcharla_Resume.pdf',
  portrait: {
    src: '/assets/portrait-720.webp',
    srcSet: '/assets/portrait-420.webp 420w, /assets/portrait-720.webp 720w, /assets/portrait-1100.webp 1100w',
    alt: 'Portrait of Sai Krishna Bethamcharla',
  },
  interests: ['Generative AI Video Pipelines', 'Bilingual AI Prompting (EN+ZH)', 'Motion Graphics & Compositing', 'Modern Web & CRM Systems'],
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

export type Project = {
  id: string;
  title: string;
  year: string;
  genre: string;
  logline: string;
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
    id: 'ai-cinematic-pipeline',
    title: 'Cinematic AI Film Production',
    year: '2026',
    genre: 'AI Video • Seedance 2.0 • Kling 3.0 • Higgsfield',
    logline: 'End-to-end multi-shot AI filmmaking pipeline with structured bilingual prompt engineering, shot bibles, and character consistency.',
    stack: ['Seedance 2.0', 'Kling 3.0', 'Higgsfield', 'Prompt Engineering (EN+ZH)', 'Shot Bibles'],
    build: [
      'Architected and directed end-to-end multi-shot AI filmmaking projects from concept, storyboard, and shot planning through post-production and master delivery.',
      'Engineered structured bilingual (EN+ZH) prompts, comprehensive shot bibles, and reference-image consistency strategies ensuring character and environmental continuity across multi-scene productions.',
    ],
    features: [
      'Multi-shot shot planning and scene composition',
      'Structured bilingual (EN+ZH) prompt engineering',
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
    id: 'web-crm-delivery-platform',
    title: 'Client Web & CRM Architecture',
    year: '2026',
    genre: 'Frontend • Modern JS • CRM • Hosting',
    logline: 'Production-ready responsive web applications with integrated CRM workflows and managed hosting infrastructure.',
    stack: ['HTML5', 'CSS3', 'JavaScript', 'Modern JS Frameworks', 'CRM Integration', 'Hosting Setup'],
    build: [
      'Led technical front-end development with HTML, CSS, and modern JavaScript frameworks, engineering responsive and high-converting web applications.',
      'Coordinated complete client website builds, managed hosting setups, and end-to-end CRM integration and configuration as part of client delivery scopes at Zai Labs.',
    ],
    features: [
      'Responsive multi-device interface architecture',
      'CRM integration & automated customer lead flows',
      'Client hosting configuration and DNS setup',
      'Brand-consistent typography and design systems',
    ],
    metrics: [
      { value: 'Full-Scope', label: 'website, CRM & hosting engagement' },
      { value: '100%', label: 'responsive across mobile & desktop' },
      { value: 'Automated', label: 'CRM pipeline configuration' },
      { value: 'Production', label: 'reliable client hosting setup' },
    ],
    palette: { from: '#04121f', via: '#0f4c6e', to: '#05080d', accent: '#4cc9ff' },
    motif: 'flow',
  },
  {
    id: 'post-production-motion',
    title: 'Cinematic Post & Motion Graphics',
    year: '2026',
    genre: 'DaVinci Resolve • Premiere Pro • After Effects',
    logline: 'Beat-synced editorial assembly, visual effects compositing, match-cutting, and narrative color grading.',
    stack: ['DaVinci Resolve', 'Adobe Premiere Pro', 'Adobe After Effects', 'CapCut', 'Sound Design'],
    build: [
      'Executed high-precision post-production workflows with DaVinci Resolve and Adobe Premiere Pro, creating beat-synced cuts and cinematic rhythm for commercial campaigns.',
      'Designed custom motion graphics and visual compositing in Adobe After Effects with match-cutting and montage assembly for narrative storytelling.',
    ],
    features: [
      'Beat-synced precision editing & montage cutting',
      'Motion graphics & visual compositing in After Effects',
      'Cinematic color grading & LUT workflows in DaVinci Resolve',
      'Short-form and long-form video pipeline assembly',
    ],
    metrics: [
      { value: 'Beat-Synced', label: 'rhythmic editorial pacing' },
      { value: '2 Suites', label: 'DaVinci Resolve & Adobe CC' },
      { value: 'Motion FX', label: 'After Effects compositing' },
      { value: 'Commercial', label: 'and narrative grade quality' },
    ],
    palette: { from: '#1a0d02', via: '#8a4a07', to: '#0a0806', accent: '#ffb547' },
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
    id: 'full-scope-delivery',
    title: 'Full-Scope Client Delivery',
    org: 'Website • CRM • Hosting',
    detail: 'Coordinated an end-to-end client engagement delivering responsive web, automated CRM integration, and production hosting.',
    laurel: 'Client Delivery',
  },
  {
    id: 'brand-standardization',
    title: 'Standardized Brand System',
    org: 'Client Operations & Scoping',
    detail: 'Unified work orders, technical quotations, and invoices into a consistent formal brand template.',
    laurel: 'Brand System',
  },
];

export type Certification = { issuer: string; name: string; link: string };

export const certifications: Certification[] = [
  { issuer: 'Kingston University', name: 'Postgraduate Diploma (PGD)', link: '#' },
  { issuer: 'Zai Labs', name: 'Creative & Technical Leadership', link: '#' },
  { issuer: 'AI Cinema', name: 'Seedance 2.0 & Kling 3.0 Generative Video', link: '#' },
  { issuer: 'Post-Production', name: 'DaVinci Resolve & Premiere Pro Editorial', link: '#' },
  { issuer: 'Adobe CC', name: 'After Effects Motion Graphics & Compositing', link: '#' },
  { issuer: 'Web Dev', name: 'Modern JavaScript & Frontend Development', link: '#' },
  { issuer: 'Design Systems', name: 'Adobe Illustrator & Photoshop Visual Branding', link: '#' },
  { issuer: 'Client Delivery', name: 'Client Scoping, Work Orders & CRM Architecture', link: '#' },
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
      { name: 'Beat-Synced Editing', mono: 'Bs' },
      { name: 'Match-Cutting', mono: 'Mc' },
      { name: 'Montage Assembly', mono: 'Ma' },
    ],
  },
  {
    id: 'web-dev',
    title: 'Website Development',
    subtitle: 'Frontend & client delivery systems',
    skills: [
      { name: 'HTML5', mono: 'Ht' },
      { name: 'CSS3', mono: 'Cs' },
      { name: 'JavaScript', mono: 'Js' },
      { name: 'Modern JS Frameworks', mono: 'Fw' },
      { name: 'CRM Integration', mono: 'Cr' },
      { name: 'Hosting Setup', mono: 'Hs' },
      { name: 'Responsive UI', mono: 'Ui' },
    ],
  },
  {
    id: 'graphic-design',
    title: 'Graphic Design & Branding',
    subtitle: 'Vector assets & visual identity',
    skills: [
      { name: 'Adobe Illustrator', mono: 'Ai' },
      { name: 'Adobe Photoshop', mono: 'Ps' },
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
  'Structured Prompting': ['Bilingual (EN+ZH) Prompts', 'Character Continuity'],
  'Shot Bibles': ['Multi-Scene Narrative Consistency'],
  'DaVinci Resolve': ['Beat-Synced Editing', 'Cinematic Color Grading'],
  'Adobe Premiere Pro': ['Commercial Montage', 'Master Assembly'],
  'Adobe After Effects': ['Motion Graphics', 'Visual Compositing'],
  CapCut: ['Short-Form Beat-Synced Edits'],
  JavaScript: ['Frontend Client Platforms', 'Responsive UI'],
  HTML5: ['Semantic Website Builds'],
  CSS3: ['Responsive Layouts & Motion'],
  'CRM Integration': ['Zai Labs Client Delivery', 'Lead Automation'],
  'Hosting Setup': ['Client Web Engagements', 'Cloud Deployment'],
  'Adobe Illustrator': ['Vector Assets', 'Brand Systems'],
  'Adobe Photoshop': ['Digital Art', 'Document Templates'],
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
    title: 'Web & Client Systems',
    period: '2025',
    synopsis: 'Front-end web development with HTML, CSS, JavaScript, CRM integration, and production hosting architectures.',
    episodes: [
      {
        code: 'S03 E01',
        title: 'Interactive Frontend',
        description: 'Developing responsive web applications and user interfaces with modern JavaScript platforms.',
        tags: ['JavaScript', 'HTML5', 'CSS3'],
        runtime: 'Web Dev',
        palette: ocean,
      },
      {
        code: 'S03 E02',
        title: 'CRM & Cloud Deployment',
        description: 'End-to-end client delivery scopes: CRM configuration, workflows, domain setup, and cloud hosting.',
        tags: ['CRM Integration', 'Hosting', 'Client Scope'],
        runtime: 'Client Architecture',
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
    title: 'The Next Reel',
    period: 'Now Streaming',
    synopsis: 'Pushing the boundaries of generative cinema, autonomous creative pipelines, and interactive digital experiences.',
    episodes: [
      {
        code: 'S05 E01',
        title: 'Future Horizons',
        description: 'Advanced bilingual prompt engineering, consistent character pipelines, and next-generation interactive web experiences.',
        tags: ['Generative AI', 'Cinematic Systems', 'Interactive Web'],
        runtime: 'In Production',
        palette: violet,
      },
    ],
  },
];

export type TopPick = { label: string; title: string; detail: string; palette: Palette };

export const topPicks: TopPick[] = [
  { label: 'Primary Role', title: 'Creative & Tech Lead', detail: 'Zai Labs Private Limited • August 2026 – Present', palette: crimson },
  { label: 'AI Video Engine', title: 'Seedance 2.0 & Kling 3.0', detail: 'Multi-shot AI filmmaking with shot bibles', palette: amber },
  { label: 'Academic Credential', title: 'Kingston University', detail: 'Postgraduate Diploma (PGD) • London', palette: violet },
  { label: 'Prompt Mastery', title: 'Bilingual (EN+ZH)', detail: 'Structured prompts for character & environment consistency', palette: ocean },
  { label: 'Post-Production', title: 'DaVinci Resolve', detail: 'Beat-synced editorial & cinematic color grading', palette: crimson },
  { label: 'Motion Graphics', title: 'After Effects', detail: 'Compositing, visual effects & title animations', palette: violet },
  { label: 'Full Delivery', title: 'Web • CRM • Hosting', detail: 'Coordinated end-to-end client engagement at Zai Labs', palette: jade },
  { label: 'Visual Design', title: 'Adobe Illustrator & Photoshop', detail: 'Branded visual assets & typography systems', palette: amber },
  { label: 'Business Ops', title: 'Brand Documentation', detail: 'Standardized work orders, quotations & invoices', palette: ocean },
  { label: 'Team Leadership', title: 'Production Pipeline', detail: 'Coordinating creative & technical teams around shared workflows', palette: jade },
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
    lines: ['Multi-shot filmmaking pipeline from concept through post-production', 'Seedance 2.0, Kling 3.0, Higgsfield', 'Bilingual (EN+ZH) prompt engineering & shot bibles'],
    chips: ['Seedance 2.0', 'Kling 3.0', 'Higgsfield', 'Shot Bibles'],
  },
  {
    kicker: 'Post-Production',
    title: 'The Editorial Suite',
    lines: ['DaVinci Resolve, Adobe Premiere Pro & CapCut', 'Adobe After Effects for motion graphics & compositing', 'Beat-synced editing & match-cutting montages'],
    chips: ['DaVinci Resolve', 'Premiere Pro', 'After Effects'],
  },
  {
    kicker: 'Web Platform',
    title: 'Full-Scope Client Delivery',
    lines: ['Frontend development with HTML, CSS, JavaScript & modern frameworks', 'End-to-end CRM integration & hosting setup', 'Standardized formal business documentation'],
    chips: ['JavaScript', 'HTML5', 'CSS3', 'CRM', 'Hosting'],
  },
  {
    kicker: 'Creative Operations',
    title: 'Brand & Systems',
    lines: ['Adobe Illustrator & Photoshop for branded assets', 'Standardized work orders, quotations & invoices to brand template'],
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
    blurb: 'Web development, CRM, hosting & pipelines first',
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
  moments: { nav: 'Moments', card: 'Experience & Credentials', meta: `${achievements.length} Moments • ${certifications.length} Credentials`, palette: crimson },
  story: { nav: 'Resume', card: 'The Full Story', meta: 'Resume • View & download', palette: violet },
};
