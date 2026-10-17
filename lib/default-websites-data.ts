export interface DefaultPreaddedWebsite {
  id: string;
  url: string;
  normalizedUrl: string;
  domain: string;
  title: string;
  description: string;
  faviconUrl: string;
  ogImageUrl: string;
  tags: string[];
}

export const DEFAULT_PREADDED_WEBSITES: DefaultPreaddedWebsite[] = [
  {
    id: "default-site-github",
    url: "https://github.com",
    normalizedUrl: "https://github.com",
    domain: "github.com",
    title: "GitHub",
    description: "Platform for software development, collaboration, and version control.",
    faviconUrl: "https://github.githubassets.com/favicons/favicon.svg",
    ogImageUrl: "https://github.githubassets.com/images/modules/open_graph/github-logo.png",
    tags: ["Code", "Git", "Developer", "Open Source"],
  },
  {
    id: "default-site-opencode",
    url: "https://opencode.ai",
    normalizedUrl: "https://opencode.ai",
    domain: "opencode.ai",
    title: "OpenCode",
    description: "AI coding assistant and modern workspace for developers and teams.",
    faviconUrl: "https://opencode.ai/favicon-96x96-v3.png",
    ogImageUrl: "https://opencode.ai/social-share.png",
    tags: ["AI", "Coding", "Assistant", "Productivity"],
  },
  {
    id: "default-site-vscode",
    url: "https://code.visualstudio.com",
    normalizedUrl: "https://code.visualstudio.com",
    domain: "code.visualstudio.com",
    title: "Visual Studio Code",
    description: "Free, open source code editor refined and optimized for modern web and cloud applications.",
    faviconUrl: "https://code.visualstudio.com/favicon.ico",
    ogImageUrl: "https://code.visualstudio.com/opengraphimg/opengraph-home.png",
    tags: ["Editor", "IDE", "Developer", "Microsoft"],
  },
  {
    id: "default-site-figma",
    url: "https://figma.com",
    normalizedUrl: "https://figma.com",
    domain: "figma.com",
    title: "Figma",
    description: "The collaborative interface design tool for modern product teams and creators.",
    faviconUrl: "https://static.figma.com/app/icon/1/favicon.ico",
    ogImageUrl: "https://s0.wp.com/mshots/v1/https%3A%2F%2Ffigma.com?w=800",
    tags: ["Design", "UI", "UX", "Prototyping"],
  },
  {
    id: "default-site-nextjs",
    url: "https://nextjs.org",
    normalizedUrl: "https://nextjs.org",
    domain: "nextjs.org",
    title: "Next.js",
    description: "The React framework for the web by Vercel, enabling fast full-stack applications.",
    faviconUrl: "https://nextjs.org/favicon.ico",
    ogImageUrl: "https://h8dxkfmaphn8o0p3.public.blob.vercel-storage.com/nextjs/twitter-card.png",
    tags: ["React", "Framework", "Fullstack", "Web"],
  },
];
