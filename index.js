const ENTER_KEY = 13;

const NUMBER_POSITION = 1;
const DATE_INPUT_NUMBER = '1';
const ADD_INPUT_NUMBER = '2';

const HAS_TIME_REGEX = new RegExp('\\d{2}:\\d{2}:\\d{2}');
const RUS_DATE_REGEX = new RegExp('\\d{2}([.\\-])\\d{2}([.\\-])(?:\\d{2}|\\d{4}).*');

const UNITS = {
    years: 'years', year: 'year', yrs: 'years', yr: 'year', y: 'year',
    months: 'months', month: 'month', mos: 'months', mo: 'months', M: 'months',
    weeks: 'weeks', week: 'week', wks: 'weeks', wk: 'weeks', w: 'weeks',
    days: 'days', day: 'day', d: 'days',
    hours: 'hours', hour: 'hour', hrs: 'hours', hr: 'hours', h: 'hours',
    minutes: 'minutes', minute: 'minutes', mins: 'minutes', min: 'minutes', m: 'minutes',
    seconds: 'seconds', second: 'seconds', secs: 'seconds', sec: 'seconds', s: 'seconds'
};

const UNIT_ORDER = ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds'];

const UNIT_ALTERNATION = Object.keys(UNITS)
    .sort((a, b) => b.length - a.length)
    .join('|');

const DURATION = new RegExp('^\\s*(?:[-+]?\\s*\\d+\\s*(?:' + UNIT_ALTERNATION + ')\\s*)+$', 'i');

const SEGMENT_GLOBAL = new RegExp('\\d+\\s*[a-zA-Z]+', 'g');
const SEGMENT_PARTS = new RegExp('(\\d+)\\s*([a-zA-Z]+)');

const CLOCK_PATTERN = 'DD.MM.YYYY HH:mm:ss dddd MMMM';
const DATE_PATTERN = 'DD.MM.YYYY dddd MMMM';

const SHARE_DATE = 'd';
const SHARE_UNIT = 'u';
const SHARE_REF = 't';
const SHARE_ZONE = 'z';

const TOOLTIP_MS = 2000;
const COPIED_MS = 2000;

const TOOLTIP_TIMERS = {};

let LAST_DURATION = false;
let LAST_ZONE = '';

let SHARED_REFERENCE = null;
let SHARED_ZONE = null;

let copiedTimerId = null;

let guideStage = 0;

const toElement = function (elements) {
    return elements
        .map(e => ({value: e.value, pos: e.classList[NUMBER_POSITION], self: e}))
        .reduce((acc, e) => {
            acc[e.pos] = e;
            return acc;
        }, {});
};

const isKnownUnit = function (unit) {
    return UNITS.hasOwnProperty(unit) || UNITS.hasOwnProperty(unit.toLowerCase());
};

const formatUnits = function (unit) {

    if (unit === '') {
        return null;
    }

    if (UNITS.hasOwnProperty(unit)) {
        return UNITS[unit];
    }

    let lower = unit.toLowerCase();

    return UNITS.hasOwnProperty(lower) ? UNITS[lower] : unit;
};

const getOperations = function (string) {

    let segments = string.match(SEGMENT_GLOBAL);

    if (null == segments) {
        return null;
    }

    const hasMinus = string.indexOf('-') !== -1;

    let operations = [];

    for (let i = 0; i < segments.length; i++) {

        let [, num, unit] = segments[i].match(SEGMENT_PARTS);

        if (!isKnownUnit(unit)) {
            return null;
        }

        operations.push({num: hasMinus ? -num : +num, unit: formatUnits(unit)});
    }

    return operations.sort((a, b) => {
        return UNIT_ORDER.indexOf(b.unit) - UNIT_ORDER.indexOf(a.unit);
    });
};

const isNotVisible = function (e) {
    return e.classList.contains('opacity-0');
};

const toggleOpacity = function (element) {
    element.classList.toggle('opacity-0')
    element.classList.toggle('opacity-1')
};

