(function () {
    const cfg = document.currentScript.dataset;
    const guide = 'guide' in cfg;
    const tech = cfg.tgTech || 'https://t.me/arsinioum';
    const live = cfg.tgLive || 'https://t.me/+oju8lTGAetsxOWJi';

    const ink = 'var(--ink, #1c1200)';
    const bg = 'var(--bg, orange)';

    document.head.insertAdjacentHTML('beforeend', `<style>
        footer {
            position: fixed;
            bottom: 1em;
            left: 50%;
            transform: translateX(-50%);
            width: auto;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0.5em;
            padding: 0 1em;
            z-index: 10;
        }

        footer .box40 {
            width: 40px;
            height: 40px;
            fill: ${ink};
        }

        footer .tg, footer .question-mark {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1px;
            width: 40px;
            height: 40px;
            border-radius: var(--radius, 8px);
            background: ${ink};
            color: ${bg};
            text-decoration: none;
            cursor: pointer;
        }

        footer .tg svg {
            width: 20px;
            height: 20px;
            fill: ${bg};
        }

        footer .tg-label {
            font-family: sans-serif;
            font-size: 0.55rem;
            line-height: 1;
            letter-spacing: 0.04em;
        }

        footer .guide-nav {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0 10px;
            display: none;
            transition: transform 0.1s ease;
            user-select: none;
            align-items: center;
            justify-content: center;
            height: 40px;
            flex-shrink: 0;
        }

        footer .guide-nav svg {
            display: block;
            fill: ${ink};
        }

        footer .guide-nav:active {
            transform: scale(0.85);
        }

        footer #icon-question {
            fill: ${bg};
        }

        footer #icon-x {
            display: none;
            stroke: ${bg};
        }

        body.tutorial-on footer #icon-question {
            display: none;
        }

        body.tutorial-on footer #icon-x {
            display: block;
        }

        body.tutorial-on footer .guide-nav {
            display: flex;
        }

        @media screen and (max-width: 200px), screen and (max-height: 200px) {
            footer {
                display: none;
            }
        }
    </style>`);

    const tg = (href, label) => `<a class="tg" href="${href}" target="_blank" aria-label="Telegram ${label} channel"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.27 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg><span class="tg-label">${label}</span></a>`;

    const nav = (id, d, label) => `<button class="guide-nav" id="${id}" aria-label="${label}"><svg height="40" width="40" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg></button>`;

    const github = cfg.repo ? `<a class="box40" href="${cfg.repo}" target="_blank" aria-label="Source on GitHub"><svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 25 25"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-4.466 19.59c-.405.078-.534-.171-.534-.384v-2.195c0-.747-.262-1.233-.55-1.481 1.782-.198 3.654-.875 3.654-3.947 0-.874-.312-1.588-.823-2.147.082-.202.356-1.016-.079-2.117 0 0-.671-.215-2.198.82-.64-.18-1.324-.267-2.004-.271-.68.003-1.364.091-2.003.269-1.528-1.035-2.2-.82-2.2-.82-.434 1.102-.16 1.915-.077 2.118-.512.56-.824 1.273-.824 2.147 0 3.064 1.867 3.751 3.645 3.954-.229.2-.436.552-.508 1.07-.457.204-1.614.557-2.328-.666 0 0-.423-.768-1.227-.825 0 0-.78-.01-.055.487 0 0 .525.246.889 1.17 0 0 .463 1.428 2.688.944v1.489c0 .211-.129.459-.528.385-3.18-1.057-5.472-4.056-5.472-7.59 0-4.419 3.582-8 8-8s8 3.581 8 8c0 3.533-2.289 6.531-5.466 7.59z"/></svg></a>` : '';

    const question = guide ? `<span class="question-mark"><svg id="icon-question" height="40" width="40" viewBox="0 0 29.536 29.536" xmlns="http://www.w3.org/2000/svg"><path d="M14.385,19.337c-1.338,0-2.289,0.951-2.289,2.34c0,1.336,0.926,2.339,2.289,2.339c1.414,0,2.314-1.003,2.314-2.339 C16.672,20.288,15.771,19.337,14.385,19.337z"/><path d="M14.742,6.092c-1.824,0-3.34,0.513-4.293,1.053l0.875,2.804c0.668-0.462,1.697-0.772,2.545-0.772 c1.285,0.027,1.879,0.644,1.879,1.543c0,0.85-0.67,1.697-1.494,2.701c-1.156,1.364-1.594,2.701-1.516,4.012l0.025,0.669h3.42 v-0.463c-0.025-1.158,0.387-2.162,1.311-3.215c0.979-1.08,2.211-2.366,2.211-4.321C19.705,7.968,18.139,6.092,14.742,6.092z"/></svg><svg id="icon-x" height="40" width="40" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><path d="M7 7l10 10M17 7l-10 10"/></svg></span>` : '';

    const prev = guide ? nav('guidePrev', 'M22,11 H5.41 l5.3,-5.29 A1,1 0 1,0 9.29,4.29 l-7,7 a1,1 0 0,0 0,1.42 l7,7 a1,1 0 0,0 1.42,-1.42 L5.41,13 H22 a1,1 0 0,0 0,-2 Z', 'Previous step') : '';
    const next = guide ? nav('guideNext', 'M2,11 H18.59 l-5.3,-5.29 A1,1 0 1,1 14.71,4.29 l7,7 a1,1 0 0,1 0,1.42 l-7,7 a1,1 0 0,1 -1.42,-1.42 L18.59,13 H2 a1,1 0 0,1 0,-2 Z', 'Next step') : '';

    document.body.insertAdjacentHTML('beforeend', `<footer>${prev}${github}${tg(tech, 'tech')}${tg(live, 'live')}${question}${next}</footer>`);
})();