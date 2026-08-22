const ENTER_KEY = 13;
const TAB_KEY = 9;
const IME_KEY = 229;
//anything already listening to the keyboard, so typing never steals a button press
const INTERACTIVE = 'input, textarea, select, button, a[href], [contenteditable="true"]';
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
    seconds: 'seconds', second: 'seconds', secs: 'seconds', sec: 'seconds', s: 'seconds',

    годы: 'years', года: 'years', год: 'year', лет: 'years', г: 'year',
    месяцы: 'months', месяца: 'months', месяц: 'month', месяцев: 'months', мес: 'months',
    недели: 'weeks', неделя: 'week', недель: 'weeks', нед: 'weeks', н: 'weeks',
    дни: 'days', дня: 'days', день: 'day', дней: 'days', д: 'days',
    часы: 'hours', часа: 'hours', час: 'hour', часов: 'hours', ч: 'hours',
    минуты: 'minutes', минута: 'minutes', минут: 'minutes', мин: 'minutes', м: 'minutes',
    секунды: 'seconds', секунда: 'seconds', секунд: 'seconds', сек: 'seconds', с: 'seconds'
};
const UNIT_ORDER = ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds'];
const RU_WORDS = {
    щас: 'now',
    сейчас: 'now',
    сегодня: 'today',
    завтра: 'tomorrow',
    послезавтра: 'in 2 days',
    вчера: 'yesterday',
    позавчера: '2 days ago',

    понедельник: 'Monday', понедельника: 'Monday', пн: 'Monday',
    вторник: 'Tuesday', вторника: 'Tuesday', вт: 'Tuesday',
    среда: 'Wednesday', среду: 'Wednesday', среды: 'Wednesday', ср: 'Wednesday',
    четверг: 'Thursday', четверга: 'Thursday', чт: 'Thursday',
    пятница: 'Friday', пятницу: 'Friday', пятницы: 'Friday', пт: 'Friday',
    суббота: 'Saturday', субботу: 'Saturday', субботы: 'Saturday', сб: 'Saturday',
    воскресенье: 'Sunday', воскресенья: 'Sunday', вс: 'Sunday'
};
const RU_LETTERS = 'а-яёА-ЯЁ';
const RU_WORDS_ALTERNATION = Object.keys(RU_WORDS)
    .sort((a, b) => b.length - a.length)
    .join('|');
const RU_WORDS_REGEX = new RegExp('(^|[^' + RU_LETTERS + '])(' + RU_WORDS_ALTERNATION + ')(?![' + RU_LETTERS + '])', 'gi');
//chrono only recognises these capitalised, so the input gets normalised first
const CASE_WORDS = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    'Mon', 'Tue', 'Tues', 'Wed', 'Thu', 'Thur', 'Thurs', 'Fri', 'Sat', 'Sun',
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
    'Jan', 'Feb', 'Mar', 'Apr', 'Jun', 'Jul', 'Aug', 'Sep', 'Sept', 'Oct', 'Nov', 'Dec'
];
const CASE_REGEX = new RegExp('\\b(' + CASE_WORDS.sort((a, b) => b.length - a.length).join('|') + ')\\b', 'gi');
const UNIT_ALTERNATION = Object.keys(UNITS)
    .sort((a, b) => b.length - a.length)
    .join('|');
const LETTERS = 'a-zA-Zа-яёА-ЯЁ';
const DURATION = new RegExp('^\\s*(?:[-+]?\\s*\\d+\\s*(?:' + UNIT_ALTERNATION + ')\\s*)+$', 'i');
const SEGMENT_GLOBAL = new RegExp('\\d+\\s*[' + LETTERS + ']+', 'g');
const SEGMENT_PARTS = new RegExp('(\\d+)\\s*([' + LETTERS + ']+)');
const CLOCK_PATTERN = 'DD.MM.YYYY HH:mm:ss dddd MMMM';
const DATE_PATTERN = 'DD.MM.YYYY dddd MMMM';
const SHARE_DATE = 'd';
const SHARE_UNIT = 'u';
const SHARE_ZONE = 'z';
const TOOLTIP_MS = 2000;
const COPIED_MS = 2000;
const TOOLTIP_TIMERS = {};
const CALENDAR_MINUTES = 60;
const CAL_DOW = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const CAL_CELLS = 42;
const CAL_KEY = 'YYYY-MM-DD';
const CAL_INPUT_PATTERN = 'DD.MM.YYYY';

const LOCAL_ZONE = (function () {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch (e) {
        return '';
    }
})();

const MOBILE_QUERY = window.matchMedia('(max-width: 768px)');

