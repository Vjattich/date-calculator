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
    воскресенье: 'Sunday', воскресенья: 'Sunday', вс: 'Sunday',

    'следующей неделе': 'next week', 'следующая неделя': 'next week', 'след неделе': 'next week', 'след неделя': 'next week',
    'прошлой неделе': 'last week', 'прошлая неделя': 'last week',
    'предыдущей неделе': 'last week', 'предыдущая неделя': 'last week',
    'этой неделе': 'this week', 'эта неделя': 'this week', 'текущей неделе': 'this week', 'текущая неделя': 'this week',
    'следующем месяце': 'next month', 'следующий месяц': 'next month', 'след месяце': 'next month', 'след месяц': 'next month',
    'прошлом месяце': 'last month', 'прошлый месяц': 'last month',
    'предыдущем месяце': 'last month', 'предыдущий месяц': 'last month',
    'этом месяце': 'this month', 'этот месяц': 'this month', 'текущем месяце': 'this month', 'текущий месяц': 'this month',
    'следующем году': 'next year', 'следующий год': 'next year', 'след году': 'next year', 'след год': 'next year',
    'прошлом году': 'last year', 'прошлый год': 'last year',
    'предыдущем году': 'last year', 'предыдущий год': 'last year',
    'этом году': 'this year', 'этот год': 'this year', 'текущем году': 'this year', 'текущий год': 'this year',
    'через неделю': 'in 1 week', 'через месяц': 'in 1 month', 'через год': 'in 1 year',
    'через день': 'in 1 day', 'через час': 'in 1 hour', 'через минуту': 'in 1 minute',

    следующий: 'next', следующая: 'next', следующее: 'next', следующую: 'next',
    следующей: 'next', следующего: 'next', следующем: 'next', следующим: 'next', след: 'next',
    будущий: 'next', будущая: 'next', будущую: 'next', будущем: 'next',
    прошлый: 'last', прошлая: 'last', прошлую: 'last', прошлой: 'last',
    прошлого: 'last', прошлом: 'last', прошлые: 'last',
    предыдущий: 'last', предыдущая: 'last', предыдущую: 'last',
    предыдущей: 'last', предыдущем: 'last', предыдущего: 'last', пред: 'last',
    этот: 'this', эта: 'this', эту: 'this', этой: 'this', этого: 'this', этом: 'this',
    текущий: 'this', текущая: 'this', текущую: 'this', текущем: 'this'
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
//the spelled-out russian units only, single letters are too easy to hit by accident
const RU_UNIT_ALTERNATION = Object.keys(UNITS)
    .filter(unit => 1 < unit.length && new RegExp('^[' + RU_LETTERS + ']+$').test(unit))
    .sort((a, b) => b.length - a.length)
    .join('|');
const RU_IN_REGEX = new RegExp('через\\s+(\\d+)\\s*(' + RU_UNIT_ALTERNATION + ')(?![' + RU_LETTERS + '])', 'gi');
const RU_AGO_REGEX = new RegExp('(\\d+)\\s*(' + RU_UNIT_ALTERNATION + ')(?![' + RU_LETTERS + '])\\s+назад', 'gi');
const BACKWARD_REGEX = new RegExp('\\b(last|past|ago|yesterday)\\b', 'i');
//chrono ships more than english, so a date written anywhere else still lands
const CHRONO_LOCALES = ['ru', 'uk', 'fr', 'nl', 'de', 'es', 'pt', 'it', 'fi', 'sv', 'ja', 'vi'];
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
//"* 2 days", "every 2 weeks", "каждые 3 дня" — the second field turns into a repeat step
const PATTERN_REGEX = new RegExp('^\\s*(?:\\*|x|х|every|each|кажд[а-яё]*)\\s*(.+)$', 'i');
//picked days live in the first field, one date per comma
const SEED_SEPARATOR = ',';
//a step of one day still has to stop somewhere, otherwise a far seed loops forever
const PATTERN_LIMIT = 4000;
const LONG_PRESS_MS = 450;
//a finger never holds perfectly still, so a small drift is still a press
const PRESS_SLOP = 12;
const RRULE_FREQ = {
    years: 'YEARLY', year: 'YEARLY',
    months: 'MONTHLY', month: 'MONTHLY',
    weeks: 'WEEKLY', week: 'WEEKLY',
    days: 'DAILY', day: 'DAILY'
};

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
//every day the answer names, so a pattern can mark more than one
let LAST_DATES = [];
//both ends of a date-to-date result, so the grid can paint the span
let LAST_RANGE = null;
//month the grid is looking at, moves with the arrows
let CAL_MONTH = null;
//the grid stays put while the user is picking days on it
let CAL_HOLD = false;

