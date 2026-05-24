const fs = require('fs');
let lines = fs.readFileSync('index.html', 'utf8').split('\n');

lines[377] = `                        <p>Started with short films, documentaries, and the kind of college reels nobody asked for but everyone watched. Eventually built my own corner of YouTube — <a href="https://youtube.com/@kahihihashrii" target="_blank" rel="noopener" class="link-accent">Kahihi Ha Shri</a> — where I script, shoot, light, color, score, and edit every video myself. (Yes, all of it. No, I don't sleep enough.)</p>`;
lines[378] = '';
lines[379] = '';
lines[380] = '';

lines[382] = `                        <blockquote class="about-quote">`;
lines[383] = `                            "What drives me isn't software or technique — those are negotiable. It's the moment at 02:14 when the cut lands and your chest does the thing. Every story has a rhythm. My job is finding it before the render queue does."`;
lines[384] = `                        </blockquote>`;
lines[385] = '';
lines[386] = '';

fs.writeFileSync('index.html', lines.join('\n'));
console.log("Replaced using line indices!");
