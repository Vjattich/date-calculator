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

const CALENDAR_URL = 'https://calendar.google.com/calendar/render';
const CALENDAR_MINUTES = 60;

let LAST_DURATION = false;
let LAST_DATE = null;
let LAST_TITLE = '';
let LAST_ZONE = '';

let SHARED_REFERENCE = null;
let SHARED_ZONE = null;

let copiedTimerId = null;

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

//if time without clockunit don't need to render it
const hasClockUnit = function (momentDate) {
    return 0 !== (momentDate.hours() || momentDate.minutes() /*|| momentDate.seconds()*/);
};

const formatMoment = function (momentDate) {
    return momentDate.format(hasClockUnit(momentDate) ? CLOCK_PATTERN : DATE_PATTERN);
};

const keepDate = function (momentDate, title) {

    LAST_DATE = momentDate.clone();
    LAST_TITLE = title;

    return formatMoment(momentDate);
};

const calcRes = function (inputs, referenceDate) {

    LAST_DURATION = false;
    LAST_DATE = null;
    LAST_TITLE = '';
    LAST_ZONE = '';

    let elements = toElement(inputs),
        value_1 = elements[DATE_INPUT_NUMBER].value.trim(),
        value_2 = elements[ADD_INPUT_NUMBER].value.trim();

    if (0 === value_1.length) {
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

    if (0 === value_2.length) {
        return keepDate(fixedDate_1, value_1);
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

        return keepDate(operations.reduce((acc, s) => acc.add(s.num, s.unit), fixedDate_1), value_1 + ' ' + value_2);
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

    let calendar = document.getElementById('calendar-holder');

    if (null != calendar) {
        calendar.classList.toggle('hidden', null == LAST_DATE);
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


const buildCalendarUrl = function () {

    if (null == LAST_DATE) {
        return null;
    }

    let start = LAST_DATE.clone(),
        params = new URLSearchParams();

    params.set('action', 'TEMPLATE');
    params.set('text', LAST_TITLE);

    if (hasClockUnit(start)) {
        params.set('dates', start.format('YYYYMMDD[T]HHmmss') + '/' + start.clone().add(CALENDAR_MINUTES, 'minutes').format('YYYYMMDD[T]HHmmss'));
    } else {
        params.set('dates', start.format('YYYYMMDD') + '/' + start.clone().add(1, 'day').format('YYYYMMDD'));
    }

    let zone = localZone();

    if (zone) {
        params.set('ctz', zone);
    }

    return CALENDAR_URL + '?' + params.toString();
};

const onCalendar = function () {

    let url = buildCalendarUrl();

    if (null == url) {
        return;
    }

    window.open(url, '_blank', 'noopener');
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

        //fix deprecated
        const copied = document.execCommand('copy');

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


//check requests to other sites
window.onload = function () {

    let inputs = Array.from(document.getElementsByClassName('input'));

    inputs.forEach(input => {
        //cleans at refresh
        input.value = null;
        input.addEventListener('keyup', onKeyUp)
    })

    document.getElementById('share-btn').addEventListener('click', onShare);
    document.getElementById('calendar-btn').addEventListener('click', onCalendar);

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