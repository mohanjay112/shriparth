const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const targetStr = `                        <p class="about-lead">Hi, I'm Shriparth — a video editor who believes every cut is a choice, and
                            every choice tells a story.</p>
                        <p>I started with short films, documentaries, and college reels. Then I built my own YouTube
                            channel — <a href="https://youtube.com/@kahihihashrii" target="_blank" rel="noopener"
                                class="link-accent">Kahihi Ha Shri</a> — where I script, research, shoot, light, and
                            edit everything entirely by myself.</p>
                        <p>Video essays on cinema, culture, and the fictional characters that quietly ruin us.</p>
                        <blockquote class="about-quote">
                            "What drives me isn't software or technique — it's understanding what an edit is supposed to
                            feel like. Every project gets a different approach because every story deserves its own
                            rhythm."
                        </blockquote>`;

const replaceStr = `                        <p class="about-lead">Hi — Shriparth here. Editor by trade, cinephile by diagnosis. I believe every cut is a choice, and most days I overthink each one.</p>
                        <p>Started with short films, documentaries, and the kind of college reels nobody asked for but everyone watched. Eventually built my own corner of YouTube — <a href="https://youtube.com/@kahihihashrii" target="_blank" rel="noopener" class="link-accent">Kahihi Ha Shri</a> — where I script, shoot, light, color, score, and edit every video myself. (Yes, all of it. No, I don't sleep enough.)</p>
                        <p>It's mostly video essays on cinema, culture, and the fictional characters who quietly ruin us.</p>
                        <blockquote class="about-quote">
                            "What drives me isn't software or technique — those are negotiable. It's the moment at 02:14 when the cut lands and your chest does the thing. Every story has a rhythm. My job is finding it before the render queue does."
                        </blockquote>`;

html = html.replace(targetStr, replaceStr);

fs.writeFileSync('index.html', html);
console.log("Done");