const flashTooltip = function (id) {

    let elem = document.getElementById(id);

    if (null == elem) {
        return;
    }

    if (isNotVisible(elem)) {
        toggleOpacity(elem);
    }

    window.clearTimeout(TOOLTIP_TIMERS[id]);

    TOOLTIP_TIMERS[id] = window.setTimeout(() => {
        if (!isNotVisible(elem)) {
            toggleOpacity(elem);
        }
        delete TOOLTIP_TIMERS[id];
    }, TOOLTIP_MS);
};

const localZone = function () {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch (e) {
        return '';
    }
};

const zoneLabel = function (momentDate) {

    let zone = localZone(),
        offset = 'UTC' + momentDate.format('Z'),
        label = zone ? zone + ' (' + offset + ')' : offset;

    if (SHARED_ZONE && SHARED_ZONE !== zone) {
        return label + ' · shared from ' + SHARED_ZONE;
    }

    return label;
};

const formatMoment = function (momentDate) {

    //if time without clockunit don't need to render it
    let hasClockUnit = 0 !== (momentDate.hours() || momentDate.minutes() /*|| momentDate.seconds()*/);

    return momentDate.format(hasClockUnit ? CLOCK_PATTERN : DATE_PATTERN);
};

const calcRes = function (inputs, referenceDate) {

    LAST_DURATION = false;
    LAST_ZONE = '';

    let elements = toElement(inputs),
        value_1 = elements[DATE_INPUT_NUMBER].value.trim(),
        value_2 = elements[ADD_INPUT_NUMBER].value.trim();

    if (value_1.length === 0) {
        return '';
    }

    //parse to date, date input val
    let firstDate = parseDate(value_1, referenceDate);

    if (null == firstDate) {
        flashTooltip('date-tooltip');
        return '';
    }

    let fixedDate_1 = fixDate(firstDate, firstDate.start.moment());

    LAST_ZONE = zoneLabel(fixedDate_1);

    if (value_2.length === 0) {
        return formatMoment(fixedDate_1);
    }

    //maybe its date
    let secondDate = parseDate(value_2, referenceDate);

    if (null == secondDate) {

        //take unit from value
        let operations = getOperations(value_2);

        if (null == operations) {
            flashTooltip('unit-tooltip');
            return '';
        }

        return formatMoment(operations.reduce((acc, s) => acc.add(s.num, s.unit), fixedDate_1));
    }

    let fixedDate_2 = fixDate(secondDate, secondDate.start.moment()),
        duration = moment.duration(makeDiff(fixedDate_1, fixedDate_2));

    LAST_DURATION = duration;

    return formatDuration(duration, fixedDate_1, fixedDate_2);
};

const renderResult = function (text) {

    if (!text) {
        return;
    }

    document.getElementById('result').innerHTML = text;

    let zone = document.getElementById('timezone');

    if (null != zone) {
        zone.innerHTML = LAST_ZONE;
    }
};

const runCalc = function () {

    let inputs = Array.from(document.getElementsByClassName('input'));

    renderResult(calcRes(inputs, SHARED_REFERENCE));
};

const onKeyUp = function (e) {

    let isEnterPress = ENTER_KEY === e.keyCode;

    if (!isEnterPress) {
        return;
    }

    runCalc();

    if (guideStage > 0) {

        let unitResultTooltip = document.getElementById('unit-result-tooltip'),
            dateResultTooltip = document.getElementById('date-result-tooltip');

        if (isNotVisible(unitResultTooltip) && guideStage === 1) {
            toggleOpacity(unitResultTooltip);
        }

        if (isNotVisible(dateResultTooltip) && guideStage === 2) {
            toggleOpacity(dateResultTooltip);
        }

    }

};

const makeDiff = function (a, b) {
    return a.diff(b);
};

const formatTotalDays = function (duration) {

    let days = Math.abs(duration.asDays());

    return (days === Math.trunc(days) ? days : days.toFixed(2)) + ' days';
};

