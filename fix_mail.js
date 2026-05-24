const fs = require('fs');
let html = fs.readFileSync('d:/projects/shriparth/index.html', 'utf8');
html = html.replace(/href="mailto:shriparthc05@gmail\.com"/g, 'href="https://mail.google.com/mail/?view=cm&fs=1&to=shriparthc05@gmail.com" target="_blank"');
fs.writeFileSync('d:/projects/shriparth/index.html', html);
console.log('done');