let LAST_DURATION = false;
let LAST_DATE = null;
let LAST_TITLE = '';
let LAST_ZONE = '';
//both ends of a date-to-date result, so the grid can paint the span
let LAST_RANGE = null;
//month the grid is looking at, moves with the arrows
let CAL_MONTH = null;

let SHARED_ZONE = null;

let copiedTimerId = null;

const isMobile = function () {
    return MOBILE_QUERY.matches;
};

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

const zoneLabel = function (momentDate) {

    let offset = 'UTC' + momentDate.format('Z'),
        label = LOCAL_ZONE ? LOCAL_ZONE + ' (' + offset + ')' : offset;

    if (SHARED_ZONE && SHARED_ZONE !== LOCAL_ZONE) {
        return label + ' · shared from ' + SHARED_ZONE;
    }

    return label;
};

//if time without clockunit don't need to render it
const hasClockUnit = function (momentDate) {
    return 0 !== (momentDate.hours() || momentDate.minutes() || momentDate.seconds());
}

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
    LAST_RANGE = null;

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
    LAST_RANGE = fixedDate_1.isAfter(fixedDate_2)
        ? {from: fixedDate_2.clone(), to: fixedDate_1.clone()}
        : {from: fixedDate_1.clone(), to: fixedDate_2.clone()};

    return formatDuration(duration, fixedDate_1, fixedDate_2);
};

//the date the grid opens on: the result itself, or the start of a span
const calAnchor = function () {

    if (null != LAST_DATE) {
        return LAST_DATE.clone();
    }

    if (null != LAST_RANGE) {
        return LAST_RANGE.from.clone();
    }

    return null;
};

const isBetween = function (day) {

    if (null == LAST_RANGE) {
        return false;
    }

    return !day.isBefore(LAST_RANGE.from, 'day') && !day.isAfter(LAST_RANGE.to, 'day');
};

const isPicked = function (day) {

    if (null != LAST_DATE && day.isSame(LAST_DATE, 'day')) {
        return true;
    }

    if (null == LAST_RANGE) {
        return false;
    }

    return day.isSame(LAST_RANGE.from, 'day') || day.isSame(LAST_RANGE.to, 'day');
};

const dayClass = function (day, month, today) {

    let classes = ['cal-day'];

    if (day.month() !== month.month()) {
        classes.push('cal-out');
    }

    if (day.isSame(today, 'day')) {
        classes.push('cal-today');
    }

    if (isBetween(day)) {
        classes.push('cal-range');
    }

    if (isPicked(day)) {
        classes.push('cal-sel');
    }

    return classes.join(' ');
};

//monday first, without leaning on the moment locale
const firstCell = function (month) {

    let first = month.clone().startOf('month');

    return first.subtract((first.day() + 6) % 7, 'days');
};

//one tabbable cell, so the grid costs a single tab stop instead of 42
const tabCell = function (month, today) {

    if (null != LAST_DATE && LAST_DATE.isSame(month, 'month')) {
        return LAST_DATE.format(CAL_KEY);
    }

    if (null != LAST_RANGE && LAST_RANGE.from.isSame(month, 'month')) {
        return LAST_RANGE.from.format(CAL_KEY);
    }

    if (today.isSame(month, 'month')) {
        return today.format(CAL_KEY);
    }

    return month.clone().startOf('month').format(CAL_KEY);
};

const calendarHtml = function (month) {

    let day = firstCell(month),
        today = moment(),
        stop = tabCell(month, today),
        html = '<div class="cal-head">'
            + '<button type="button" class="cal-nav" data-step="-1" aria-label="Previous month">&#8249;</button>'
            + '<span class="cal-title">' + month.format('MMMM YYYY') + '</span>'
            + '<button type="button" class="cal-nav" data-step="1" aria-label="Next month">&#8250;</button>'
            + '</div><div class="cal-grid">';

    for (let i = 0; i < CAL_DOW.length; i++) {
        html += '<span class="cal-dow">' + CAL_DOW[i] + '</span>';
    }

    for (let i = 0; i < CAL_CELLS; i++) {

        let key = day.format(CAL_KEY);

        html += '<button type="button" tabindex="' + (key === stop ? '0' : '-1') + '"'
            + ' class="' + dayClass(day, month, today) + '"'
            + ' data-day="' + key + '">' + day.date() + '</button>';

        day.add(1, 'days');
    }

    return html + '</div>';
};

const renderCalendar = function () {

    let holder = document.getElementById('calendar-view');

    if (null == holder) {
        return;
    }

    //the grid is always on screen, it just has nothing marked until a date parses
    if (null == CAL_MONTH) {
        CAL_MONTH = moment().startOf('month');
    }

    holder.innerHTML = calendarHtml(CAL_MONTH);
};

