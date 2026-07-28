const fs = require('fs');
const files = [
  {
    path: 'd:/PROJECTS/001/cinexium/cinexium/src/app/search/page.tsx',
    title: 'Search - Cinexium',
    desc: 'Search for movies and TV shows on Cinexium.',
    url: 'https://cinexium.site/search'
  },
  {
    path: 'd:/PROJECTS/001/cinexium/cinexium/src/app/terms/page.tsx',
    title: 'Terms of Service - Cinexium',
    desc: 'Read the terms of service for Cinexium.',
    url: 'https://cinexium.site/terms'
  },
  {
    path: 'd:/PROJECTS/001/cinexium/cinexium/src/app/privacy/page.tsx',
    title: 'Privacy Policy - Cinexium',
    desc: 'Read the privacy policy for Cinexium.',
    url: 'https://cinexium.site/privacy'
  },
  {
    path: 'd:/PROJECTS/001/cinexium/cinexium/src/app/contact/page.tsx',
    title: 'Contact Us - Cinexium',
    desc: 'Get in touch with the Cinexium team.',
    url: 'https://cinexium.site/contact'
  },
  {
    path: 'd:/PROJECTS/001/cinexium/cinexium/src/app/guidelines/page.tsx',
    title: 'Community Guidelines - Cinexium',
    desc: 'Read the community guidelines for Cinexium.',
    url: 'https://cinexium.site/guidelines'
  }
];

for (const { path: p, title, desc, url } of files) {
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    if (!content.includes('export const metadata')) {
      const meta = 'import type { Metadata } from \"next\";\n\nexport const metadata: Metadata = {\n  title: \"' + title + '\",\n  description: \"' + desc + '\",\n  alternates: { canonical: \"' + url + '\" },\n  openGraph: { title: \"' + title + '\", description: \"' + desc + '\", url: \"' + url + '\" },\n};\n';
      fs.writeFileSync(p, meta + '\n' + content);
    }
  }
}
console.log('Done');
