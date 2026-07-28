const fs = require('fs');
const path = require('path');

const generateLayout = (title, desc, url, index = true) => {
  const robots = index ? '' : ',\n  robots: { index: false, follow: false }';
  return 'import type { Metadata } from \"next\";\n\nexport const metadata: Metadata = {\n  title: \"' + title + '\",\n  description: \"' + desc + '\",\n  alternates: { canonical: \"' + url + '\" },\n  openGraph: { title: \"' + title + '\", description: \"' + desc + '\", url: \"' + url + '\" }' + robots + ',\n};\n\nexport default function Layout({ children }: { children: React.ReactNode }) {\n  return children;\n}\n';
}

const pages = [
  { dir: 'search', title: 'Search - Cinexium', desc: 'Search for movies and TV shows on Cinexium.', url: 'https://cinexium.site/search', index: true },
  { dir: 'terms', title: 'Terms of Service - Cinexium', desc: 'Read the terms of service for Cinexium.', url: 'https://cinexium.site/terms', index: true },
  { dir: 'privacy', title: 'Privacy Policy - Cinexium', desc: 'Read the privacy policy for Cinexium.', url: 'https://cinexium.site/privacy', index: true },
  { dir: 'contact', title: 'Contact Us - Cinexium', desc: 'Get in touch with the Cinexium team.', url: 'https://cinexium.site/contact', index: true },
  { dir: 'guidelines', title: 'Community Guidelines - Cinexium', desc: 'Read the community guidelines for Cinexium.', url: 'https://cinexium.site/guidelines', index: true },
  
  { dir: 'login', title: 'Login - Cinexium', desc: 'Login to your Cinexium account.', url: 'https://cinexium.site/login', index: false },
  { dir: 'register', title: 'Register - Cinexium', desc: 'Create a new Cinexium account.', url: 'https://cinexium.site/register', index: false },
  { dir: 'verify-otp', title: 'Verify OTP - Cinexium', desc: 'Verify your email address.', url: 'https://cinexium.site/verify-otp', index: false },
  
  { dir: 'settings', title: 'Settings - Cinexium', desc: 'Manage your Cinexium account settings.', url: 'https://cinexium.site/settings', index: false },
  { dir: 'notifications', title: 'Notifications - Cinexium', desc: 'View your notifications.', url: 'https://cinexium.site/notifications', index: false },
  { dir: 'premium', title: 'Premium - Cinexium', desc: 'Upgrade to Cinexium Premium.', url: 'https://cinexium.site/premium', index: false }
];

for (const p of pages) {
  const dirPath = path.join('d:/PROJECTS/001/cinexium/cinexium/src/app', p.dir);
  if (fs.existsSync(dirPath)) {
    fs.writeFileSync(path.join(dirPath, 'layout.tsx'), generateLayout(p.title, p.desc, p.url, p.index));
  }
}
console.log('Layouts generated successfully.');
