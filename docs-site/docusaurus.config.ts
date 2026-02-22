import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Nido Documentation',
  tagline: 'Ecovilla Community Platform',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://v0-community-app-project-oib6-ac6vfephz.vercel.app',
  baseUrl: '/',

  // GitHub pages deployment config.
  organizationName: 'mjcr88',
  projectName: 'v0-community-app-project',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    localeConfigs: {
      en: { label: 'English' },
      es: { label: 'Español' },
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // editUrl: 'https://github.com/...',
        },
        blog: {
          showReadingTime: true,
          // editUrl: 'https://github.com/...',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'Nido Docs',
      logo: {
        alt: 'Nido Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'guidesSidebar',
          position: 'left',
          label: 'Guides',
        },
        {
          type: 'docSidebar',
          sidebarId: 'developersSidebar',
          position: 'left',
          label: 'Developers',
        },
        {
          type: 'docSidebar',
          sidebarId: 'featuresSidebar',
          position: 'left',
          label: 'Features',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Residents', to: '/docs/guides/residents/intro' },
            { label: 'Admins', to: '/docs/guides/admins/intro' },
            { label: 'API Reference', to: '/docs/developers/api/intro' },
          ],
        },
        {
          title: 'Community',
          items: [
            // Community links to be added later
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Nido Platform. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
