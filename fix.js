const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Remove EST. 2019
html = html.replace(/<span class="img-badge">EST\. 2019<\/span>\r?\n\s*/g, '');

// Remove all review badges
html = html.replace(/<span class="review-badge[^"]*">.*?<\/span>\r?\n\s*/g, '');

// Fix mailto links in About and Philosophy sections to have specific classes for hover
html = html.replace(/class="btn primary"/g, 'class="btn primary custom-mail-btn"');
html = html.replace(/<a href="mailto:shriparthc05@gmail.com" style="color: var\(--yellow-soft\);/g, '<a href="mailto:shriparthc05@gmail.com" class="custom-mail-link" style="color: var(--yellow-soft);');

// Add styles before </style>
const styleToAdd = `
        /* Custom hover for mail buttons */
        .custom-mail-btn:hover {
            color: var(--ink) !important;
            background: var(--yellow-soft) !important;
            border-color: var(--yellow-soft) !important;
        }
        .custom-mail-link:hover {
            color: var(--paper) !important;
            border-bottom-color: var(--paper) !important;
        }
`;
html = html.replace('</style>', styleToAdd + '</style>');

fs.writeFileSync('index.html', html);
console.log("Done");