//the repeat step, same shape as getOperations returns
let PATTERN_STEP = null;
//what the step actually repeats from: the picked days, or the typed date alone
let PATTERN_SEEDS = [];
//the real repeat: the picked block padded out to whole units, plus the step
let PATTERN_CYCLE = null;

let pressTimerId = null;
let pressAt = null;
let pressHandled = false;

let SHARED_ZONE = null;

//every chrono locale the bundle actually carries, filled on the first parse
let PARSERS = null;

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
    LAST_DATES = [LAST_DATE.clone()];
    LAST_TITLE = title;

    return formatMoment(momentDate);
};

//the same shape the first field uses, so an answer can be pasted straight back in
const formatPick = function (momentDate) {
    return momentDate.format(CAL_INPUT_PATTERN) + (hasClockUnit(momentDate) ? momentDate.format(' HH:mm:ss') : '');
};

const keepDates = function (moments, title) {

    LAST_DATES = moments.map(one => one.clone());
    //the icons and the grid anchor still work off a single day, and the first one is it
    LAST_DATE = LAST_DATES[0].clone();
    LAST_TITLE = title;

    return LAST_DATES.map(formatPick).join(SEED_SEPARATOR + ' ');
};

//a repeat has no direction and cannot stand still, "* -2 days" is the same as "* 2 days"
const patternStepOf = function (value) {

    let match = value.match(PATTERN_REGEX);

    if (null == match) {
        return null;
    }

    let rest = match[1].trim(),
        //"every week" is "every 1 week"
        operations = getOperations(/\d/.test(rest) ? rest : '1 ' + rest);

    if (null == operations) {
        return null;
    }

    operations = operations.map(op => ({num: Math.abs(op.num), unit: op.unit}));

    return operations.some(op => 0 < op.num) ? operations : null;
};

const stepBy = function (day, direction) {
    return PATTERN_CYCLE.reduce((acc, op) => acc.add(direction * op.num, op.unit), day.clone());
};

const stepLabel = function () {
    return PATTERN_CYCLE.map(op => op.num + ' ' + op.unit).join(' ');
};

//how many whole units of the step the picked days themselves cover
const blockUnits = function (first, last, unit) {

    let units = 1;

    while (units < PATTERN_LIMIT && !first.clone().add(units, unit).isAfter(last, 'day')) {
        units++;
    }

    return units;
};

//"two days on, two days off": the block is padded to whole units, then the step is the gap after it
const cycleOf = function (seeds) {

    let sorted = seeds.slice().sort((a, b) => a - b),
        //getOperations puts the smallest unit first, and that is the one the block is measured in
        smallest = PATTERN_STEP[0],
        units = blockUnits(sorted[0], sorted[sorted.length - 1], smallest.unit);

    return PATTERN_STEP.map((op, i) => 0 === i ? {num: op.num + units, unit: op.unit} : op);
};

//days and weeks are always the same length, months and years are not
const stepDays = function () {

    let days = 0;

    for (let i = 0; i < PATTERN_CYCLE.length; i++) {

        let op = PATTERN_CYCLE[i];

        if ('days' === op.unit || 'day' === op.unit) {
            days += op.num;
        } else if ('weeks' === op.unit || 'week' === op.unit) {
            days += op.num * 7;
        } else {
            return 0;
        }
    }

    return days;
};

