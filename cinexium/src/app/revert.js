const fs = require('fs');
const glob = require('glob');

const files = [
  'd:/PROJECTS/001/cinexium/cinexium/src/app/login/page.tsx',
  'd:/PROJECTS/001/cinexium/cinexium/src/app/register/page.tsx',
  'd:/PROJECTS/001/cinexium/cinexium/src/app/verify-otp/page.tsx',
  'd:/PROJECTS/001/cinexium/cinexium/src/app/notifications/page.tsx',
  'd:/PROJECTS/001/cinexium/cinexium/src/app/premium/page.tsx',
  'd:/PROJECTS/001/cinexium/cinexium/src/app/premium/pay/page.tsx',
  'd:/PROJECTS/001/cinexium/cinexium/src/app/search/page.tsx',
  'd:/PROJECTS/001/cinexium/cinexium/src/app/terms/page.tsx',
  'd:/PROJECTS/001/cinexium/cinexium/src/app/privacy/page.tsx',
  'd:/PROJECTS/001/cinexium/cinexium/src/app/contact/page.tsx',
  'd:/PROJECTS/001/cinexium/cinexium/src/app/guidelines/page.tsx'
];

const settingsFiles = require('glob').sync('d:/PROJECTS/001/cinexium/cinexium/src/app/settings/**/page.tsx');
const chatFiles = require('glob').sync('d:/PROJECTS/001/cinexium/cinexium/src/app/chat/**/page.tsx');

const allFiles = [...files, ...settingsFiles, ...chatFiles];

for (const file of allFiles) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    const regex = /import type \{ Metadata \} from "next";\s+export const metadata: Metadata = \{[\s\S]*?\};\s+/;
    if (regex.test(content)) {
      content = content.replace(regex, '');
      fs.writeFileSync(file, content);
    }
  }
}
console.log('Reverted metadata injections.');