const formatDuration = function (duration, date1, date2, showDays) {

    //idk its bug or not; but fore me as a user i want to see date as expected. See 'format duration test'
    if (date1 != null && date2 != null && (date1.year() !== date2.year() && (date1.date() === date2.date() && date1.month() === date2.month()))) {
        return duration.humanize();
    }

    //now its suits, but can be as different func
    if (showDays) {
        return formatTotalDays(duration);
    }

    let s = [
        {val: duration.years(), unit: 'years'},
        {val: duration.months(), unit: 'months'},
        {val: duration.days(), unit: 'days'},
        {val: duration.hours(), unit: 'hours'},
        {val: duration.minutes(), unit: 'minutes'},
        {val: duration.seconds(), unit: 'seconds'}
    ];

    let result = '';

    for (let i = 0; i < s.length; i++) {
        const elem = s[i];
        //ignore hours and rest if its null
        if (!elem.val) {
            continue;
        }

        result += Math.abs(elem.val) + ' ' + elem.unit + ' ';
    }

    return result.trim();
};

const parseDate = function (string, /*for tests*/ referenceDate) {

    if (DURATION.test(string)) {
        return null;
    }

    //easy, but bad, it parse words-dates, ether way u need to known all words
    let isDate = chrono.parseDate(string, referenceDate) !== null,
        params = {forwardDate: true};

    if (isDate) {
        string = HAS_TIME_REGEX.test(string) ? string : string + ' 00:00:00';
    }

    //не понятно почему либа сама это не умеет
    if (RUS_DATE_REGEX.test(string)) {
        return chrono.en_GB.parse(string, referenceDate, {forwardDate: true})[0];
    }

    return chrono.parse(string, referenceDate, params)[0];
};


const fixDate = function (chronoObj, momentDate) {

    if (chronoObj.text === 'today') {
        return momentDate.startOf('day')
    }

    return momentDate;
};


const baseUrl = function () {
    return location.href.split('#')[0].split('?')[0];
};

const buildShareUrl = function () {

    let inputs = document.getElementsByClassName('input'),
        params = new URLSearchParams();

    params.set(SHARE_DATE, inputs[0].value.trim());
    params.set(SHARE_UNIT, inputs[1].value.trim());
    params.set(SHARE_REF, String(Date.now()));

    let zone = localZone();

    if (zone) {
        params.set(SHARE_ZONE, zone);
    }

    return baseUrl() + '?' + params.toString();
};

const copyText = function (text) {

    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
    }

    return new Promise((resolve, reject) => {

        let area = document.createElement('textarea');

        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';

        document.body.appendChild(area);
        area.select();

        let copied = document.execCommand('copy');

        document.body.removeChild(area);

        copied ? resolve() : reject();
    });
};

const showCopied = function (text) {

    let elem = document.getElementsByClassName('copy-text')[0];

    elem.innerHTML = text;
    elem.classList.remove('hidden');

    window.clearTimeout(copiedTimerId);

    copiedTimerId = window.setTimeout(() => {
        elem.classList.add('hidden');
        copiedTimerId = null;
    }, COPIED_MS);
};

const onShare = function () {

    let inputs = document.getElementsByClassName('input');

    if (inputs[0].value.trim().length === 0) {
        flashTooltip('date-tooltip');
        return;
    }

    let url = buildShareUrl();

    history.replaceState(null, '', url);

    copyText(url)
        .then(() => showCopied('Copied!'))
        .catch(() => showCopied('Copy from address bar'));
};

const clearSharedState = function () {

    if (null == SHARED_REFERENCE && null == SHARED_ZONE) {
        return;
    }

    SHARED_REFERENCE = null;
    SHARED_ZONE = null;

    history.replaceState(null, '', baseUrl());
};

const applySharedState = function () {

    let params = new URLSearchParams(location.search),
        date = params.get(SHARE_DATE);

    if (null == date) {
        return false;
    }

    let inputs = document.getElementsByClassName('input');

    inputs[0].value = date;
    inputs[1].value = params.get(SHARE_UNIT) || '';

    let ref = Number(params.get(SHARE_REF));

    SHARED_REFERENCE = Number.isFinite(ref) && ref > 0 ? new Date(ref) : null;
    SHARED_ZONE = params.get(SHARE_ZONE);

    return true;
};