//a fixed step lands next to the edge in one jump, so a seed years away costs nothing to draw
const alignSeed = function (seed, edge) {

    let days = stepDays();

    if (0 === days) {
        return seed.clone();
    }

    //floor keeps the landing at or before the edge, the walk after it does the last steps
    let jumps = Math.floor(edge.diff(seed, 'days') / days);

    //a pattern starts on the day that was picked, it never runs backwards out of it
    return jumps < 0 ? seed.clone() : seed.clone().add(jumps * days, 'days');
};

//"December 25, 2026" splits into a date and a bare year, and a bare year names no day of its own
const standsAlone = function (found, part) {
    return !/\d/.test(part) || found.start.isCertain('day');
};

//english dates carry commas of their own, so a split only counts when every piece is a date by itself
const splitSeeds = function (value, referenceDate) {

    let parts = value.split(SEED_SEPARATOR)
        .map(part => part.trim())
        .filter(part => 0 !== part.length);

    if (parts.length < 2) {
        return null;
    }

    let found = parts.map(part => parseDate(part, referenceDate));

    if (found.some((one, i) => null == one || !standsAlone(one, parts[i]))) {
        return null;
    }

    return found.map(one => fixDate(one, one.start.moment()));
};

const seedKeys = function (value, referenceDate) {

    let found = splitSeeds(value, referenceDate);

    return null == found ? [] : found.map(one => one.format(CAL_KEY));
};

//the grid reads the picks straight off the field, so typing and clicking cannot drift apart
const pickedKeys = function () {

    let input = document.getElementsByClassName('input')[0];

    return null == input ? [] : seedKeys(input.value.trim());
};

//the whole block moves together, so every picked day gets the same cycle added to it
const findNextDates = function () {
    return PATTERN_SEEDS.map(seed => stepBy(seed, 1));
};

//only the repeats the grid can actually show, walked out from every seed
const patternMarks = function (month) {

    let marks = new Set();

    if (null == PATTERN_CYCLE || 0 === PATTERN_SEEDS.length) {
        return marks;
    }

    let from = firstCell(month),
        to = from.clone().add(CAL_CELLS - 1, 'days');

    for (let i = 0; i < PATTERN_SEEDS.length; i++) {

        let day = alignSeed(PATTERN_SEEDS[i], from);

        for (let n = 0; n < PATTERN_LIMIT && !day.isAfter(to, 'day'); n++) {

            if (!day.isBefore(from, 'day')) {
                marks.add(day.format(CAL_KEY));
            }

            day = stepBy(day, 1);
        }
    }

    return marks;
};

const dropPattern = function () {

    PATTERN_STEP = null;
    PATTERN_CYCLE = null;
    PATTERN_SEEDS = [];

    return '';
};

const calcPattern = function (value, referenceDate) {

    if (0 === value.length) {
        flashTooltip('pattern-tooltip');
        return dropPattern();
    }

    let picked = splitSeeds(value, referenceDate);

    if (null == picked) {

        let one = parseDate(value, referenceDate);

        if (null == one) {
            flashTooltip('date-tooltip');
            return dropPattern();
        }

        picked = [fixDate(one, one.start.moment())];
    }

    PATTERN_SEEDS = picked;
    PATTERN_CYCLE = cycleOf(picked);

    let nextDates = findNextDates();

    if (0 === nextDates.length) {
        flashTooltip('pattern-tooltip');
        return dropPattern();
    }

    LAST_ZONE = zoneLabel(nextDates[0]) + ' · every ' + stepLabel();

    return keepDates(nextDates, 'every ' + stepLabel());
};

