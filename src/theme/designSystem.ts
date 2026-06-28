export const designTokens = {
  colors: {
    primary: "#e11d48",
    primaryBright: "#fb3a63",
    secondary: "#f59e0b",
    secondaryBright: "#fbbf24",
    bg: "#0e090b",
    bgElevated: "#140d0f",
    surface: "#1a1113",
    surface2: "#221619",
    surface3: "#2b1c20",
    text: "#f6ece9",
    textMuted: "#b9a6a4",
    textFaint: "#7c6a6c",
    line: "#36262b",
    lineStrong: "#4a3036",
    good: "#34d399",
    warn: "#fbbf24",
    bad: "#fb7185",
    info: "#38bdf8",
  },
  fonts: {
    sans: '"Satoshi", ui-sans-serif, system-ui, sans-serif',
    display: '"Lato", "Satoshi", ui-sans-serif, sans-serif',
    mono: '"Sora", ui-monospace, monospace',
  },
  fontSizes: {
    xs: "12px",
    sm: "14px",
    md: "16px",
    lg: "18px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "30px",
    "4xl": "36px",
  },
  fontWeights: {
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900,
  },
  spacing: {
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
    8: "32px",
    10: "40px",
    12: "48px",
  },
  radius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    pill: "999px",
  },
  shadows: {
    card: "0 18px 40px -24px rgba(225, 29, 72, 0.45)",
    glass: "0 24px 48px -12px rgba(0, 0, 0, 0.55)",
    overlay: "0 30px 80px -24px rgba(0, 0, 0, 0.62)",
  },
  zIndex: {
    base: 1,
    sticky: 30,
    drawer: 50,
    toast: 60,
  },
  breakpoints: {
    mobileSmall: "390px",
    mobileLarge: "430px",
    tablet: "768px",
    laptop: "1024px",
    desktop: "1280px",
    wide: "1440px",
  },
  animations: {
    fast: "0.2s ease",
    base: "0.25s ease",
    slow: "0.4s cubic-bezier(0.22, 1, 0.36, 1)",
    button: "transform 0.2s ease, filter 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
    panel: "opacity 0.25s ease, transform 0.25s ease",
    drawer: "slidein 0.25s ease",
    backdrop: "fade 0.2s ease",
  },
} as const;

export const typographySystem = {
  fontFamily: {
    headings: designTokens.fonts.display,
    body: designTokens.fonts.sans,
    ui: designTokens.fonts.sans,
    metrics: designTokens.fonts.mono,
  },
  headingSizes: {
    h1: "36px / 1.15 / -0.03em / 900",
    h2: "24px / 1.2 / -0.02em / 700",
    h3: "20px / 1.25 / -0.01em / 700",
    h4: "18px / 1.3 / 0 / 700",
  },
  paragraphSizes: {
    body: "16px / 1.5 / 0 / 500",
    support: "14px / 1.5 / 0 / 500",
    caption: "12px / 1.45 / 0 / 500",
  },
  buttonText: {
    primary: "14px / 1 / 0 / 700",
    large: "16px / 1 / 0 / 700",
    chip: "12px / 1 / 0 / 600",
  },
} as const;

export const componentStyleNotes = {
  buttons: "Gradient primary button, bordered secondary/outline, ghost hover wash, danger uses translucent rose fill.",
  cards: "Warm glass panels with 16px radius, thin muted borders, subtle ruby shadow on hover.",
  navbar: "Sticky top bar with translucent base blur, thin bottom border, restrained copy scale.",
  sidebar: "64px brand rail, stacked grouped nav, gradient-selected active item, pod identity card near top.",
  forms: "Surface-2 inputs, 12px radius, ruby focus ring, muted labels at 12px.",
  modals: "Right-side drawer with dark backdrop blur, 250ms slide-in, bordered header/footer.",
  dropdowns: "Compact border box, soft surface fill, hover row highlight, small chevron affordance.",
  tabs: "Underline activation with thin border, low-noise inactive state.",
  badges: "Rounded pills with tone-tinted backgrounds and 12px text.",
  tables: "Card-contained rows, surface striping by elevation rather than heavy grid lines.",
  heroSections: "Editorial heading + dense metrics + atmospheric background glow or mapped visual.",
  footer: "Low-contrast microcopy framed by top border.",
} as const;

export const layoutSystem = {
  pageWidth: "max-width: 80rem (Tailwind max-w-7xl)",
  gridStructure: "1-col mobile, 2-col at 420px for stat grids, 3-col and 4-col on larger breakpoints",
  sectionPadding: "16px mobile, 24px tablet, 32px desktop",
  cardGaps: "12px default, 16px feature areas",
  alignment: "Left-aligned content with wrap-safe action rows",
  containerMaxWidth: "80rem centered content column inside app shell",
  mobileStacking: "Sidebar becomes overlay drawer; cards stack vertically; dense charts drop below summaries",
} as const;

export const interactionBehavior = {
  hoverEffects: "Cards lift by 2px and gain ruby-tinted shadow; buttons brighten slightly; nav rows tint on hover.",
  clickStates: "Primary buttons depress back to resting Y position; toggle chips invert fill when selected.",
  focusStates: "Universal base-colored inner ring plus ruby outer ring.",
  loadingStates: "Spinner icons and shimmer utility for skeleton strips.",
  pageTransitions: "No route-wide transitions; emphasis is on sticky chrome and panel motion.",
  scrollAnimations: "Limited to subtle sticky panels and overflow reveal, not theatrical scroll scenes.",
  dropdownAnimation: "Simple opacity/open reveal via presence toggle.",
  modalOpeningAnimation: "Backdrop fade 0.2s ease + drawer slide-in 0.25s ease.",
  buttonPressEffect: "TranslateY from -1px hover to 0 on active.",
} as const;

export const responsiveBehavior = [
  { width: "1440px", behavior: "Dashboards breathe into wider three-column compositions with persistent side rails and spacious hero cards." },
  { width: "1280px", behavior: "Standard desktop target: full sidebar, max-w-7xl content, mixed 3-col and 4-col stat layouts." },
  { width: "1024px", behavior: "Sidebar remains fixed, but large layouts collapse from 3 columns to 2 where needed." },
  { width: "768px", behavior: "Tablet switches to simpler stacked sections, more wrapped action rows, and tighter chart heights." },
  { width: "430px", behavior: "Stat cards use 2-column micro-grid; dense controls wrap; drawers stay full-height." },
  { width: "390px", behavior: "Single-column content priority, reduced subtitle density, mobile nav drawer carries primary navigation." },
] as const;

export const assetInventory = {
  icons: "lucide-react outline icons with consistent 16–20px sizing",
  illustrations: "None bespoke; emphasis is on gradients, charts, and map-based visuals",
  logos: ["logo.svg", "caarya-logo-horizontal.svg", "favicon.svg"],
  backgrounds: ["India map backdrop", "radial ruby/amber glows", "surface grid pattern"],
  gradients: ["ruby to amber actions", "ruby haze overlays", "muted editorial background blends"],
  patterns: ["surface-grid utility"],
  svgs: ["india-map.svg", "brand logo svgs"],
  lottie: "None in source app",
  images: ["crew-cher-ami.png", "crew-togo.png", "crew-wojtek.png", "crew-yoshi.png"],
} as const;