//jump the grid to the answer, or leave the month the user was browsing
const syncCalendar = function () {

    let anchor = calAnchor();

    if (null != anchor) {
        CAL_MONTH = anchor.startOf('month');
    }

    renderCalendar();
};

const toggleActions = function () {

    let actions = document.getElementsByClassName('actions')[0],
        calendar = document.getElementById('calendar-holder');

    //one fade for the column, so both icons always enter on the same frame
    if (null != actions) {
        actions.classList.toggle('hidden', null == LAST_DATE && null == LAST_RANGE);
    }

    //sharing works for any answer, google calendar needs a single date
    if (null != calendar) {
        calendar.classList.toggle('hidden', null == LAST_DATE);
    }
};

//a picked day keeps the time of day that field already carried
const clockOf = function (value) {

    let parsed = parseDate(value);

    if (null == parsed) {
        return '';
    }

    let time = parsed.start.moment();

    return hasClockUnit(time) ? ' ' + time.format('HH:mm:ss') : '';
};

const onCalendarClick = function (e) {

    let nav = e.target.closest('.cal-nav');

    if (null != nav) {

        let step = nav.dataset.step;

        CAL_MONTH.add(+step, 'months');

        renderCalendar();

        //the innerHTML swap drops focus, keyboard users would have to tab back
        let same = document.querySelector('.cal-nav[data-step="' + step + '"]');

        if (null != same) {
            same.focus();
        }

        return;
    }

    let cell = e.target.closest('.cal-day');

    if (null == cell) {
        return;
    }

    //ctrl/cmd fills the second field, unless the first one is still empty
    let inputs = document.getElementsByClassName('input'),
        second = (e.ctrlKey || e.metaKey) && 0 !== inputs[0].value.trim().length,
        input = second ? inputs[1] : inputs[0];

    input.value = moment(cell.dataset.day, CAL_KEY).format(CAL_INPUT_PATTERN) + clockOf(input.value);

    //a plain click is a new setup, so an old end date goes, while a duration stays
    if (!second && null != parseDate(inputs[1].value)) {
        inputs[1].value = '';
    }

    runCalc();
};

const renderResult = function (text) {

    //nothing parsed: keep the last answer on screen, the tooltip already said why
    if (!text && null == LAST_DATE && null == LAST_RANGE) {
        return;
    }

    if (text) {

        document.getElementById('result').innerHTML = text;

        let zone = document.getElementById('timezone');

        if (null != zone) {
            zone.innerHTML = LAST_ZONE;
        }
    }

    toggleActions();
    syncCalendar();
};

const renderEmpty = function () {

    LAST_DURATION = false;
    LAST_DATE = null;
    LAST_TITLE = '';
    LAST_ZONE = '';
    LAST_RANGE = null;

    let result = document.getElementById('result'),
        zone = document.getElementById('timezone');

    if (null != result) {
        result.innerHTML = '';
    }

    if (null != zone) {
        zone.innerHTML = '';
    }

    toggleActions();
    renderCalendar();
};

const runCalc = function () {

    let inputs = Array.from(document.getElementsByClassName('input'));

    //an empty first field is a reset, not a failed parse
    if (0 === inputs[0].value.trim().length) {
        renderEmpty();
        return '';
    }

    let text = calcRes(inputs);

    renderResult(text);

    return text;
};

const focusNext = function (input) {

    let inputs = Array.from(document.getElementsByClassName('input')),
        next = inputs[inputs.indexOf(input) + 1];

    if (null == next) {
        return false;
    }

    next.focus();

    //ios puts the caret at 0 on programmatic focus
    if ('text' === next.type) {
        next.setSelectionRange(next.value.length, next.value.length);
    }

    return true;
};

//tab is a loop over the two fields, the rest of the page is reached with escape first
const focusSibling = function (input, back) {

    let inputs = Array.from(document.getElementsByClassName('input')),
        at = inputs.indexOf(input);

    if (-1 === at) {
        return;
    }

    let next = inputs[(at + (back ? -1 : 1) + inputs.length) % inputs.length];

    next.focus();

    //native tab lands with the value selected, so typing replaces it
    next.select();
};

const onKeyDown = function (e) {

    if ('Tab' === e.key || TAB_KEY === e.keyCode) {
        e.preventDefault();
        focusSibling(e.target, e.shiftKey);
        return;
    }

    //a way out of the loop for keyboard users
    if ('Escape' === e.key) {
        e.target.blur();
        return;
    }

    if ('Enter' !== e.key && ENTER_KEY !== e.keyCode) {
        return;
    }

    //default 'Go' blurs the field and drops the soft keyboard
    e.preventDefault();

    //enter only moves forward until the last input, submit belongs to it
    if (focusNext(e.target)) {
        return;
    }

    runCalc();

    //closes the soft keyboard so the result is visible
    if (isMobile()) {
        e.target.blur();
    }
};

