'use strict';

const TUTORIAL_TYPE_MS = 55;
const TUTORIAL_GAP = 52;
const TUTORIAL_PAUSE = 560;
const TUTORIAL_BEAT = 260;
const TUTORIAL_TIP_MS = 300;
const TUTORIAL_LINE_MS = 420;
const TUTORIAL_CONE_MS = 170;
const TUTORIAL_CONE_LEN = 10;
const TUTORIAL_LINE_OUT_MS = 280;
const TUTORIAL_FADE = 240;
const TUTORIAL_ERASE_MS = 26;

let tutorialActive = false;
let tutorialIndex = -1;
let tutorialVersion = 0;
let tutorialTimers = [];
let tutorialTips = [];
let tutorialGeometry = '';
let tutorialFollowId = null;
let sleepWakers = [];

const tutorialReduced = function () {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

//a cancelled step has to resume so it can see it is stale and return - a sleep
//whose timer was simply cleared would leave it suspended forever
const wakeSleeps = function () {

    let waking = sleepWakers;

    sleepWakers = [];
    waking.forEach(wake => wake());
};

const sleep = function (ms) {

    return new Promise(resolve => {

        let timer = null;

        const done = function () {
            window.clearTimeout(timer);
            sleepWakers = sleepWakers.filter(w => w !== done);
            resolve();
        };

        timer = window.setTimeout(done, tutorialReduced() ? Math.min(ms, 120) : ms);
        sleepWakers.push(done);
    });
};

const tutorialCancel = function () {

    tutorialVersion = tutorialVersion + 1;

    tutorialTimers.forEach(id => window.clearTimeout(id));
    tutorialTimers = [];

    wakeSleeps();
};

const tutorialInputs = function () {
    return Array.from(document.getElementsByClassName('input'));
};

const field = function (n) {
    return tutorialInputs()[n - 1];
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


//fire and forget: each leaving tip owns the timer that removes it, so a cancel
//in the middle of a step can never strand it or yank it out mid fade
const hideTips = function () {

    let leaving = tutorialTips;

    tutorialTips = [];

    leaving.forEach(tip => {

        tip.timers.forEach(id => window.clearTimeout(id));
        tip.timers = [];

        tip.target.classList.remove('tutorial-target');

        //1. the cone goes
        tip.head.style.transition = 'opacity ' + TUTORIAL_CONE_MS + 'ms ease-in';
        tip.head.style.opacity = '0';

        //2. the line un-draws, tail first, arrowhead last
        window.setTimeout(() => {
            tip.path.style.transition = 'stroke-dashoffset ' + TUTORIAL_LINE_OUT_MS + 'ms ease-in';
            tip.path.style.strokeDashoffset = -tip.length;
        }, TUTORIAL_CONE_MS);

        //3. only then the tooltip
        window.setTimeout(() => tip.el.classList.remove('show'), TUTORIAL_CONE_MS + TUTORIAL_LINE_OUT_MS);

        window.setTimeout(() => {
            tip.el.remove();
            tip.path.remove();
            tip.head.remove();
        }, TUTORIAL_CONE_MS + TUTORIAL_LINE_OUT_MS + TUTORIAL_TIP_MS + 60);
    });
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

    //the cone is its own element so it can be timed apart from the line;
    //as a marker-end it would paint instantly, dash state or not
    let head = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    head.setAttribute('class', 'tutorial-arrow tutorial-arrow-head');
    head.setAttribute('d', 'M 0 0 L ' + (-TUTORIAL_CONE_LEN) + ' -4 L ' + (-TUTORIAL_CONE_LEN) + ' 4 Z');

    tutorialArrows().appendChild(path);
    tutorialArrows().appendChild(head);

    target.classList.add('tutorial-target');

    tutorialTips.push({el: el, path: path, head: head, target: target, side: spec.side, length: 0, drawn: false, timers: []});
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

const pointAt = function (from, control, to, t) {

    let mt = 1 - t;

    return {
        x: mt * mt * from.x + 2 * mt * t * control.x + t * t * to.x,
        y: mt * mt * from.y + 2 * mt * t * control.y + t * t * to.y
    };
};

//the cone covers the last stretch of the curve, so it has to line up with that
//stretch - the tangent at the very end points somewhere else on a bent arrow
const coneAngle = function (from, control, to, span) {

    let back = from;

    for (let i = 1; i <= 40; i++) {

        let p = pointAt(from, control, to, 1 - i / 40),
            dx = to.x - p.x,
            dy = to.y - p.y;

        if (dx * dx + dy * dy >= span * span) {
            back = p;
            break;
        }

        back = p;
    }

    return Math.atan2(to.y - back.y, to.x - back.x) * 180 / Math.PI;
};

//sampled instead of getTotalLength(), which would force a layout per arrow
const curveLength = function (from, control, to) {

    let len = 0,
        prevX = from.x,
        prevY = from.y;

    for (let i = 1; i <= 16; i++) {

        let t = i / 16,
            mt = 1 - t,
            x = mt * mt * from.x + 2 * mt * t * control.x + t * t * to.x,
            y = mt * mt * from.y + 2 * mt * t * control.y + t * t * to.y;

        len += Math.sqrt((x - prevX) * (x - prevX) + (y - prevY) * (y - prevY));

        prevX = x;
        prevY = y;
    }

    return len * 1.02;
};

//everything here is client space: target rects, the viewport and the tip size all
//agree, and only the final write converts into the zoomed layer
const tipBoxFor = function (tip, box, w, h, gap, vw, vh) {

    let cx = box.left + box.width / 2,
        cy = box.top + box.height / 2,
        side = tip.side,
        x,
        y;

    //a side that does not fit becomes a side that does
    if (side === 'right' && box.right + gap + w > vw - 8) {
        side = box.left - gap - w < 8 ? 'below' : 'left';
    } else if (side === 'left' && box.left - gap - w < 8) {
        side = box.right + gap + w > vw - 8 ? 'below' : 'right';
    }

    if (side === 'above' && box.top - gap - h < 8) {
        side = 'below';
    } else if (side === 'below' && box.bottom + gap + h > vh - 8) {
        side = 'above';
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

    x = Math.max(8, Math.min(x, vw - w - 8));
    y = Math.max(8, Math.min(y, vh - h - 8));

    return {left: x, top: y, right: x + w, bottom: y + h, width: w, height: h};
};

const arrowFor = function (tipBox, targetBox) {

    let tipCx = tipBox.left + tipBox.width / 2,
        tipCy = tipBox.top + tipBox.height / 2,
        targetCx = targetBox.left + targetBox.width / 2,
        targetCy = targetBox.top + targetBox.height / 2,
        from = edgePoint(tipBox, targetCx, targetCy, 4),
        to = edgePoint(targetBox, tipCx, tipCy, 10),
        dx = to.x - from.x,
        dy = to.y - from.y,
        len = Math.sqrt(dx * dx + dy * dy) || 1,
        bend = Math.min(len * 0.16, 30);

    return {
        from: from,
        to: to,
        control: {x: (from.x + to.x) / 2 - dy / len * bend, y: (from.y + to.y) / 2 + dx / len * bend}
    };
};

const geometryKey = function () {

    return tutorialTips.map(tip => {

        let b = tip.target.getBoundingClientRect();

        return Math.round(b.left) + ',' + Math.round(b.top) + ',' + Math.round(b.width) + ',' + Math.round(b.height);
    }).join('|');
};

//one read pass, then one write pass - never a read after a write
const layoutTips = function (animate) {

    if (tutorialTips.length === 0) {
        return;
    }

    let scale = tutorialScale(),
        vw = window.innerWidth,
        vh = window.innerHeight,
        gap = Math.max(18, Math.min(TUTORIAL_GAP, vw * 0.06)),
        measured = tutorialTips.map(tip => ({
            box: tip.target.getBoundingClientRect(),
            w: tip.el.offsetWidth * scale,
            h: tip.el.offsetHeight * scale
        }));

    tutorialGeometry = measured.map(m => Math.round(m.box.left) + ',' + Math.round(m.box.top) + ',' + Math.round(m.box.width) + ',' + Math.round(m.box.height)).join('|');

    tutorialTips.forEach((tip, i) => {

        let m = measured[i],
            tipBox = tipBoxFor(tip, m.box, m.w, m.h, gap, vw, vh),
            arrow = arrowFor(tipBox, m.box),
            from = arrow.from,
            control = arrow.control,
            to = arrow.to,
            length = curveLength(from, control, to) / scale;

        tip.el.style.left = (tipBox.left / scale) + 'px';
        tip.el.style.top = (tipBox.top / scale) + 'px';

        tip.length = length;
        tip.path.setAttribute('d', 'M ' + (from.x / scale) + ' ' + (from.y / scale) +
            ' Q ' + (control.x / scale) + ' ' + (control.y / scale) +
            ' ' + (to.x / scale) + ' ' + (to.y / scale));

        let angle = coneAngle(from, control, to, TUTORIAL_CONE_LEN * scale);

        tip.head.setAttribute('transform', 'translate(' + (to.x / scale) + ' ' + (to.y / scale) + ') rotate(' + angle + ')');

        tip.path.style.transition = 'none';
        tip.path.style.strokeDasharray = length;

        if (animate && !tutorialReduced()) {
            tip.drawn = false;
        }

        tip.path.style.strokeDashoffset = tip.drawn ? 0 : length;
    });
};

const revealTips = function () {

    tutorialTips.forEach(tip => {

        //1. the tooltip
        tip.el.classList.add('show');

        //2. the line draws out of it toward the target
        tip.timers.push(window.setTimeout(() => {
            tip.drawn = true;
            tip.path.style.transition = 'stroke-dashoffset ' + TUTORIAL_LINE_MS + 'ms ease-out';
            tip.path.style.strokeDashoffset = 0;
        }, TUTORIAL_TIP_MS));

        //3. the cone lands last
        tip.timers.push(window.setTimeout(() => {
            tip.head.style.transition = 'opacity ' + TUTORIAL_CONE_MS + 'ms ease-out';
            tip.head.style.opacity = '1';
        }, TUTORIAL_TIP_MS + TUTORIAL_LINE_MS));
    });
};

//the result changes width when it fills in or gets expanded, and the calendar
//button appears and disappears - anything anchored to them has to follow
const followTips = function () {

    if (!tutorialActive) {
        tutorialFollowId = null;
        return;
    }

    if (tutorialTips.length > 0 && geometryKey() !== tutorialGeometry) {
        layoutTips(false);
    }

    tutorialFollowId = window.requestAnimationFrame(followTips);
};

const tutorialFrame = function () {
    return new Promise(resolve => window.requestAnimationFrame(resolve));
};


/* ---------- what a step script can call ---------- */

const clean = function () {
    hideTips();
    fadeResult(true);
};

const fadeResult = function (out) {

    let result = document.getElementsByClassName('result')[0];

    if (null != result) {
        result.classList.toggle('result-out', out);
    }
};

const eraseInput = async function (input, cancelled) {

    input.classList.add('tutorial-typing');

    while (input.value.length > 0) {

        if (cancelled()) {
            input.classList.remove('tutorial-typing');
            return;
        }

        input.value = input.value.slice(0, -1);
        await sleep(TUTORIAL_ERASE_MS);
    }

    input.classList.remove('tutorial-typing');
};

const typeInto = async function (input, text, cancelled) {

    input.value = '';
    input.classList.add('tutorial-typing');

    for (let i = 0; i < text.length; i++) {

        if (cancelled()) {
            input.classList.remove('tutorial-typing');
            return;
        }

        input.value = text.slice(0, i + 1);
        await sleep(TUTORIAL_TYPE_MS);
    }

    input.classList.remove('tutorial-typing');
};

//steps often share a field, retyping an identical value just looks like a glitch
const type = async function (n, text, cancelled) {

    let input = field(n);

    if (input.value === text) {
        return;
    }

    await eraseInput(input, cancelled);

    if (cancelled()) {
        return;
    }

    await typeInto(input, text, cancelled);
};

//erasing starts immediately so a click never looks like a freeze
const clearFields = async function (cancelled) {

    let inputs = tutorialInputs();

    await Promise.all([
        eraseInput(inputs[1], cancelled),
        sleep(TUTORIAL_FADE)
    ]);

    if (cancelled()) {
        return;
    }

    clearResult();

    await eraseInput(inputs[0], cancelled);
};

const showTips = async function (specs, cancelled) {

    hideTips();
    specs.forEach(addTip);

    //measure on one frame, paint the start state, reveal on the next
    await tutorialFrame();

    if (cancelled()) {
        return;
    }

    layoutTips(true);

    await tutorialFrame();

    if (cancelled()) {
        return;
    }

    revealTips();
};

const flashEnter = function (input) {

    input.classList.add('tutorial-enter');

    tutorialTimers.push(window.setTimeout(() => input.classList.remove('tutorial-enter'), 420));
};

const submit = function () {
    flashEnter(field(2));
    runCalc();
    fadeResult(false);
};


/* ---------- the steps ---------- */

/**
 * The order of the steps. tutorialIndex is a 0-based index into this array,
 * so inserting a step is just inserting its name here.
 */
const TUTORIAL_ORDER = ['dateMath', 'subtract', 'duration', 'totalDays', 'words', 'share', 'calendar'];

const TUTORIAL_STEPS = {

    async dateMath(cancelled) {
        await clearFields(cancelled);
        if (cancelled()) return;

        await showTips([
            {target: 'input-1', side: 'above', text: 'Any date, written the way you already write dates'},
            {target: 'input-2', side: 'right', text: 'How far to jump: 33y, 2M, 10 days, 3 sec'}
        ], cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_PAUSE);
        if (cancelled()) return;

        await type(1, '22.11.1996', cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_BEAT);
        if (cancelled()) return;

        await type(2, '33y', cancelled);
        if (cancelled()) return;

        await showTips([
            {target: 'input-2', side: 'below', text: 'Cursor in either field, then Enter'}
        ], cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_PAUSE);
        if (cancelled()) return;

        submit();

        await sleep(TUTORIAL_BEAT);
        if (cancelled()) return;

        await showTips([
            {target: 'result', side: 'below', text: 'The exact date, weekday and month included'}
        ], cancelled);
    },

    async subtract(cancelled) {
        await clearFields(cancelled);
        if (cancelled()) return;

        await showTips([
            {target: 'input-2', side: 'right', text: 'Stack units together. A minus turns the whole thing backwards'}
        ], cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_PAUSE);
        if (cancelled()) return;

        await type(1, '22.11.1996', cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_BEAT);
        if (cancelled()) return;

        await type(2, '-4 weeks 4 days', cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_BEAT);
        if (cancelled()) return;

        submit();

        await sleep(TUTORIAL_BEAT);
        if (cancelled()) return;

        await showTips([
            {target: 'result', side: 'below', text: '4 weeks and 4 days earlier'}
        ], cancelled);
    },

    async duration(cancelled) {
        await clearFields(cancelled);
        if (cancelled()) return;

        await showTips([
            {target: 'input-2', side: 'right', text: 'Put a second date here instead of a unit'}
        ], cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_PAUSE);
        if (cancelled()) return;

        await type(1, '22.11.1996', cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_BEAT);
        if (cancelled()) return;

        await type(2, '18.11.2115', cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_BEAT);
        if (cancelled()) return;

        submit();

        await sleep(TUTORIAL_BEAT);
        if (cancelled()) return;

        await showTips([
            {target: 'result', side: 'below', text: 'Now the answer is the distance between them'}
        ], cancelled);
    },

    async totalDays(cancelled) {
        await clearFields(cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_BEAT);
        if (cancelled()) return;

        await type(1, '10.01.2026', cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_BEAT);
        if (cancelled()) return;

        await type(2, '10.02.2026', cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_BEAT);
        if (cancelled()) return;

        submit();

        await sleep(TUTORIAL_BEAT);
        if (cancelled()) return;

        await showTips([
            {target: 'result', side: 'below', text: 'Click a duration to also get it in plain days'}
        ], cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_PAUSE * 1.6);
        if (cancelled()) return;

        document.getElementById('result').click();

        await showTips([
            {target: 'result', side: 'below', text: 'Handy when months and weeks only get in the way'}
        ], cancelled);
    },

    async words(cancelled) {
        await clearFields(cancelled);
        if (cancelled()) return;

        await showTips([
            {target: 'input-1', side: 'above', text: 'Plain words work too: now, today, tomorrow'},
            {target: 'input-2', side: 'right', text: 'next friday, last monday, in 3 weeks'}
        ], cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_PAUSE);
        if (cancelled()) return;

        await type(1, 'now', cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_BEAT);
        if (cancelled()) return;

        await type(2, 'next friday', cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_BEAT);
        if (cancelled()) return;

        submit();

        await sleep(TUTORIAL_BEAT);
        if (cancelled()) return;

        await showTips([
            {target: 'timezone', side: 'below', text: 'Everything is counted in your own timezone, shown right here'}
        ], cancelled);
    },

    async share(cancelled) {
        await clearFields(cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_BEAT);
        if (cancelled()) return;

        await type(1, '22.11.1996', cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_BEAT);
        if (cancelled()) return;

        await type(2, '33y', cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_BEAT);
        if (cancelled()) return;

        submit();

        await sleep(TUTORIAL_BEAT);
        if (cancelled()) return;

        await showTips([
            {target: 'share', side: 'right', text: 'Copies a link with both fields baked in'}
        ], cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_PAUSE * 1.6);
        if (cancelled()) return;

        showCopied('Copied!');

        await showTips([
            {target: 'share', side: 'right', text: 'Whoever opens it lands on this exact answer'}
        ], cancelled);
    },

    async calendar(cancelled) {
        await clearFields(cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_BEAT);
        if (cancelled()) return;

        await type(1, 'today', cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_BEAT);
        if (cancelled()) return;

        await type(2, '111d', cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_BEAT);
        if (cancelled()) return;

        submit();

        await sleep(TUTORIAL_BEAT);
        if (cancelled()) return;

        await showTips([
            {target: 'calendar', side: 'right', text: 'When the answer is a date, drop it straight into Google Calendar'},
            {target: 'result', side: 'below', text: 'It only shows up for dates, never for durations'}
        ], cancelled);
    }

};


/* ---------- driving them ---------- */

const updateCounter = function () {

    let counter = document.getElementById('tutorial-counter');

    if (null == counter) {
        return;
    }

    counter.textContent = tutorialActive ? (tutorialIndex + 1) + ' / ' + TUTORIAL_ORDER.length : '';
};

const runTutorialStep = async function (key, version) {

    const cancelled = () => version !== tutorialVersion;

    if (cancelled()) {
        return;
    }

    let step = TUTORIAL_STEPS[key],
        inputs = tutorialInputs();

    if (null == step) {
        stopTutorial();
        return;
    }

    inputs[0].readOnly = true;
    inputs[1].readOnly = true;

    clean();
    updateCounter();

    await step(cancelled);
};

//the timeout lets the outgoing step resume, see it is stale and unwind first
const advanceTutorial = function (key) {

    tutorialCancel();

    let version = tutorialVersion;

    window.setTimeout(() => runTutorialStep(key, version), 0);
};

const goToStep = function (index) {

    if (index < 0) {
        return;
    }

    if (index >= TUTORIAL_ORDER.length) {
        stopTutorial();
        return;
    }

    tutorialIndex = index;
    advanceTutorial(TUTORIAL_ORDER[index]);
};

const startTutorial = function () {

    if (tutorialActive) {
        return;
    }

    tutorialActive = true;

    document.body.classList.add('tutorial-on');

    if (null == tutorialFollowId) {
        tutorialFollowId = window.requestAnimationFrame(followTips);
    }

    document.getElementsByClassName('next')[0].classList.remove('hidden');
    document.getElementsByClassName('prev')[0].classList.remove('hidden');

    goToStep(0);
};

const stopTutorial = function () {

    if (!tutorialActive) {
        return;
    }

    tutorialCancel();
    hideTips();

    tutorialActive = false;

    if (null != tutorialFollowId) {
        window.cancelAnimationFrame(tutorialFollowId);
        tutorialFollowId = null;
    }

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
    document.getElementsByClassName('next')[0].addEventListener('click', () => goToStep(tutorialIndex + 1));
    document.getElementsByClassName('prev')[0].addEventListener('click', () => goToStep(tutorialIndex - 1));

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
            goToStep(tutorialIndex + 1);
        }

        if (e.key === 'ArrowLeft') {
            goToStep(tutorialIndex - 1);
        }
    });
});