const toggleGuide = function (e) {

    if (guideStage !== 0 && e.type === 'click') {
        e = {type: 'system'};
    }

    guideStage = 0;

    let next = document.getElementsByClassName('next')[0],
        prev = document.getElementsByClassName('prev')[0]

    next.classList.toggle('hidden');
    prev.classList.toggle('hidden');

    let inputs = document.getElementsByClassName('input'),
        input_1 = inputs[0],
        input_2 = inputs[1],
        tooltips = document.getElementById('tooltips');

    input_1.value = null;
    input_2.value = null;
    input_1.readOnly = false;
    input_2.readOnly = false;

    LAST_ZONE = '';
    renderResult('');

    Array.from(tooltips.children).forEach(a => {
        if (!a.classList.contains('opacity-0')) {
            toggleOpacity(a)
        }
    });

    if (e.type === 'click') {
        toggleStage(true);
    }
};

const toggleStage = function (isNext) {

    if (isNext) {
        guideStage = guideStage + 1;
    } else {
        guideStage = guideStage - 1;
    }

    let inputs = document.getElementsByClassName('input'),
        input_1 = inputs[0],
        input_2 = inputs[1];

    if (guideStage > 3) {
        toggleGuide({type: 'system'});
    }

    let pressEnterTooltip = document.getElementById('press-enter-tooltip'),
        putUnitTooltip = document.getElementById('put-unit-tooltip'),
        putDateTooltip = document.getElementById('put-date-tooltip'),
        unitResultTooltip = document.getElementById('unit-result-tooltip');

    if (guideStage === 1) {
        input_1.value = '22.11.1996';
        input_2.value = '33y';
        LAST_ZONE = '';
        renderResult('');
        input_1.readOnly = true;
        input_2.readOnly = true;

        //show explanations
        toggleOpacity(pressEnterTooltip)
        toggleOpacity(putUnitTooltip)
        toggleOpacity(putDateTooltip)
        onKeyUp({keyCode: ENTER_KEY})
    }

    let putSecondDateTooltip = document.getElementById('put-second-date-tooltip'),
        dateResultTooltip = document.getElementById('date-result-tooltip');

    if (guideStage === 2) {

        //hide prev explanations
        toggleOpacity(pressEnterTooltip)
        toggleOpacity(putUnitTooltip)
        toggleOpacity(putDateTooltip)
        if (false === isNotVisible(unitResultTooltip)) {
            toggleOpacity(unitResultTooltip);
        }

        input_1.value = '22.11.1996';
        input_2.value = '18.11.2115';
        LAST_ZONE = '';
        renderResult('');
        input_1.readOnly = true;
        input_2.readOnly = true;

        toggleOpacity(pressEnterTooltip)
        toggleOpacity(putDateTooltip)
        toggleOpacity(putSecondDateTooltip)
        onKeyUp({keyCode: ENTER_KEY})
    }

    let putWordsTooltip = document.getElementById('put-words-tooltip');

    if (guideStage === 3) {

        //hide prev explanations
        toggleOpacity(pressEnterTooltip)
        toggleOpacity(putDateTooltip)
        toggleOpacity(putSecondDateTooltip)
        if (false === isNotVisible(dateResultTooltip)) {
            toggleOpacity(dateResultTooltip);
        }

        input_1.value = 'now';
        input_2.value = 'next friday';
        LAST_ZONE = '';
        renderResult('');
        input_1.readOnly = true;
        input_2.readOnly = true;

        toggleOpacity(pressEnterTooltip)
        toggleOpacity(putWordsTooltip)
        onKeyUp({keyCode: ENTER_KEY})
    }

};

//check requests to other sites
window.onload = function () {

    let inputs = Array.from(document.getElementsByClassName('input'));

    inputs.forEach(input => {
        //cleans at refresh
        input.value = null;
        input.addEventListener('keyup', onKeyUp)
    })

    let questionMark = document.getElementsByClassName('question-mark')[0],
        next = document.getElementsByClassName('next')[0],
        prev = document.getElementsByClassName('prev')[0],
        share = document.getElementById('share-btn');

    questionMark.addEventListener('click', toggleGuide);
    next.addEventListener('click', () => toggleStage(true));
    prev.addEventListener('click', () => toggleStage(false));
    share.addEventListener('click', onShare);

    document.getElementById('result').addEventListener('click', (e) => {

        if (LAST_DURATION) {
            e.target.innerHTML = e.target.innerHTML + ' (' + formatTotalDays(LAST_DURATION) + ')';
            LAST_DURATION = false;
        }

    });

    if (applySharedState()) {
        runCalc();
        clearSharedState();
    }
}