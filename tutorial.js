const TUTORIAL_TYPE_MS = 55;
const TUTORIAL_GAP = 52;
const TUTORIAL_PAUSE = 900;
const TUTORIAL_BEAT = 260;
const TUTORIAL_ARROW_MS = 500;
const TUTORIAL_FADE = 280;
const TUTORIAL_ERASE_MS = 26;

const TUTORIAL_STEPS = {

    'date-math': {
        input_1: '22.11.1996',
        input_2: '33y',
        tips: {
            start: [
                {target: 'input-1', side: 'above', text: 'Any date, written the way you already write dates'},
                {target: 'input-2', side: 'right', text: 'How far to jump: 33y, 2M, 10 days, 3 sec'}
            ],
            typed: [
                {target: 'input-2', side: 'below', text: 'Cursor in either field, then Enter'}
            ],
            result: [
                {target: 'result', side: 'below', text: 'The exact date, weekday and month included'}
            ]
        }
    },

    'subtract': {
        input_1: '22.11.1996',
        input_2: '-4 weeks 4 days',
        tips: {
            start: [
                {target: 'input-2', side: 'right', text: 'Stack units together. A minus turns the whole thing backwards'}
            ],
            result: [
                {target: 'result', side: 'below', text: '4 weeks and 4 days earlier'}
            ]
        }
    },

    'duration': {
        input_1: '22.11.1996',
        input_2: '18.11.2115',
        tips: {
            start: [
                {target: 'input-2', side: 'right', text: 'Put a second date here instead of a unit'}
            ],
            result: [
                {target: 'result', side: 'below', text: 'Now the answer is the distance between them'}
            ]
        }
    },

    'total-days': {
        input_1: '10.01.2026',
        input_2: '10.02.2026',
        action: 'click-result',
        tips: {
            result: [
                {target: 'result', side: 'below', text: 'Click a duration to also get it in plain days'}
            ],
            after: [
                {target: 'result', side: 'below', text: 'Handy when months and weeks only get in the way'}
            ]
        }
    },

    'words': {
        input_1: 'now',
        input_2: 'next friday',
        tips: {
            start: [
                {target: 'input-1', side: 'above', text: 'Plain words work too: now, today, tomorrow'},
                {target: 'input-2', side: 'right', text: 'next friday, last monday, in 3 weeks'}
            ],
            result: [
                {target: 'timezone', side: 'below', text: 'Everything is counted in your own timezone, shown right here'}
            ]
        }
    },

    'share': {
        input_1: '22.11.1996',
        input_2: '33y',
        action: 'flash-copy',
        tips: {
            result: [
                {target: 'share', side: 'right', text: 'Copies a link with both fields baked in'}
            ],
            after: [
                {target: 'share', side: 'right', text: 'Whoever opens it lands on this exact answer'}
            ]
        }
    },

    'calendar': {
        input_1: 'today',
        input_2: '111d',
        tips: {
            result: [
                {target: 'calendar', side: 'right', text: 'When the answer is a date, drop it straight into Google Calendar'},
                {target: 'result', side: 'below', text: 'It only shows up for dates, never for durations'}
            ]
        }
    }

};

const TUTORIAL_ORDER = ['date-math', 'subtract', 'duration', 'total-days', 'words', 'share', 'calendar'];

let tutorialActive = false;
let tutorialIndex = -1;
let tutorialToken = 0;
let tutorialTimers = [];
let tutorialTips = [];
let tutorialLeaving = [];

