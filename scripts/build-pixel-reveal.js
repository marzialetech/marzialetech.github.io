#!/usr/bin/env node
/**
 * Inlines logo (martechtext), angel-silhouette-pixelated.svg, and man on boat (two-figures-pixelated.svg).
 * Logo at top, then ample vertical space, then man on boat (left) and angel (right) with ample horizontal gap.
 * Page filled heartily; white bg, blue pixels. Responsive.
 * Run: node build-pixel-reveal.js
 */

const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname);
const angelSvg = fs.readFileSync(path.join(dir, 'angel-silhouette-pixelated.svg'), 'utf8');
fs.writeFileSync(path.join(dir, 'favicon.svg'), angelSvg.replace(/fill="currentColor"/, 'fill="#fff"'), 'utf8');
const manOnBoatSvg = fs.readFileSync(path.join(dir, 'two-figures-pixelated.svg'), 'utf8');
const martechSvg = fs.readFileSync(path.join(dir, 'martechtext-pixelated.svg'), 'utf8');
const cursorSvg = fs.readFileSync(path.join(dir, 'cursor.svg'), 'utf8');
const cursorDataUrl = 'data:image/svg+xml,' + encodeURIComponent(cursorSvg);

function stripXmlDeclaration(text) {
  return text.replace(/^\s*<\?xml[\s\S]*?\?>\s*/i, '').trim();
}

const angelInline = stripXmlDeclaration(angelSvg);
const manOnBoatInline = stripXmlDeclaration(manOnBoatSvg);
const martechInline = stripXmlDeclaration(martechSvg);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>marziale</title>
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            height: 100vh;
            overflow: hidden;
            background: #2563eb;
            color: #fff;
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0;
            cursor: url("${cursorDataUrl}") 8 2, auto;
        }
        .header {
            width: 100%;
            display: flex;
            justify-content: center;
            padding: clamp(1.5rem, 5vw, 3rem) clamp(0.75rem, 4vw, 2rem);
        }
        .header svg {
            display: block;
            width: 100%;
            max-width: 85vw;
            height: auto;
            object-fit: contain;
        }
        .header rect,
        .stage rect {
            opacity: 0;
            fill: currentColor;
        }
        .stage {
            flex: 1;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: clamp(2.5rem, 6vw, 5rem);
            justify-items: center;
            align-items: start;
            width: 100%;
            max-width: 3200px;
            padding: clamp(2rem, 8vw, 6rem) clamp(0.75rem, 4vw, 2rem) clamp(1rem, 3vw, 2rem);
            margin: -10vh auto 0 auto;
        }
        .stage .figure {
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .stage .figure:nth-child(1) {
            margin-top: clamp(5rem, 14vw, 10rem);
        }
        .stage .figure:nth-child(2) {
            margin-top: 0;
        }
        .stage .figure svg {
            display: block;
            width: 100%;
            max-width: min(50vw, 1600px);
            height: auto;
            object-fit: contain;
        }
        .reel {
            width: 100%;
            border-top: 2px solid #fff;
            border-bottom: 2px solid #fff;
            background: transparent;
            padding: clamp(0.5rem, 1.5vw, 1rem) 0;
            overflow: hidden;
            flex-shrink: 0;
            margin-bottom: clamp(0.75rem, 2vw, 1.5rem);
        }
        .reel-track {
            display: flex;
            animation: marquee 25s linear infinite;
            width: max-content;
        }
        .reel-set {
            display: flex;
            gap: clamp(2rem, 5vw, 4rem);
            flex-shrink: 0;
        }
        .reel-set span,
        .reel-set img {
            display: block;
            height: clamp(1.25rem, 3vw, 2rem);
            width: auto;
            max-width: clamp(4rem, 12vw, 8rem);
            object-fit: contain;
        }
        .reel-set img {
            /* SVGs are white on transparent */
        }
        @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }
        @media (max-width: 700px) {
            body {
                padding-top: 15vh;
            }
            .header {
                padding: clamp(0.75rem, 2vw, 1.5rem) clamp(0.5rem, 2vw, 1rem);
            }
            .stage {
                flex: 1;
                gap: clamp(0.25rem, 1vw, 0.75rem);
                padding: 0 clamp(0.25rem, 1vw, 0.5rem) clamp(0.5rem, 2vw, 1rem);
                align-items: start;
                margin-top: 0;
            }
            .stage .figure svg {
                max-width: 60vw;
            }
            .stage .figure:nth-child(1) {
                align-self: center;
                margin-top: clamp(4rem, 12vw, 8rem);
            }
            .stage .figure:nth-child(2) {
                align-self: start;
                margin-top: clamp(1rem, 4vw, 2rem);
            }
        }
    </style>
</head>
<body>
    <header class="header" id="figMartech">
${martechInline}
    </header>
    <div class="stage">
        <div class="figure" id="figManOnBoat">
${manOnBoatInline}
        </div>
        <div class="figure" id="figAngel">
${angelInline}
        </div>
    </div>

    <div class="reel">
        <div class="reel-track">
            <div class="reel-set">
                <img src="client-shue.svg" alt="SHUE"/>
                <img src="client-pixamation.svg" alt="PIXAMATION Inc."/>
                <img src="client-redbarn.svg" alt="RED BARN MEATS"/>
                <img src="client-blizzard.svg" alt="the BLIZZARD"/>
                <img src="client-moose.svg" alt="HOMETOWN COUNTRY MOOSE"/>
            </div>
            <div class="reel-set">
                <img src="client-shue.svg" alt="SHUE"/>
                <img src="client-pixamation.svg" alt="PIXAMATION Inc."/>
                <img src="client-redbarn.svg" alt="RED BARN MEATS"/>
                <img src="client-blizzard.svg" alt="the BLIZZARD"/>
                <img src="client-moose.svg" alt="HOMETOWN COUNTRY MOOSE"/>
            </div>
        </div>
    </div>

    <script>
(function () {
    const DURATION_MS = 5000;
    const figAngel = document.getElementById('figAngel');
    const figManOnBoat = document.getElementById('figManOnBoat');
    const figMartech = document.getElementById('figMartech');

    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    var allRects = [];
    var revealTimes = [];
    var animationId = null;

    function hideAll() {
        allRects.forEach(function (r) { r.style.opacity = '0'; });
    }

    function runReveal() {
        if (animationId != null) cancelAnimationFrame(animationId);
        hideAll();
        for (var i = 0; i < allRects.length; i++) revealTimes[i] = (DURATION_MS * i) / allRects.length;
        var start = performance.now();
        function tick(now) {
            var elapsed = now - start;
            for (var i = 0; i < allRects.length; i++) {
                if (revealTimes[i] <= elapsed) allRects[i].style.opacity = '1';
            }
            if (elapsed < DURATION_MS) animationId = requestAnimationFrame(tick);
            else animationId = null;
        }
        animationId = requestAnimationFrame(tick);
    }

    function start() {
        var martechRects = Array.from(figMartech.querySelectorAll('rect'));
        var angelRects = Array.from(figAngel.querySelectorAll('rect'));
        var manOnBoatRects = Array.from(figManOnBoat.querySelectorAll('rect'));
        if (martechRects.length === 0 && angelRects.length === 0 && manOnBoatRects.length === 0) return;
        allRects = shuffle(martechRects.concat(angelRects).concat(manOnBoatRects));
        revealTimes = [];
        hideAll();
        setTimeout(runReveal, 150);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
    <\/script>
</body>
</html>
`;

fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
console.log('Wrote index.html (logo + angel + man on boat, filled layout, ample spacing).');