const calcRes = function (inputs, referenceDate) {

    LAST_DURATION = false;
    LAST_DATE = null;
    LAST_DATES = [];
    LAST_TITLE = '';
    LAST_ZONE = '';
    LAST_RANGE = null;

    dropPattern();

    let elements = toElement(inputs),
        value_1 = elements[DATE_INPUT_NUMBER].value.trim(),
        value_2 = elements[ADD_INPUT_NUMBER].value.trim();

    PATTERN_STEP = patternStepOf(value_2);

    if (null != PATTERN_STEP) {
        return calcPattern(value_1, referenceDate);
    }

    if (0 === value_1.length) {
        return '';
    }

    //a list of picks with no step yet: the answer is the list itself, so the grid marks all of it
    let picked = splitSeeds(value_1, referenceDate);

    if (null != picked) {

        LAST_ZONE = zoneLabel(picked[0]);

        return keepDates(picked, value_1);
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

    if (LAST_DATES.some(one => day.isSame(one, 'day'))) {
        return true;
    }

    if (null == LAST_RANGE) {
        return false;
    }

    return day.isSame(LAST_RANGE.from, 'day') || day.isSame(LAST_RANGE.to, 'day');
};

const dayClass = function (day, month, today, marks, picked) {

    let classes = ['cal-day'],
        key = day.format(CAL_KEY);

    if (day.month() !== month.month()) {
        classes.push('cal-out');
    }

    if (day.isSame(today, 'day')) {
        classes.push('cal-today');
    }

    if (isBetween(day)) {
        classes.push('cal-range');
    }

    if (marks.has(key)) {
        classes.push('cal-pattern');
    }

    if (isPicked(day) || -1 !== picked.indexOf(key)) {
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
        marks = patternMarks(month),
        picked = pickedKeys(),
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
            + ' class="' + dayClass(day, month, today, marks, picked) + '"'
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

    //picking a day must not throw the month away under the finger that picked it
    if (null != anchor && !CAL_HOLD) {
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

//the field already holds one date without a comma, so it joins the list rather than being replaced
const currentKeys = function (value) {

    let keys = seedKeys(value);

    if (0 !== keys.length || 0 === value.length) {
        return keys;
    }

    let one = parseDate(value);

    return null == one ? [] : [fixDate(one, one.start.moment()).format(CAL_KEY)];
};

const toggleSeed = function (key) {

    let input = document.getElementsByClassName('input')[0],
        keys = currentKeys(input.value.trim()),
        at = keys.indexOf(key);

    if (-1 === at) {
        keys.push(key);
    } else {
        keys.splice(at, 1);
    }

    keys.sort();

    input.value = keys
        .map(one => moment(one, CAL_KEY).format(CAL_INPUT_PATTERN))
        .join(SEED_SEPARATOR + ' ');

    CAL_HOLD = true;
    runCalc();
    CAL_HOLD = false;
};

const cancelPress = function () {

    window.clearTimeout(pressTimerId);

    pressTimerId = null;
    pressAt = null;
};

//touch has no shift key, so holding a day does the same job
const onCalendarPointerDown = function (e) {

    if ('mouse' === e.pointerType) {
        return;
    }

    let cell = e.target.closest('.cal-day');

    if (null == cell) {
        return;
    }

    let key = cell.dataset.day;

    pressHandled = false;
    pressAt = {x: e.clientX, y: e.clientY};

    window.clearTimeout(pressTimerId);

    pressTimerId = window.setTimeout(() => {
        pressTimerId = null;
        pressHandled = true;
        toggleSeed(key);
    }, LONG_PRESS_MS);
};

const onCalendarPointerMove = function (e) {

    if (null == pressAt) {
        return;
    }

    if (PRESS_SLOP < Math.abs(e.clientX - pressAt.x) + Math.abs(e.clientY - pressAt.y)) {
        cancelPress();
    }
};

const onCalendarClick = function (e) {

    //the long press already answered, the click it drags behind it is noise
    if (pressHandled) {
        pressHandled = false;
        return;
    }

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

    if (e.shiftKey) {
        toggleSeed(cell.dataset.day);
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
    LAST_DATES = [];
    LAST_TITLE = '';
    LAST_ZONE = '';
    LAST_RANGE = null;

    dropPattern();

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

//a list of dates outgrows a field sized for one
const fitInput = function (input) {
    input.classList.toggle('input-wide', -1 !== input.value.indexOf(SEED_SEPARATOR));
};

const runCalc = function () {

    let inputs = Array.from(document.getElementsByClassName('input'));

    fitInput(inputs[0]);

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

//chrono reads english best, so swap the russian words it knows about before parsing
const translate = function (string) {
    return string
        .replace(RU_WORDS_REGEX, (all, before, word) => before + RU_WORDS[word.toLowerCase()])
        .replace(RU_IN_REGEX, (all, num, unit) => 'in ' + num + ' ' + formatUnits(unit))
        .replace(RU_AGO_REGEX, (all, num, unit) => num + ' ' + formatUnits(unit) + ' ago')
        .replace(CASE_REGEX, capitalize);
};

//chrono.min.js loads after this file, so the list can only be built on the first parse
const localeParsers = function () {

    if (null != PARSERS) {
        return PARSERS;
    }

    PARSERS = [];

    for (let i = 0; i < CHRONO_LOCALES.length; i++) {

        let parser = chrono[CHRONO_LOCALES[i]];

        if (null != parser && 'function' === typeof parser.parse) {
            PARSERS.push(parser);
        }
    }

    if (null != chrono.zh && null != chrono.zh.hant) {
        PARSERS.push(chrono.zh.hant);
    }

    return PARSERS;
};

//forwardDate drags a bare date into the future, which is wrong once the text says otherwise
const parseWith = function (parser, string, referenceDate) {
    return parser.parse(string, referenceDate, {forwardDate: !BACKWARD_REGEX.test(string)})[0];
};

//chrono puts a bare date at midday, the app wants the day itself with no clock on it
const parseAtMidnight = function (parser, string, referenceDate) {

    let found = parseWith(parser, string, referenceDate);

    if (null == found || HAS_TIME_REGEX.test(string)) {
        return found;
    }

    return parseWith(parser, string + ' 00:00:00', referenceDate) || found;
};

const parseDate = function (string, /*for tests*/ referenceDate) {

    string = translate(string);

    if (DURATION.test(string)) {
        return null;
    }

    //chrono default is month-first (US), en_GB is day-first
    let english = RUS_DATE_REGEX.test(string) ? chrono.en_GB : chrono,
        found = parseAtMidnight(english, string, referenceDate);

    if (null != found) {
        return found;
    }

    //english had nothing, the words may belong to another language chrono knows
    let rest = localeParsers();

    for (let i = 0; i < rest.length; i++) {

        found = parseAtMidnight(rest[i], string, referenceDate);

        if (null != found) {
            return found;
        }
    }

    return null;
};

const fixDate = function (chronoObj, momentDate) {

    if ('today' === chronoObj.text.toLowerCase()) {
        return momentDate.startOf('day')
    }

    return momentDate;
};

//google takes a single frequency, so a mixed step like "1 month 2 days" stays a one-off event
const patternRule = function () {

    if (null == PATTERN_CYCLE || 1 !== PATTERN_CYCLE.length) {
        return null;
    }

    let freq = RRULE_FREQ[PATTERN_CYCLE[0].unit];

    return null == freq ? null : 'RRULE:FREQ=' + freq + ';INTERVAL=' + PATTERN_CYCLE[0].num;
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

    let rule = patternRule();

    if (null != rule) {
        params.set('recur', rule);
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
    let view = document.getElementById('calendar-view');

    view.addEventListener('click', onCalendarClick);
    view.addEventListener('pointerdown', onCalendarPointerDown);
    view.addEventListener('pointermove', onCalendarPointerMove);
    view.addEventListener('pointerup', cancelPress);
    view.addEventListener('pointercancel', cancelPress);
    view.addEventListener('contextmenu', (e) => {

        //the hold is the gesture, the os menu would eat it
        if (null != e.target.closest('.cal-day')) {
            e.preventDefault();
        }
    });

    document.getElementById('result').addEventListener('click', (e) => {

        if (LAST_DURATION) {
            e.target.innerHTML = e.target.innerHTML + ' (' + formatTotalDays(LAST_DURATION) + ')';
            LAST_DURATION = false;
        }

    });

    //reset if pass empty
    inputs[0].addEventListener('input', () => {

        fitInput(inputs[0]);

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