const tutorialReduced = function () {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const tutorialWait = function (ms) {
    return new Promise(resolve => {
        tutorialTimers.push(window.setTimeout(resolve, tutorialReduced() ? Math.min(ms, 120) : ms));
    });
};

const tutorialStale = function (token) {
    return token !== tutorialToken;
};

const tutorialCancel = function () {
    tutorialToken = tutorialToken + 1;
    tutorialTimers.forEach(id => window.clearTimeout(id));
    tutorialTimers = [];
};

const tutorialInputs = function () {
    return Array.from(document.getElementsByClassName('input'));
};

const tutorialTarget = function (name) {

    let inputs = tutorialInputs();

    if (name === 'input-1') {
        return inputs[0];
    }

    if (name === 'input-2') {
        return inputs[1];
    }

    if (name === 'share') {
        return document.getElementById('share-btn');
    }

    if (name === 'calendar') {
        return document.getElementById('calendar-btn');
    }

    return document.getElementById(name);
};


const tutorialLayer = function () {
    return document.getElementById('tutorial-layer');
};

const tutorialArrows = function () {
    return document.getElementById('tutorial-arrows');
};

//body carries zoom:125%, so getBoundingClientRect and style.left live in different spaces
const tutorialScale = function () {

    let layer = tutorialLayer(),
        box = layer.getBoundingClientRect();

    return box.width && layer.offsetWidth ? box.width / layer.offsetWidth : 1;
};

const layerRect = function (el) {

    let scale = tutorialScale(),
        box = el.getBoundingClientRect();

    return {
        left: box.left / scale,
        top: box.top / scale,
        right: box.right / scale,
        bottom: box.bottom / scale,
        width: box.width / scale,
        height: box.height / scale
    };
};

const layerWidth = function () {
    return tutorialLayer().offsetWidth;
};

const layerHeight = function () {
    return tutorialLayer().offsetHeight;
};

const tutorialNarrow = function () {
    return layerWidth() < 620;
};

const tutorialGap = function () {
    return Math.max(22, Math.min(TUTORIAL_GAP, layerWidth() * 0.1));
};

const purgeLeaving = function () {

    tutorialLeaving.forEach(tip => {
        tip.el.remove();
        tip.path.remove();
    });

    tutorialLeaving = [];
};

const purgeTips = function () {

    purgeLeaving();

    tutorialTips.forEach(tip => {
        tip.el.remove();
        tip.path.remove();
    });

    tutorialTips = [];

    Array.from(document.querySelectorAll('.tutorial-target')).forEach(el => el.classList.remove('tutorial-target'));
};

const retractArrow = function (tip) {

    let total = tip.path.getTotalLength();

    if (!total || tutorialReduced()) {
        tip.path.style.opacity = '0';
        return;
    }

    tip.path.style.transition = 'stroke-dashoffset ' + TUTORIAL_FADE + 'ms ease-in';
    tip.path.style.strokeDasharray = total;
    tip.path.style.strokeDashoffset = total;
};

//fade the current tips out and only then drop them from the dom
const hideTips = async function () {

    purgeLeaving();

    let leaving = tutorialTips;

    tutorialTips = [];

    if (leaving.length === 0) {
        return;
    }

    tutorialLeaving = leaving;

    leaving.forEach(tip => {
        tip.el.classList.remove('show');
        tip.target.classList.remove('tutorial-target');
        retractArrow(tip);
    });

    await tutorialWait(TUTORIAL_FADE);

    purgeLeaving();
};

const addTip = function (spec) {

    let target = tutorialTarget(spec.target);

    if (null == target) {
        return;
    }

    let el = document.createElement('div');

    el.className = 'tutorial-tip';
    el.textContent = spec.text;

    tutorialLayer().appendChild(el);

    let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    path.setAttribute('class', 'tutorial-arrow');
    path.setAttribute('marker-end', 'url(#tutorial-head)');

    tutorialArrows().appendChild(path);

    target.classList.add('tutorial-target');

    tutorialTips.push({el: el, path: path, target: target, side: spec.side});
};

const edgePoint = function (rect, towardX, towardY, pad) {

    let cx = rect.left + rect.width / 2,
        cy = rect.top + rect.height / 2,
        dx = towardX - cx,
        dy = towardY - cy;

    if (dx === 0 && dy === 0) {
        return {x: cx, y: cy};
    }

    let hw = rect.width / 2 + pad,
        hh = rect.height / 2 + pad,
        scaleX = dx === 0 ? Infinity : Math.abs(hw / dx),
        scaleY = dy === 0 ? Infinity : Math.abs(hh / dy),
        scale = Math.min(scaleX, scaleY);

    return {x: cx + dx * scale, y: cy + dy * scale};
};

const placeTip = function (tip) {

    let box = layerRect(tip.target),
        el = tip.el,
        w = el.offsetWidth,
        h = el.offsetHeight,
        gap = tutorialGap(),
        cx = box.left + box.width / 2,
        cy = box.top + box.height / 2,
        side = tip.side,
        x,
        y;

    //no horizontal room on a phone, so sideways tips fall back to vertical
    if (tutorialNarrow()) {
        if (side === 'right') {
            side = 'below';
        } else if (side === 'left') {
            side = 'above';
        }
    }

    if (side === 'above') {
        x = cx - w / 2;
        y = box.top - gap - h;
    } else if (side === 'below') {
        x = cx - w / 2;
        y = box.bottom + gap;
    } else if (side === 'left') {
        x = box.left - gap - w;
        y = cy - h / 2;
    } else {
        x = box.right + gap;
        y = cy - h / 2;
    }

    x = Math.max(10, Math.min(x, layerWidth() - w - 10));
    y = Math.max(10, Math.min(y, layerHeight() - h - 10));

    el.style.left = x + 'px';
    el.style.top = y + 'px';
};

const drawArrow = function (tip, animate) {

    let tipBox = layerRect(tip.el),
        targetBox = layerRect(tip.target),
        tipCx = tipBox.left + tipBox.width / 2,
        tipCy = tipBox.top + tipBox.height / 2,
        targetCx = targetBox.left + targetBox.width / 2,
        targetCy = targetBox.top + targetBox.height / 2,
        from = edgePoint(tipBox, targetCx, targetCy, 4),
        to = edgePoint(targetBox, tipCx, tipCy, 10),
        mx = (from.x + to.x) / 2,
        my = (from.y + to.y) / 2,
        dx = to.x - from.x,
        dy = to.y - from.y,
        len = Math.sqrt(dx * dx + dy * dy) || 1,
        bend = Math.min(len * 0.22, 44);

    tip.path.setAttribute('d', 'M ' + from.x + ' ' + from.y + ' Q ' + (mx - dy / len * bend) + ' ' + (my + dx / len * bend) + ' ' + to.x + ' ' + to.y);

    if (!animate || tutorialReduced()) {
        tip.path.style.strokeDasharray = 'none';
        tip.path.style.strokeDashoffset = '0';
        return;
    }

    let total = tip.path.getTotalLength();

    tip.path.style.transition = 'none';
    tip.path.style.strokeDasharray = total;
    tip.path.style.strokeDashoffset = total;

    tip.path.getBoundingClientRect();

    tip.path.style.transition = 'stroke-dashoffset ' + TUTORIAL_ARROW_MS + 'ms ease-out';
    tip.path.style.strokeDashoffset = '0';
};

const layoutTips = function (animate) {

    tutorialTips.forEach(tip => placeTip(tip));
    tutorialTips.forEach(tip => drawArrow(tip, animate));
};

const tutorialFrame = function () {
    return new Promise(resolve => window.requestAnimationFrame(resolve));
};

const showPhase = async function (step, phase, token) {

    let specs = step.tips[phase];

    if (null == specs) {
        return;
    }

    await hideTips();

    if (tutorialStale(token)) {
        return;
    }

    specs.forEach(addTip);

    await tutorialFrame();

    if (tutorialStale(token)) {
        return;
    }

    layoutTips(true);
    tutorialTips.forEach(tip => tip.el.classList.add('show'));
};


const eraseInput = async function (input, token) {

    input.classList.add('tutorial-typing');

    while (input.value.length > 0) {

        if (tutorialStale(token)) {
            input.classList.remove('tutorial-typing');
            return;
        }

        input.value = input.value.slice(0, -1);
        await tutorialWait(TUTORIAL_ERASE_MS);
    }

    input.classList.remove('tutorial-typing');
};

//steps often share a field, retyping an identical value just looks like a glitch
const retypeInto = async function (input, text, token) {

    if (input.value === text) {
        return;
    }

    await eraseInput(input, token);

    if (tutorialStale(token)) {
        return;
    }

    await typeInto(input, text, token);
};

const typeInto = async function (input, text, token) {

    input.value = '';
    input.classList.add('tutorial-typing');

    for (let i = 0; i < text.length; i++) {

        if (tutorialStale(token)) {
            input.classList.remove('tutorial-typing');
            return;
        }

        input.value = text.slice(0, i + 1);
        await tutorialWait(TUTORIAL_TYPE_MS);
    }

    input.classList.remove('tutorial-typing');
};

const flashEnter = function (input) {

    input.classList.add('tutorial-enter');

    tutorialTimers.push(window.setTimeout(() => input.classList.remove('tutorial-enter'), 420));
};

const fadeResult = function (out) {

    let result = document.getElementsByClassName('result')[0];

    if (null != result) {
        result.classList.toggle('result-out', out);
    }
};

const runAction = function (name) {

    if (name === 'click-result') {
        document.getElementById('result').click();
        return;
    }

    if (name === 'flash-copy') {
        showCopied('Copied!');
    }
};

const runStep = async function (key) {

    tutorialCancel();

    let token = tutorialToken,
        step = TUTORIAL_STEPS[key],
        inputs = tutorialInputs();

    inputs[0].readOnly = true;
    inputs[1].readOnly = true;

    updateCounter();

    fadeResult(true);

    await hideTips();
    if (tutorialStale(token)) return;

    clearResult();

    await showPhase(step, 'start', token);
    if (tutorialStale(token)) return;

    await tutorialWait(step.tips.start ? TUTORIAL_PAUSE : TUTORIAL_BEAT);
    if (tutorialStale(token)) return;

    await retypeInto(inputs[0], step.input_1, token);
    if (tutorialStale(token)) return;

    await tutorialWait(TUTORIAL_BEAT);
    if (tutorialStale(token)) return;

    await retypeInto(inputs[1], step.input_2, token);
    if (tutorialStale(token)) return;

    await showPhase(step, 'typed', token);
    if (tutorialStale(token)) return;

    await tutorialWait(step.tips.typed ? TUTORIAL_PAUSE : TUTORIAL_BEAT);
    if (tutorialStale(token)) return;

    flashEnter(inputs[1]);
    runCalc();
    fadeResult(false);

    await tutorialWait(TUTORIAL_BEAT);
    if (tutorialStale(token)) return;

    await showPhase(step, 'result', token);
    if (tutorialStale(token)) return;

    if (null == step.action) {
        return;
    }

    await tutorialWait(TUTORIAL_PAUSE * 1.6);
    if (tutorialStale(token)) return;

    runAction(step.action);

    await showPhase(step, 'after', token);
};


const updateCounter = function () {

    let counter = document.getElementById('tutorial-counter');

    if (null == counter) {
        return;
    }

    counter.textContent = tutorialActive ? (tutorialIndex + 1) + ' / ' + TUTORIAL_ORDER.length : '';
};

const tutorialStep = function (index) {

    if (index < 0) {
        return;
    }

    if (index >= TUTORIAL_ORDER.length) {
        stopTutorial();
        return;
    }

    tutorialIndex = index;
    runStep(TUTORIAL_ORDER[index]);
};

const startTutorial = function () {

    if (tutorialActive) {
        return;
    }

    tutorialActive = true;

    document.body.classList.add('tutorial-on');
    document.getElementsByClassName('next')[0].classList.remove('hidden');
    document.getElementsByClassName('prev')[0].classList.remove('hidden');

    tutorialStep(0);
};

const stopTutorial = async function () {

    if (!tutorialActive) {
        return;
    }

    tutorialCancel();

    let leaving = tutorialTips;

    tutorialTips = [];
    tutorialLeaving = tutorialLeaving.concat(leaving);

    leaving.forEach(tip => {
        tip.el.classList.remove('show');
        tip.target.classList.remove('tutorial-target');
        retractArrow(tip);
    });

    window.setTimeout(purgeTips, TUTORIAL_FADE);

    tutorialActive = false;
    tutorialIndex = -1;

    let inputs = tutorialInputs();

    inputs[0].value = '';
    inputs[1].value = '';
    inputs[0].readOnly = false;
    inputs[1].readOnly = false;

    fadeResult(false);
    clearResult();
    updateCounter();

    document.body.classList.remove('tutorial-on');
    document.getElementsByClassName('next')[0].classList.add('hidden');
    document.getElementsByClassName('prev')[0].classList.add('hidden');
};

const toggleTutorial = function () {

    if (tutorialActive) {
        stopTutorial();
    } else {
        startTutorial();
    }
};


window.addEventListener('load', function () {

    document.getElementsByClassName('question-mark')[0].addEventListener('click', toggleTutorial);
    document.getElementsByClassName('next')[0].addEventListener('click', () => tutorialStep(tutorialIndex + 1));
    document.getElementsByClassName('prev')[0].addEventListener('click', () => tutorialStep(tutorialIndex - 1));

    window.addEventListener('resize', () => {
        if (tutorialActive) {
            layoutTips(false);
        }
    });

    window.addEventListener('keydown', (e) => {

        if (!tutorialActive) {
            return;
        }

        if (e.key === 'Escape') {
            stopTutorial();
        }

        if (e.key === 'ArrowRight') {
            tutorialStep(tutorialIndex + 1);
        }

        if (e.key === 'ArrowLeft') {
            tutorialStep(tutorialIndex - 1);
        }
    });
});