'use strict';

const
    TUTORIAL_TYPE_MS = 55,
    TUTORIAL_GAP = 52,
    TUTORIAL_PAUSE = 560,
    TUTORIAL_BEAT = 260,
    TUTORIAL_TIP_MS = 300,
    TUTORIAL_LINE_MS = 200,
    TUTORIAL_CONE_MS = 50,
    TUTORIAL_CONE_LEN = 10,
    TUTORIAL_LINE_OUT_MS = 100,
    TUTORIAL_FADE = 240,
    TUTORIAL_ERASE_MS = 26,
    TUTORIAL_TIP_TYPE_MS = 18,
    TUTORIAL_TIP_ERASE_MS = 9;

let tutorialActive = false,
    tutorialIndex = -1,
    tutorialVersion = 0,
    tutorialTimers = [],
    tutorialTips = [],
    tutorialGeometry = '',
    tutorialFollowId = null,
    sleepWakers = [];

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

        timer = window.setTimeout(done, ms);
        sleepWakers.push(done);
    });
};

const tutorialCancel = function () {

    tutorialVersion = tutorialVersion + 1;

    tutorialTimers.forEach(id => window.clearTimeout(id));
    tutorialTimers = [];

    let calendar = document.getElementById('calendar-holder');

    if (null != calendar) {
        calendar.classList.add('hidden');
    }

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

const tutorialMobile = function () {
    return window.matchMedia('(max-width: 768px)').matches;
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
const dismissTips = function (leaving) {

    leaving.forEach(tip => {

        tip.timers.forEach(id => window.clearTimeout(id));
        tip.timers = [];

        tip.arms.forEach(arm => {

            //1. the cone goes
            arm.head.style.transition = 'opacity ' + TUTORIAL_CONE_MS + 'ms ease-in';
            arm.head.style.opacity = '0';

            //2. the line un-draws backwards, from the cone down to the tooltip
            window.setTimeout(() => {
                arm.path.style.transition = 'stroke-dashoffset ' + TUTORIAL_LINE_OUT_MS + 'ms ease-in';
                arm.path.style.strokeDashoffset = arm.length;
            }, TUTORIAL_CONE_MS);
        });

        //3. only then the tooltip
        window.setTimeout(() => tip.el.classList.remove('show'), TUTORIAL_CONE_MS + TUTORIAL_LINE_OUT_MS);

        window.setTimeout(() => {

            tip.el.remove();

            tip.arms.forEach(arm => {
                arm.path.remove();
                arm.head.remove();
            });
        }, TUTORIAL_CONE_MS + TUTORIAL_LINE_OUT_MS + TUTORIAL_TIP_MS + 60);
    });
};

const hideTips = function () {

    let leaving = tutorialTips;

    tutorialTips = [];

    dismissTips(leaving);
};

//the key cap is its own element rather than part of the text that gets typed,
//so it keeps its own border and shadow styling
const setKey = function (tip, key) {

    if (tip.key === (key || null)) {
        return;
    }

    if (null != tip.keyEl) {
        tip.keyEl.remove();
        tip.keyEl = null;
    }

    tip.key = key || null;

    if (null == tip.key) {
        return;
    }

    let cap = document.createElement('span');

    cap.className = 'tutorial-key';
    cap.textContent = tutorialMobile() ? '\u21B5' : tip.key;

    tip.el.appendChild(cap);
    tip.keyEl = cap;
};

const addTip = function (spec) {

    let names = Array.isArray(spec.target) ? spec.target : [spec.target],
        arms = [];

    names.forEach(name => {

        let target = tutorialTarget(name);

        if (null == target) {
            return;
        }

        let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

        path.setAttribute('class', 'tutorial-arrow');

        let head = document.createElementNS('http://www.w3.org/2000/svg', 'path');

        head.setAttribute('class', 'tutorial-arrow tutorial-arrow-head');
        head.setAttribute('d', 'M 0 0 L ' + (-TUTORIAL_CONE_LEN) + ' -4 L ' + (-TUTORIAL_CONE_LEN) + ' 4 Z');

        tutorialArrows().appendChild(path);
        tutorialArrows().appendChild(head);

        arms.push({target: target, path: path, head: head, length: 0});
    });

    if (arms.length === 0) {
        return;
    }

    let el = document.createElement('div'),
        body = document.createElement('span');

    el.className = 'tutorial-tip';
    body.className = 'tutorial-tip-body';
    body.textContent = spec.text;

    el.appendChild(body);
    tutorialLayer().appendChild(el);

    let tip = {
        el: el,
        body: body,
        keyEl: null,
        arms: arms,
        name: names.join('+'),
        text: spec.text,
        side: spec.side,
        shift: spec.shift || 0,
        key: null,
        drawn: false,
        timers: []
    };

    setKey(tip, spec.key);

    tutorialTips.push(tip);
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

    //some targets have a neighbour sitting exactly where the tip would centre
    //itself - the share button has its Copied! text right beside it
    if (tip.shift) {
        y = y + tip.shift * h;
    }

    x = Math.max(8, Math.min(x, vw - w - 8));
    y = Math.max(8, Math.min(y, vh - h - 8));

    return {left: x, top: y, right: x + w, bottom: y + h, width: w, height: h};
};

//on a phone the inputs stack, so a tip anchored to one of them lands between
//the two. There are no arrows to follow either - the pulse is what ties a tip to
//its target - so a tip sits clear of the whole block instead: above the fields,
//or below the answer if that is what it is talking about
const mobileTipBox = function (tip, w, h, gap, vw, vh) {

    //on mobile the calendar button moves down beside the answer, so its tip
    //belongs down there with it
    let down = ['result', 'timezone', 'calendar'].some(id => tip.name.indexOf(id) >= 0),
        anchor = document.getElementsByClassName(down ? 'result' : 'input-row')[0];

    if (null == anchor) {
        return null;
    }

    let box = anchor.getBoundingClientRect(),
        x = box.left + box.width / 2 - w / 2,
        y = down ? box.bottom + gap : box.top - gap - h;

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

//a target is often just one line of a block: #result sits directly on top of the
//timezone. A tip below has to hang off the bottom of the whole block, or both it
//and its arrow land on the line underneath
const armBox = function (arm, side) {

    let box = arm.target.getBoundingClientRect();

    if (side !== 'below' || null == arm.target.parentElement) {
        return box;
    }

    let bottom = Math.min(arm.target.parentElement.getBoundingClientRect().bottom, box.bottom + 80);

    if (bottom <= box.bottom) {
        return box;
    }

    return {
        left: box.left,
        top: box.top,
        right: box.right,
        bottom: bottom,
        width: box.width,
        height: bottom - box.top
    };
};

//the bubble is placed against everything it points at, each arrow then aims at
//its own target
const unionBox = function (boxes) {

    let left = Math.min.apply(null, boxes.map(b => b.left)),
        top = Math.min.apply(null, boxes.map(b => b.top)),
        right = Math.max.apply(null, boxes.map(b => b.right)),
        bottom = Math.max.apply(null, boxes.map(b => b.bottom));

    return {left: left, top: top, right: right, bottom: bottom, width: right - left, height: bottom - top};
};

const tipBoxes = function (tip) {
    return tip.arms.map(arm => armBox(arm, tip.side));
};

const geometryKey = function () {

    return tutorialTips.map(tip => tipBoxes(tip).map(b => {
        return Math.round(b.left) + ',' + Math.round(b.top) + ',' + Math.round(b.width) + ',' + Math.round(b.height);
    }).join(',')).join('|');
};

//one read pass, then one write pass - never a read after a write
const layoutTips = function () {

    if (tutorialTips.length === 0) {
        return;
    }

    let scale = tutorialScale(),
        vw = window.innerWidth,
        vh = window.innerHeight,
        gap = Math.max(18, Math.min(TUTORIAL_GAP, vw * 0.06)),
        measured = tutorialTips.map(tip => {

            let boxes = tipBoxes(tip);

            return {boxes: boxes, box: unionBox(boxes), w: tip.el.offsetWidth * scale, h: tip.el.offsetHeight * scale};
        });

    tutorialGeometry = measured.map(m => m.boxes.map(b => {
        return Math.round(b.left) + ',' + Math.round(b.top) + ',' + Math.round(b.width) + ',' + Math.round(b.height);
    }).join(',')).join('|');

    tutorialTips.forEach((tip, i) => {

        let m = measured[i],
            tipBox = (tutorialMobile() ? mobileTipBox(tip, m.w, m.h, gap, vw, vh) : null) ||
                tipBoxFor(tip, m.box, m.w, m.h, gap, vw, vh);

        tip.el.style.left = (tipBox.left / scale) + 'px';
        tip.el.style.top = (tipBox.top / scale) + 'px';

        tip.arms.forEach((arm, n) => {

            let arrow = arrowFor(tipBox, m.boxes[n]),
                from = arrow.from,
                control = arrow.control,
                to = arrow.to,
                length = curveLength(from, control, to) / scale;

            arm.length = length;
            arm.path.setAttribute('d', 'M ' + (from.x / scale) + ' ' + (from.y / scale) +
                ' Q ' + (control.x / scale) + ' ' + (control.y / scale) +
                ' ' + (to.x / scale) + ' ' + (to.y / scale));

            let angle = coneAngle(from, control, to, TUTORIAL_CONE_LEN * scale);

            arm.head.setAttribute('transform', 'translate(' + (to.x / scale) + ' ' + (to.y / scale) + ') rotate(' + angle + ')');

            arm.path.style.transition = 'none';
            arm.path.style.strokeDasharray = length;
            arm.path.style.strokeDashoffset = tip.drawn ? 0 : length;
        });
    });
};

const revealTips = function (arriving) {

    arriving.forEach(tip => {

        //1. the tooltip
        tip.el.classList.add('show');

        //2. the lines draw out of it toward the targets
        tip.timers.push(window.setTimeout(() => {

            tip.drawn = true;

            tip.arms.forEach(arm => {
                arm.path.style.transition = 'stroke-dashoffset ' + TUTORIAL_LINE_MS + 'ms ease-out';
                arm.path.style.strokeDashoffset = 0;
            });
        }, TUTORIAL_TIP_MS));

        //3. the cones land last
        tip.timers.push(window.setTimeout(() => {

            tip.arms.forEach(arm => {
                arm.head.style.transition = 'opacity ' + TUTORIAL_CONE_MS + 'ms ease-out';
                arm.head.style.opacity = '1';
            });
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
        layoutTips();
    }

    tutorialFollowId = window.requestAnimationFrame(followTips);
};

const tutorialFrame = function () {
    return new Promise(resolve => window.requestAnimationFrame(resolve));
};


/* ---------- what a step script can call ---------- */

const fadeResult = function (out) {

    let result = document.getElementsByClassName('result')[0];

    if (null != result) {
        result.classList.toggle('result-out', out);
    }
};

const eraseInput = async function (input, cancelled) {

    while (input.value.length > 0) {

        if (cancelled()) {
            return;
        }

        input.value = input.value.slice(0, -1);
        await sleep(TUTORIAL_ERASE_MS);
    }
};

const typeInto = async function (input, text, cancelled) {

    input.value = '';

    for (let i = 0; i < text.length; i++) {

        if (cancelled()) {
            return;
        }

        input.value = text.slice(0, i + 1);
        await sleep(TUTORIAL_TYPE_MS);
    }
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


const clearResult = function () {
    LAST_DURATION = false;
    LAST_DATE = null;
    LAST_TITLE = '';
    LAST_ZONE = '';
    document.getElementById('result').innerHTML = '';
    document.getElementById('timezone').innerHTML = '';
    document.getElementById('calendar-holder').classList.add('hidden');
};

//the tip retypes itself the way the fields do: back to whatever the two texts
//still have in common, then forward into the new one. The box resizes on every
//letter, so the arrow is relaid out with it and never drifts off the bubble
const retypeTip = async function (tip, text, cancelled) {

    let shared = 0;

    while (shared < tip.text.length && shared < text.length && tip.text[shared] === text[shared]) {
        shared = shared + 1;
    }

    const letter = function (cut) {
        tip.text = cut;
        tip.body.textContent = cut;
        layoutTips();
    };

    for (let i = tip.text.length; i > shared; i--) {

        if (cancelled()) {
            return;
        }

        letter(tip.text.slice(0, i - 1));

        await sleep(TUTORIAL_TIP_ERASE_MS);
    }

    for (let i = shared; i < text.length; i++) {

        if (cancelled()) {
            return;
        }

        letter(text.slice(0, i + 1));

        await sleep(TUTORIAL_TIP_TYPE_MS);
    }
};

//a tip that stays on the same target and side is kept alive: it re-letters itself
//in place and the arrow it already drew is never taken down and redrawn
const showTips = async function (specs, cancelled) {

    let staying = [],
        arriving = [],
        swapping = [];

    specs.forEach(spec => {

        let name = (Array.isArray(spec.target) ? spec.target : [spec.target]).join('+'),
            match = tutorialTips.find(tip => tip.name === name && tip.side === spec.side && staying.indexOf(tip) < 0);

        if (null == match) {
            arriving.push(spec);
            return;
        }

        staying.push(match);
        match.pendingKey = spec.key || null;
        match.shift = spec.shift || 0;

        if (match.text !== spec.text) {
            match.pending = spec.text;
            swapping.push(match);
        }
    });

    let leaving = tutorialTips.filter(tip => staying.indexOf(tip) < 0);

    tutorialTips = staying;

    dismissTips(leaving);

    //the cap comes off before the retype and back on after, so the bubble is not
    //carrying a stale key while it re-letters itself
    staying.forEach(tip => {
        if (tip.pendingKey !== tip.key) {
            setKey(tip, null);
        }
    });

    if (swapping.length > 0) {

        await Promise.all(swapping.map(tip => retypeTip(tip, tip.pending, cancelled)));

        if (cancelled()) {
            return;
        }
    }

    staying.forEach(tip => setKey(tip, tip.pendingKey));

    //staying and tutorialTips are the same array now, so the count has to be
    //taken before addTip starts pushing into it
    let kept = tutorialTips.length;

    arriving.forEach(addTip);

    let fresh = tutorialTips.slice(kept);

    //measure on one frame, paint the start state, reveal on the next
    await tutorialFrame();

    if (cancelled()) {
        return;
    }

    layoutTips();

    await tutorialFrame();

    if (cancelled()) {
        return;
    }

    revealTips(fresh);
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

const pressKey = async function (cancelled) {

    let cap = document.getElementsByClassName('tutorial-key')[0];

    if (null == cap) {
        return;
    }

    for (let i = 0; i < 2; i++) {

        cap.classList.add('tutorial-key-down');

        await sleep(170);

        if (cancelled()) {
            cap.classList.remove('tutorial-key-down');
            return;
        }

        cap.classList.remove('tutorial-key-down');

        await sleep(230);

        if (cancelled()) {
            return;
        }
    }
};

//the icon inside the button is what carries the scale transition, the button
//itself is a bare wrapper
const pressButton = async function (name, cancelled) {

    let button = tutorialTarget(name);

    if (null == button) {
        return;
    }

    let icon = button.firstElementChild || button;

    for (let i = 0; i < 2; i++) {

        icon.classList.add('tutorial-press');

        await sleep(180);

        icon.classList.remove('tutorial-press');

        if (cancelled()) {
            return;
        }

        await sleep(240);

        if (cancelled()) {
            return;
        }
    }
};

//steps hand their state to the next one, so a step that only talks about the
//answer has to put one there when it is jumped into out of order
const ensureResult = async function (cancelled) {

    if (document.getElementById('result').textContent.trim().length > 0) {
        return;
    }

    await type(1, '22.11.1996', cancelled);

    if (cancelled()) {
        return;
    }

    await type(2, '33y', cancelled);

    if (cancelled()) {
        return;
    }

    submit();

    await sleep(TUTORIAL_BEAT);
};


/* ---------- the steps ---------- */

/**
 * The order of the steps. tutorialIndex is a 0-based index into this array,
 * so inserting a step is just inserting its name here.
 *
 * A step never clears the screen for itself: it inherits whatever the previous
 * one left and changes only what it needs. Steps that keep the same targets and
 * side keep the same bubble too, which then retypes in place instead of a new
 * one being drawn.
 */
const TUTORIAL_ORDER = ['fields', 'enter', 'formats', 'answer', 'units', 'between', 'words', 'share', 'calendar'];

const FIELDS = ['input-1', 'input-2'];

const TUTORIAL_STEPS = {

    async fields(cancelled) {
        await clearFields(cancelled);
        if (cancelled()) return;

        await showTips([
            {target: FIELDS, side: 'above', text: 'Write a date in one field and a value in the other'}
        ], cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_PAUSE);
        if (cancelled()) return;

        await type(1, '22.11.1996', cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_BEAT);
        if (cancelled()) return;

        await type(2, '33y', cancelled);
    },

    //the answer is the payoff of this step, so nothing is on screen until the
    //cap goes down
    async enter(cancelled) {
        clearResult();
        fadeResult(true);

        await type(1, '22.11.1996', cancelled);
        if (cancelled()) return;

        await type(2, '33y', cancelled);
        if (cancelled()) return;

        await showTips([
            {target: FIELDS, side: 'above', text: 'Cursor in either field, then press', key: 'Enter'}
        ], cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_PAUSE);
        if (cancelled()) return;

        await pressKey(cancelled);
        if (cancelled()) return;

        submit();
    },

    //only the start date changes shape here, the value and the answer stay put -
    //that is the whole point of the step
    async formats(cancelled) {
        await showTips([
            {target: 'input-1', side: 'above', text: 'It can process any format'}
        ], cancelled);
        if (cancelled()) return;

        await type(2, '33y', cancelled);
        if (cancelled()) return;

        let formats = ['22.11.1996', '11/22/1996', '1996-11-22', '22 Nov 1996'];

        for (let i = 0; i < formats.length; i++) {

            await type(1, formats[i], cancelled);
            if (cancelled()) return;

            await sleep(TUTORIAL_BEAT);
            if (cancelled()) return;

            submit();

            await sleep(TUTORIAL_PAUSE * 1.6);
            if (cancelled()) return;
        }
    },

    async answer(cancelled) {
        await ensureResult(cancelled);
        if (cancelled()) return;

        submit();

        await sleep(TUTORIAL_BEAT);
        if (cancelled()) return;

        await showTips([
            {target: 'result', side: 'below', text: 'This is your result!'}
        ], cancelled);
    },

    async units(cancelled) {
        await showTips([
            {target: 'input-2', side: 'above', text: 'The value takes any unit you like'}
        ], cancelled);
        if (cancelled()) return;

        //seconds move nothing a plain date can show, so that one gets a clock
        let shots = [
            {date: '22.11.1996', value: '33y'},
            {date: '22.11.1996', value: '2M'},
            {date: '22.11.1996', value: '10 days'},
            {date: '22.11.1996 00:00', value: '3 sec'}
        ];

        for (let i = 0; i < shots.length; i++) {

            await type(1, shots[i].date, cancelled);
            if (cancelled()) return;

            await type(2, shots[i].value, cancelled);
            if (cancelled()) return;

            await sleep(TUTORIAL_BEAT);
            if (cancelled()) return;

            submit();

            await sleep(TUTORIAL_PAUSE * 1.6);
            if (cancelled()) return;
        }
    },

    async between(cancelled) {
        await showTips([
            {target: 'input-2', side: 'above', text: 'A second date instead, and you get the gap between them'}
        ], cancelled);
        if (cancelled()) return;

        await type(1, '22.11.1996', cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_BEAT);
        if (cancelled()) return;

        await type(2, 'now', cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_BEAT);
        if (cancelled()) return;

        submit();
    },

    async words(cancelled) {
        await showTips([
            {target: 'input-2', side: 'above', text: 'Plain words count as dates too'}
        ], cancelled);
        if (cancelled()) return;

        await type(1, 'today', cancelled);
        if (cancelled()) return;

        let words = ['next friday', 'in 3 weeks', 'last monday'];

        for (let i = 0; i < words.length; i++) {

            await type(2, words[i], cancelled);
            if (cancelled()) return;

            await sleep(TUTORIAL_BEAT);
            if (cancelled()) return;

            submit();

            await sleep(TUTORIAL_PAUSE * 1.6);
            if (cancelled()) return;
        }
    },

    async share(cancelled) {
        await ensureResult(cancelled);
        if (cancelled()) return;

        await showTips([
            {target: 'share', side: 'right', shift: -0.85, text: 'You can share the answer as a link'}
        ], cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_PAUSE * 1.6);
        if (cancelled()) return;

        await pressButton('share', cancelled);
        if (cancelled()) return;

        //on a phone the button sits under the thumb and Copied! has nowhere to go
        if (!tutorialMobile()) {
            showCopied('Copied!');
        }
    },

    //the calendar button only exists while the answer is a date, so this step
    //has to put one there before it can point at it
    async calendar(cancelled) {
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
            {target: 'calendar', side: 'right', text: 'Or set the date in your calendar'}
        ], cancelled);
        if (cancelled()) return;

        await sleep(TUTORIAL_PAUSE * 1.6);
        if (cancelled()) return;

        await pressButton('calendar', cancelled);
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

    if (null != document.activeElement) {
        document.activeElement.blur();
    }

    if (null == tutorialFollowId) {
        tutorialFollowId = window.requestAnimationFrame(followTips);
    }

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
};

//browser shortcuts stay alive: only keys that would type, scroll or move focus
//get their default taken away
const TUTORIAL_EATEN = [' ', 'Enter', 'Tab', 'Backspace', 'Delete', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

const tutorialSwallow = function (e) {

    if (!tutorialActive) {
        return;
    }

    e.stopImmediatePropagation();

    if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key.length === 1 || TUTORIAL_EATEN.indexOf(e.key) >= 0)) {
        e.preventDefault();
    }
};

const tutorialKeys = function (e) {

    if (!tutorialActive) {
        return;
    }

    tutorialSwallow(e);

    if (e.ctrlKey || e.metaKey || e.altKey) {
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
    document.getElementById('guideNext').addEventListener('click', () => goToStep(tutorialIndex + 1));
    document.getElementById('guidePrev').addEventListener('click', () => goToStep(tutorialIndex - 1));

    window.addEventListener('resize', () => {
        if (tutorialActive) {
            layoutTips();
        }
    });

    //capture, so the page never sees a key while the tutorial is driving
    window.addEventListener('keydown', tutorialKeys, true);
    window.addEventListener('keypress', tutorialSwallow, true);
    window.addEventListener('keyup', tutorialSwallow, true);
});