const isBusy = function () {

    let active = document.activeElement;

    return null != active && null != active.matches && active.matches(INTERACTIVE);
};

//one char is a letter or a digit, anything longer is a named key like ArrowLeft
const isPrintable = function (e) {
    return 1 === e.key.length && !e.ctrlKey && !e.metaKey && !e.altKey;
};

const isPaste = function (e) {
    return 'KeyV' === e.code && (e.ctrlKey || e.metaKey) && !e.altKey;
};

//desktop only: start typing anywhere and the first field takes it
const onPageKeyDown = function (e) {

    if (isMobile() || document.body.classList.contains('tutorial-on')) {
        return;
    }

    if (e.defaultPrevented || e.isComposing || IME_KEY === e.keyCode || isBusy()) {
        return;
    }

    if (!isPrintable(e) && !isPaste(e)) {
        return;
    }

    let first = document.getElementsByClassName('input')[0];

    if (null == first) {
        return;
    }

    //focus happens on keydown, so the character itself is typed into the field
    first.focus();
    first.setSelectionRange(first.value.length, first.value.length);
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

    result = result.trim();

    //every part was zero, so both dates are the same moment
    return 0 === result.length ? '0 days' : result;
};

const capitalize = function (word) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
};

//chrono has no russian locale, so swap the words it knows about before parsing
const translate = function (string) {
    return string
        .replace(RU_WORDS_REGEX, (all, before, word) => before + RU_WORDS[word.toLowerCase()])
        .replace(CASE_REGEX, capitalize);
};

const parseDate = function (string, /*for tests*/ referenceDate) {

    string = translate(string);

    if (DURATION.test(string)) {
        return null;
    }

    //easy, but bad, it parse words-dates, ether way u need to known all words
    let isDate = chrono.parseDate(string, referenceDate) !== null,
        params = {forwardDate: true};

    if (isDate) {
        string = HAS_TIME_REGEX.test(string) ? string : string + ' 00:00:00';
    }

    //chrono default is month-first (US), en_GB is day-first
    if (RUS_DATE_REGEX.test(string)) {
        return chrono.en_GB.parse(string, referenceDate, {forwardDate: true})[0];
    }

    return chrono.parse(string, referenceDate, params)[0];
};

const fixDate = function (chronoObj, momentDate) {

    if ('today' === chronoObj.text.toLowerCase()) {
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

    if (LOCAL_ZONE) {
        params.set('ctz', LOCAL_ZONE);
    }

    return 'https://calendar.google.com/calendar/render?' + params.toString();
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

    if (LOCAL_ZONE) {
        params.set(SHARE_ZONE, LOCAL_ZONE);
    }

    return baseUrl() + '?' + params.toString();
};

const copyText = function (text) {

    if (!navigator.clipboard) {
        return Promise.reject();
    }

    return navigator.clipboard.writeText(text);
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

    //nothing to share until it parses; calcRes flashes the tooltip itself
    if (!runCalc()) {
        return;
    }

    let url = buildShareUrl();

    history.replaceState(null, '', url);

    copyText(url)
        .then(() => isMobile() ? null : showCopied('Copied!'))
        .catch(() => showCopied('Copy from address bar'));
};

const clearSharedState = function () {

    if (null == SHARED_ZONE) {
        return;
    }

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

    SHARED_ZONE = params.get(SHARE_ZONE);

    return true;
};

window.onload = function () {

    let inputs = Array.from(document.getElementsByClassName('input'));

    inputs.forEach((input, i) => {
        //cleans at refresh
        input.value = null;
        input.setAttribute('enterkeyhint', i === inputs.length - 1 ? 'done' : 'next');
        input.addEventListener('keydown', onKeyDown)
    })

    document.addEventListener('keydown', onPageKeyDown);

    document.getElementById('share-btn').addEventListener('click', onShare);
    document.getElementById('calendar-btn').addEventListener('click', onCalendar);
    document.getElementById('calendar-view').addEventListener('click', onCalendarClick);

    document.getElementById('result').addEventListener('click', (e) => {

        if (LAST_DURATION) {
            e.target.innerHTML = e.target.innerHTML + ' (' + formatTotalDays(LAST_DURATION) + ')';
            LAST_DURATION = false;
        }

    });

    //reset if pass empty
    inputs[0].addEventListener('input', () => {

        if (0 === inputs[0].value.trim().length) {
            renderEmpty();
        }
    });

    renderCalendar();

    if (applySharedState()) {
        runCalc();
        clearSharedState();
    }
}