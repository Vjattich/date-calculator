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
    недели: 'weeks', неделя: 'week', неделю: 'week', недель: 'weeks', нед: 'weeks', н: 'weeks',
    дни: 'days', дня: 'days', день: 'day', дней: 'days', д: 'days',
    часы: 'hours', часа: 'hours', час: 'hour', часов: 'hours', ч: 'hours',
    минуты: 'minutes', минута: 'minutes', минуту: 'minutes', минут: 'minutes', мин: 'minutes', м: 'minutes',
    секунды: 'seconds', секунда: 'seconds', секунду: 'seconds', секунд: 'seconds', сек: 'seconds', с: 'seconds'
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

    январь: 'January', января: 'January', январе: 'January', янв: 'January',
    февраль: 'February', февраля: 'February', феврале: 'February', февр: 'February', фев: 'February',
    март: 'March', марта: 'March', марте: 'March', мар: 'March',
    апрель: 'April', апреля: 'April', апреле: 'April', апр: 'April',
    май: 'May', мая: 'May', мае: 'May',
    июнь: 'June', июня: 'June', июне: 'June', июн: 'June',
    июль: 'July', июля: 'July', июле: 'July', июл: 'July',
    август: 'August', августа: 'August', августе: 'August', авг: 'August',
    сентябрь: 'September', сентября: 'September', сентябре: 'September', сент: 'September', сен: 'September',
    октябрь: 'October', октября: 'October', октябре: 'October', окт: 'October',
    ноябрь: 'November', ноября: 'November', ноябре: 'November', нояб: 'November', ноя: 'November',
    декабрь: 'December', декабря: 'December', декабре: 'December', дек: 'December',

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

const CASUAL_DAYS = {today: 0, tomorrow: 1, tmr: 1, yesterday: -1};

const RU_LETTERS = 'а-яёА-ЯЁ';
//one cheap look before the three russian passes, an english string skips all of them
const HAS_RU_REGEX = new RegExp('[' + RU_LETTERS + ']');
const RU_ONLY_REGEX = new RegExp('^[' + RU_LETTERS + ']+$');
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
    .filter(unit => 1 < unit.length && RU_ONLY_REGEX.test(unit))
    .sort((a, b) => b.length - a.length)
    .join('|');
const RU_IN_REGEX = new RegExp('через\\s+(\\d+)\\s*(' + RU_UNIT_ALTERNATION + ')(?![' + RU_LETTERS + '])', 'gi');
const RU_AGO_REGEX = new RegExp('(\\d+)\\s*(' + RU_UNIT_ALTERNATION + ')(?![' + RU_LETTERS + '])\\s+назад', 'gi');
//"2е", "2-е", "2-го" is the day written the russian way, chrono only wants the number.
//'го' would eat "2 год", so a unit letter right after the tail keeps the tail
const RU_ORDINAL_REGEX = new RegExp('(\\d)\\s*-?\\s*(?:ого|ое|го|ый|й|е)(?![' + LETTERS + '])', 'gi');
//"2 of September" and "2nd of September" are the same day as "2 September"
const OF_REGEX = new RegExp('(\\d)\\s*(?:st|nd|rd|th)?\\s+of\\s+(?=[' + LETTERS + '])', 'gi');
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
//the weekday row never changes, so it is built once instead of on every render
const CAL_DOW_HTML = CAL_DOW.map(name => '<span class="cal-dow">' + name + '</span>').join('');
const CAL_CELLS = 42;
const CAL_KEY = 'YYYY-MM-DD';
const CAL_INPUT_PATTERN = 'DD.MM.YYYY';
const PLAIN_DATE_REGEX = new RegExp('^\\d{2}\\.\\d{2}\\.\\d{4}$');
//"* 2 days", "every 2 weeks", "каждые 3 дня" — the second field turns into a repeat step
const PATTERN_REGEX = new RegExp('^\\s*(?:\\*|x|х|every|each|кажд[а-яё]*)\\s*(.+)$', 'i');
const SEED_SEPARATOR = ',';
//a dash between spaces is never part of a date, so that split is taken as read; a bare one
//might be (1996-11-22, 25-12-2026), so it is only a separator when both halves prove they are days
const RANGE_REGEX = new RegExp('\\s+[-\u2013\u2014]\\s+');
const RANGE_DASHES = '-\u2013\u2014';
const RANGE_SEPARATOR = ' - ';
//three days written out still read as three days, a fourth is where a range wins
const RANGE_MIN = 4;
//a range is typed, so a typo like a year in the wrong field must not build a million days
const RANGE_LIMIT = 2000;
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

//a live collection, so the two fields are looked up once for the whole page
const INPUTS = document.getElementsByClassName('input');

let LAST_DURATION = false;
let LAST_TITLE = '';
let LAST_ZONE = '';
//every day the answer names, so a pattern can mark more than one
let LAST_DATES = [];
//both ends of a date-to-date result, so the grid can paint the span
let LAST_RANGE = null;
//the repeat behind the answer: {step, seeds}, kept because the grid draws it after the calc returns
let LAST_PATTERN = null;
//month the grid is looking at, moves with the arrows
let CAL_MONTH = null;
//the grid stays put while the user is picking days on it
let CAL_HOLD = false;

let pressTimerId = null;
let pressAt = null;
let pressHandled = false;
let PICK_ANCHOR = null;
let dragRange = null;
let menuFromMouse = false;

let SHARED_ZONE = null;

//every chrono locale the bundle actually carries, filled on the first parse
let PARSERS = null;

let copiedTimerId = null;

const isMobile = function () {
    return MOBILE_QUERY.matches;
};

const toElement = function (elements) {

    let map = {};

    for (let i = 0; i < elements.length; i++) {

        let pos = elements[i].classList[NUMBER_POSITION];

        map[pos] = {value: elements[i].value, pos: pos};
    }

    return map;
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

//the icons and the grid anchor work off a single day, and the first day the answer names is it
const lastDate = function () {
    return 0 === LAST_DATES.length ? null : LAST_DATES[0];
};

//the offset belongs to the answer, so every keep sets it from the day it is keeping
const keepDate = function (momentDate, title) {

    LAST_DATES = [momentDate.clone()];
    LAST_TITLE = title;
    LAST_ZONE = zoneLabel(momentDate);

    return formatMoment(momentDate);
};

//the same shape the first field uses, so an answer can be pasted straight back in
const keepDates = function (moments, title, note) {

    LAST_DATES = moments.map(one => one.clone());
    LAST_TITLE = title;
    LAST_ZONE = zoneLabel(LAST_DATES[0]) + (null == note ? '' : ' · ' + note);

    return formatPicks(LAST_DATES);
};

const formatPick = function (momentDate) {
    return momentDate.format(CAL_INPUT_PATTERN) + (hasClockUnit(momentDate) ? momentDate.format(' HH:mm:ss') : '');
};

//an unbroken run of plain days is what a range is short for, so it is written back as one
const isRun = function (moments) {

    if (moments.length < RANGE_MIN) {
        return false;
    }

    for (let i = 0; i < moments.length; i++) {

        if (hasClockUnit(moments[i])) {
            return false;
        }

        //a day is not always 24 hours, so the gap is compared as a date and not as a length
        if (0 < i && !moments[i].clone().subtract(1, 'days').isSame(moments[i - 1], 'day')) {
            return false;
        }
    }

    return true;
};

const formatPicks = function (moments) {

    if (isRun(moments)) {
        return formatPick(moments[0]) + RANGE_SEPARATOR + formatPick(moments[moments.length - 1]);
    }

    return moments.map(formatPick).join(SEED_SEPARATOR + ' ');
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

const stepBy = function (step, day) {
    return step.reduce((acc, op) => acc.add(op.num, op.unit), day.clone());
};

const stepLabel = function (step) {
    return step.map(op => op.num + ' ' + op.unit).join(' ');
};

const blockUnits = function (first, last, unit) {

    //diff lands on or just under the answer, so the walk that follows is a step or two, not a year
    let units = Math.max(1, last.diff(first, unit));

    while (units < PATTERN_LIMIT && !first.clone().add(units, unit).isAfter(last, 'day')) {
        units++;
    }

    return units;
};

//"four days on, four days off": a range is a block of days, so it comes round again after the
//block itself and then the step. A comma list is loose days, and each of those only takes the step
const cycleOf = function (step, seeds) {

    //getOperations puts the smallest unit first, and that is the one the block is measured in
    let units = blockUnits(seeds[0], seeds[seeds.length - 1], step[0].unit);

    return step.map((op, i) => 0 === i ? {num: op.num + units, unit: op.unit} : op);
};

//days and weeks are always the same length, months and years are not
const stepDays = function (step) {

    let days = 0;

    for (let i = 0; i < step.length; i++) {

        let op = step[i];

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
const alignSeed = function (step, seed, edge) {

    let days = stepDays(step);

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

const parseOne = function (value, referenceDate) {

    let found = parseDate(value, referenceDate);

    return null == found ? null : fixDate(found, found.start.moment());
};

//every way the value could be read as two ends: the spaced dash first, since that one is
//never part of a date, then each bare dash for "22.11.1996-25.11.1996"
const rangePairs = function (value) {

    let spaced = value.split(RANGE_REGEX);

    if (2 === spaced.length) {
        return [spaced];
    }

    let pairs = [];

    //never the first or last character: an end of a range cannot be empty
    for (let i = 1; i < value.length - 1; i++) {

        if (-1 !== RANGE_DASHES.indexOf(value[i])) {
            pairs.push([value.slice(0, i), value.slice(i + 1)]);
        }
    }

    return pairs;
};

//the same test the comma list uses: the "1996" out of 1996-11-22 is a year, and a year is
//not an end, because an end has to name a day of its own
const rangeEnd = function (part, referenceDate) {

    let text = part.trim();

    if (0 === text.length) {
        return null;
    }

    let found = parseDate(text, referenceDate);

    return null == found || !standsAlone(found, text) ? null : fixDate(found, found.start.moment());
};

const rangeDays = function (pair, referenceDate) {

    let from = rangeEnd(pair[0], referenceDate),
        to = rangeEnd(pair[1], referenceDate);

    if (null == from || null == to) {
        return null;
    }

    //a range has two ends and no direction, whichever order they were typed in
    if (from.isAfter(to)) {
        let swap = from;
        from = to;
        to = swap;
    }

    let all = [],
        day = from.clone();

    while (!day.isAfter(to, 'day') && all.length <= RANGE_LIMIT) {
        all.push(day.clone());
        day.add(1, 'days');
    }

    return RANGE_LIMIT < all.length ? null : all;
};

//"today - 29.08.2026" is the short way of writing every day in between, which is what
//the grid hands back once a picked run outgrows a comma list
const splitRange = function (value, referenceDate) {

    let pairs = rangePairs(value);

    for (let i = 0; i < pairs.length; i++) {

        let days = rangeDays(pairs[i], referenceDate);

        if (null != days) {
            return days;
        }
    }

    return null;
};

//both ways of naming a list of days, so the grid marks a range the way it marks a list
const splitDays = function (value, referenceDate) {
    return splitSeeds(value, referenceDate) || splitRange(value, referenceDate);
};

const seedKeys = function (value, referenceDate) {

    let found = splitDays(value, referenceDate);

    return null == found ? [] : found.map(one => one.format(CAL_KEY));
};

let PICKED_CACHE = {value: null, keys: new Set()};
const pickedKeys = function () {

    let input = INPUTS[0];

    if (null == input) {
        return new Set();
    }

    let value = input.value.trim();

    if (value !== PICKED_CACHE.value) {
        PICKED_CACHE = {value: value, keys: new Set(seedKeys(value))};
    }

    return PICKED_CACHE.keys;
};

const patternMarks = function (month) {

    let marks = new Set();

    if (null == LAST_PATTERN) {
        return marks;
    }

    let step = LAST_PATTERN.step,
        seeds = LAST_PATTERN.seeds,
        from = firstCell(month),
        //the window resolved to milliseconds once, so the walk below is a number compare per step
        fromMs = from.valueOf(),
        toMs = from.clone().add(CAL_CELLS, 'days').valueOf() - 1;

    for (let i = 0; i < seeds.length; i++) {

        let day = alignSeed(step, seeds[i], from);

        for (let n = 0; n < PATTERN_LIMIT; n++) {

            let ms = day.valueOf();

            if (toMs < ms) {
                break;
            }

            if (fromMs <= ms) {
                marks.add(day.format(CAL_KEY));
            }

            day = stepBy(step, day);
        }
    }

    return marks;
};

//the answer and the grid are cleared from two places, and they clear the same things
const resetState = function () {

    LAST_DURATION = false;
    LAST_DATES = [];
    LAST_TITLE = '';
    LAST_ZONE = '';
    LAST_RANGE = null;
    LAST_PATTERN = null;
};

//the first field is a list of days either way, one long or several, and both paths want it
//resolved. A range says the days belong together, and a repeat treats that block as one thing
const resolveDates = function (value, referenceDate) {

    //each split is the validation of its own shape: it only answers when every piece is a date
    let listed = splitSeeds(value, referenceDate);

    if (null != listed) {
        return {days: listed, block: false};
    }

    let span = splitRange(value, referenceDate);

    if (null != span) {
        return {days: span, block: true};
    }

    let one = parseOne(value, referenceDate);

    return null == one ? null : {days: [one], block: false};
};

//the label is always the step that was typed, the cycle is what the days actually move by
const calcPattern = function (step, picked) {

    let seeds = picked.days,
        cycle = picked.block ? cycleOf(step, seeds) : step,
        label = 'every ' + stepLabel(step);

    LAST_PATTERN = {step: cycle, seeds: seeds};

    return keepDates(seeds.map(seed => stepBy(cycle, seed)), label, label);
};

const calcRes = function (inputs, referenceDate) {

    resetState();

    let elements = toElement(inputs),
        value_1 = elements[DATE_INPUT_NUMBER].value.trim(),
        value_2 = elements[ADD_INPUT_NUMBER].value.trim();

    if (0 === value_1.length) {
        return '';
    }

    //one resolution for every path below, so a bad date is caught once and never parsed twice
    let picked = resolveDates(value_1, referenceDate);

    if (null == picked) {
        flashTooltip('date-tooltip');
        return '';
    }

    let dates = picked.days,
        step = patternStepOf(value_2);

    if (null != step) {
        return calcPattern(step, picked);
    }

    if (1 < dates.length) {
        return keepDates(dates, value_1);
    }

    let fixedDate_1 = dates[0];

    if (0 === value_2.length) {
        return keepDate(fixedDate_1, value_1);
    }

    //maybe its date
    let secondDate = parseDate(value_2, referenceDate);

    if (null != secondDate) {
        let fixedDate_2 = fixDate(secondDate, secondDate.start.moment()),
            duration = moment.duration(makeDiff(fixedDate_1, fixedDate_2));
        LAST_DURATION = duration;
        //a span has no single day to keep, so the offset is read off the date the user started from
        LAST_ZONE = zoneLabel(fixedDate_1);
        LAST_RANGE = fixedDate_1.isAfter(fixedDate_2)
            ? {from: fixedDate_2.clone(), to: fixedDate_1.clone()}
            : {from: fixedDate_1.clone(), to: fixedDate_2.clone()};
        return formatDuration(duration, fixedDate_1, fixedDate_2);
    }

    let operations = getOperations(value_2);

    if (null == operations) {
        flashTooltip('unit-tooltip');
        return '';
    }

    return keepDate(operations.reduce((acc, s) => acc.add(s.num, s.unit), fixedDate_1), value_1 + ' ' + value_2);
};

//the date the grid opens on: the result itself, or the start of a span
const calAnchor = function () {

    let day = lastDate();

    if (null != day) {
        return day.clone();
    }

    if (null != LAST_RANGE) {
        return LAST_RANGE.from.clone();
    }

    return null;
};

//both ends resolved once per answer, so a cell costs two number compares instead of two moments
let RANGE_CACHE = {range: null, bounds: null};

const rangeBounds = function () {

    if (RANGE_CACHE.range === LAST_RANGE) {
        return RANGE_CACHE.bounds;
    }

    let bounds = null == LAST_RANGE ? null : {
        from: LAST_RANGE.from.clone().startOf('day').valueOf(),
        to: LAST_RANGE.to.clone().endOf('day').valueOf()
    };

    RANGE_CACHE = {range: LAST_RANGE, bounds: bounds};

    return bounds;
};

const isBetween = function (day) {

    let bounds = rangeBounds();

    if (null == bounds) {
        return false;
    }

    let ms = day.valueOf();

    return bounds.from <= ms && ms <= bounds.to;
};

//the days the answer names, keyed the way the grid keys its cells; both lists are replaced,
//never edited, so identity is enough to know the set is still good
let SELECTED_CACHE = {dates: null, range: null, keys: new Set()};

const selectedKeys = function () {

    if (SELECTED_CACHE.dates === LAST_DATES && SELECTED_CACHE.range === LAST_RANGE) {
        return SELECTED_CACHE.keys;
    }

    let keys = new Set();

    for (let i = 0; i < LAST_DATES.length; i++) {
        keys.add(LAST_DATES[i].format(CAL_KEY));
    }

    if (null != LAST_RANGE) {
        keys.add(LAST_RANGE.from.format(CAL_KEY));
        keys.add(LAST_RANGE.to.format(CAL_KEY));
    }

    SELECTED_CACHE = {dates: LAST_DATES, range: LAST_RANGE, keys: keys};

    return keys;
};

//the key is already in hand from the caller, and view holds what is the same for all 42 cells
const dayClass = function (day, key, view) {

    let classes = 'cal-day';

    if (day.month() !== view.month) {
        classes += ' cal-out';
    }

    if (key === view.today) {
        classes += ' cal-today';
    }

    if (isBetween(day)) {
        classes += ' cal-range';
    }

    if (view.marks.has(key)) {
        classes += ' cal-pattern';
    }

    if (view.selected.has(key) || view.picked.has(key)) {
        classes += ' cal-sel';
    }

    return classes;
};

//monday first, without leaning on the moment locale
const firstCell = function (month) {

    let first = month.clone().startOf('month');

    return first.subtract((first.day() + 6) % 7, 'days');
};

//one tabbable cell, so the grid costs a single tab stop instead of 42
const tabCell = function (month, today) {

    let day = lastDate();

    if (null != day && day.isSame(month, 'month')) {
        return day.format(CAL_KEY);
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
        view = {
            month: month.month(),
            today: today.format(CAL_KEY),
            marks: patternMarks(month),
            picked: pickedKeys(),
            selected: selectedKeys()
        },
        html = '<div class="cal-head">'
            + '<button type="button" class="cal-nav" data-step="-1" aria-label="Previous month">&#8249;</button>'
            + '<span class="cal-title">' + month.format('MMMM YYYY') + '</span>'
            + '<button type="button" class="cal-nav" data-step="1" aria-label="Next month">&#8250;</button>'
            + '</div><div class="cal-grid">' + CAL_DOW_HTML;

    for (let i = 0; i < CAL_CELLS; i++) {

        let key = day.format(CAL_KEY);

        html += '<button type="button" tabindex="' + (key === stop ? '0' : '-1') + '"'
            + ' class="' + dayClass(day, key, view) + '"'
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
        calendar = document.getElementById('calendar-holder'),
        empty = null == lastDate();

    //one fade for the column, so both icons always enter on the same frame
    if (null != actions) {
        actions.classList.toggle('hidden', empty && null == LAST_RANGE);
    }

    //sharing works for any answer, google calendar needs a single date
    if (null != calendar) {
        calendar.classList.toggle('hidden', empty);
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

//the first field is the list of picked days, and the grid never moves the month out from
//under the pointer that is picking on it
const writeSeeds = function (keys) {

    INPUTS[0].value = formatPicks(keys.map(one => moment(one, CAL_KEY)));

    CAL_HOLD = true;
    runCalc();
    CAL_HOLD = false;
};

const toggleSeed = function (key) {

    let keys = currentKeys(INPUTS[0].value.trim()),
        at = keys.indexOf(key);

    if (-1 === at) {
        keys.push(key);
    } else {
        keys.splice(at, 1);
    }

    keys.sort();

    writeSeeds(keys);
};

const keysBetween = function (fromKey, toKey) {

    let from = moment(fromKey, CAL_KEY),
        to = moment(toKey, CAL_KEY);

    if (from.isAfter(to)) {
        let swap = from;
        from = to;
        to = swap;
    }

    let keys = [],
        day = from.clone();

    while (!day.isAfter(to, 'day') && keys.length <= RANGE_LIMIT) {
        keys.push(day.format(CAL_KEY));
        day.add(1, 'days');
    }

    return RANGE_LIMIT < keys.length ? null : keys;
};

const anchorFor = function (key) {

    if (null != PICK_ANCHOR) {
        return PICK_ANCHOR;
    }

    let picked = Array.from(pickedKeys()).sort();

    return 0 === picked.length ? key : picked[0];
};

const selectRange = function (key) {

    let anchor = anchorFor(key),
        keys = keysBetween(anchor, key);

    if (null == keys) {
        return;
    }

    PICK_ANCHOR = anchor;

    writeSeeds(keys);
};

const pickDay = function (key, second) {

    let useSecond = second && 0 !== INPUTS[0].value.trim().length,
        input = INPUTS[useSecond ? 1 : 0];

    input.value = moment(key, CAL_KEY).format(CAL_INPUT_PATTERN) + clockOf(input.value);

    if (useSecond) {

        CAL_HOLD = true;
        runCalc();
        CAL_HOLD = false;

        return;
    }

    PICK_ANCHOR = key;

    if (null != parseDate(INPUTS[1].value)) {
        INPUTS[1].value = '';
    }

    runCalc();
};

const endDrag = function () {

    if (null == dragRange) {
        return;
    }

    let view = document.getElementById('calendar-view');

    if (null != view) {
        view.style.touchAction = '';
    }

    dragRange = null;
};

const cancelPress = function () {

    window.clearTimeout(pressTimerId);

    endDrag();

    pressTimerId = null;
    pressAt = null;
};

const paintDrag = function (keys) {

    let picked = new Set(keys),
        cells = dragRange.cells;

    for (let i = 0; i < cells.length; i++) {
        cells[i].classList.toggle('cal-sel', picked.has(cells[i].dataset.day));
    }
};

const dragTo = function (x, y) {

    let under = document.elementFromPoint(x, y),
        cell = null == under ? null : under.closest('.cal-day');

    if (null == cell || cell.dataset.day === dragRange.key) {
        return;
    }

    let keys = keysBetween(dragRange.anchor, cell.dataset.day);

    if (null == keys) {
        return;
    }

    dragRange.key = cell.dataset.day;
    dragRange.moved = true;

    paintDrag(keys);
};

const onCalendarPointerDown = function (e) {

    let cell = e.target.closest('.cal-day');

    if ('mouse' === e.pointerType) {
        pressHandled = false;
        menuFromMouse = 2 === e.button;
        return;
    }

    menuFromMouse = false;

    if (null == cell) {
        return;
    }

    let key = cell.dataset.day,
        view = document.getElementById('calendar-view');

    pressHandled = false;
    pressAt = {x: e.clientX, y: e.clientY};

    window.clearTimeout(pressTimerId);

    pressTimerId = window.setTimeout(() => {

        pressTimerId = null;
        pressHandled = true;

        dragRange = {
            anchor: key,
            key: key,
            moved: false,
            cells: view.getElementsByClassName('cal-day')
        };

        view.style.touchAction = 'none';

        cell.classList.toggle('cal-sel');

    }, LONG_PRESS_MS);
};

const onCalendarPointerMove = function (e) {

    if (null != dragRange) {
        dragTo(e.clientX, e.clientY);
        return;
    }

    if (null == pressAt) {
        return;
    }

    if (PRESS_SLOP < Math.abs(e.clientX - pressAt.x) + Math.abs(e.clientY - pressAt.y)) {
        cancelPress();
    }
};

const onCalendarTouchMove = function (e) {

    if (null != dragRange && e.cancelable) {
        e.preventDefault();
    }
};

const onCalendarPointerUp = function () {

    let drag = dragRange;

    cancelPress();

    if (null == drag) {
        return;
    }

    if (!drag.moved) {
        toggleSeed(drag.anchor);
        return;
    }

    let keys = keysBetween(drag.anchor, drag.key);

    if (null == keys) {
        renderCalendar();
        return;
    }

    PICK_ANCHOR = drag.anchor;

    writeSeeds(keys);
};

const onCalendarPointerCancel = function () {

    let painted = null != dragRange;

    cancelPress();

    if (painted) {
        renderCalendar();
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
        selectRange(cell.dataset.day);
        return;
    }

    if (e.ctrlKey || e.metaKey) {
        toggleSeed(cell.dataset.day);
        return;
    }

    pickDay(cell.dataset.day, false);
};

const renderResult = function (text) {

    //nothing parsed: keep the last answer on screen, the tooltip already said why
    if (!text && null == lastDate() && null == LAST_RANGE) {
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

//nothing typed is the state the page loads in, month the grid opens on included
const renderEmpty = function () {

    resetState();

    CAL_MONTH = null;
    PICK_ANCHOR = null;

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

//a list of dates, or a range, outgrows a field sized for one
const fitInput = function (input) {

    let value = input.value;

    input.classList.toggle('input-wide', -1 !== value.indexOf(SEED_SEPARATOR) || RANGE_REGEX.test(value));
};

const runCalc = function () {

    fitInput(INPUTS[0]);

    //an empty first field is a reset, not a failed parse
    if (0 === INPUTS[0].value.trim().length) {
        renderEmpty();
        return '';
    }

    let text = calcRes(INPUTS);

    renderResult(text);

    return text;
};

const focusNext = function (input) {

    let next = INPUTS[Array.prototype.indexOf.call(INPUTS, input) + 1];

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

    let at = Array.prototype.indexOf.call(INPUTS, input);

    if (-1 === at) {
        return;
    }

    let next = INPUTS[(at + (back ? -1 : 1) + INPUTS.length) % INPUTS.length];

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

    let first = INPUTS[0];

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

//convert to english for chrono
const translate = function (string) {

    string = string.replace(OF_REGEX, '$1 ');

    if (HAS_RU_REGEX.test(string)) {
        string = string
            .replace(RU_ORDINAL_REGEX, '$1 ')
            .replace(RU_WORDS_REGEX, (all, before, word) => before + RU_WORDS[word.toLowerCase()])
            .replace(RU_IN_REGEX, (all, num, unit) => 'in ' + num + ' ' + formatUnits(unit))
            .replace(RU_AGO_REGEX, (all, num, unit) => num + ' ' + formatUnits(unit) + ' ago')
            .replace(/ {2,}/g, ' ');
    }

    return string.replace(CASE_REGEX, capitalize);
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

//every day the grid writes comes back as DD.MM.YYYY, and chrono costs two parses plus a
//translate pass to reach the same answer moment can read directly
const plainDate = function (string) {

    if (!PLAIN_DATE_REGEX.test(string)) {
        return null;
    }

    let day = moment(string, CAL_INPUT_PATTERN, true);

    //a full numeric date leaves nothing implied, so every field of it is certain
    return day.isValid() ? {text: string, start: {moment: () => day.clone(), isCertain: () => true}} : null;
};

//the same shortcut plainDate takes for a numeric date: the answer is known, so nothing
//about it is left to a parser that would rather have an hour before it commits to a day
const casualDate = function (string, referenceDate) {

    let word = string.trim().toLowerCase();

    if (!CASUAL_DAYS.hasOwnProperty(word)) {
        return null;
    }

    let day = moment(referenceDate).startOf('day').add(CASUAL_DAYS[word], 'days');

    //a day word leaves nothing implied, so every field of it is certain
    return {text: string, start: {moment: () => day.clone(), isCertain: () => true}};
};

const parseDate = function (string, /*for tests*/ referenceDate) {

    let plain = plainDate(string.trim());

    if (null != plain) {
        return plain;
    }

    string = translate(string);

    if (DURATION.test(string)) {
        return null;
    }

    //after translate, so 'завтра' arrives here as the word it means
    let casual = casualDate(string, referenceDate);

    if (null != casual) {
        return casual;
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

    if (null == LAST_PATTERN || 1 !== LAST_PATTERN.step.length) {
        return null;
    }

    let op = LAST_PATTERN.step[0],
        freq = RRULE_FREQ[op.unit];

    return null == freq ? null : 'RRULE:FREQ=' + freq + ';INTERVAL=' + op.num;
};

const buildCalendarUrl = function () {

    let first = lastDate();

    if (null == first) {
        return null;
    }

    let start = first.clone(),
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

    let params = new URLSearchParams();

    params.set(SHARE_DATE, INPUTS[0].value.trim());
    params.set(SHARE_UNIT, INPUTS[1].value.trim());

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

    if (INPUTS[0].value.trim().length === 0) {
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

    INPUTS[0].value = date;
    INPUTS[1].value = params.get(SHARE_UNIT) || '';

    SHARED_ZONE = params.get(SHARE_ZONE);

    return true;
};

window.onload = function () {

    for (let i = 0; i < INPUTS.length; i++) {

        let input = INPUTS[i];

        //cleans at refresh
        input.value = null;
        input.setAttribute('enterkeyhint', i === INPUTS.length - 1 ? 'done' : 'next');
        input.addEventListener('keydown', onKeyDown);
    }

    document.addEventListener('keydown', onPageKeyDown);

    document.getElementById('share-btn').addEventListener('click', onShare);
    document.getElementById('calendar-btn').addEventListener('click', onCalendar);
    let view = document.getElementById('calendar-view');

    view.addEventListener('click', onCalendarClick);
    view.addEventListener('pointerdown', onCalendarPointerDown, {passive: true});
    view.addEventListener('pointermove', onCalendarPointerMove, {passive: true});
    view.addEventListener('pointerup', onCalendarPointerUp, {passive: true});
    view.addEventListener('pointercancel', onCalendarPointerCancel, {passive: true});
    view.addEventListener('touchmove', onCalendarTouchMove, {passive: false});
    view.addEventListener('contextmenu', (e) => {

        let cell = e.target.closest('.cal-day'),
            fromMouse = menuFromMouse;

        menuFromMouse = false;

        if (null == cell) {
            return;
        }

        e.preventDefault();

        if (fromMouse) {
            pickDay(cell.dataset.day, true);
        }
    });

    document.getElementById('result').addEventListener('click', (e) => {

        if (LAST_DURATION) {
            e.target.innerHTML = e.target.innerHTML + ' (' + formatTotalDays(LAST_DURATION) + ')';
            LAST_DURATION = false;
        }

    });

    //reset if pass empty
    INPUTS[0].addEventListener('input', () => {

        fitInput(INPUTS[0]);

        PICK_ANCHOR = null;

        if (0 === INPUTS[0].value.trim().length) {
            renderEmpty();
        }
    });

    renderCalendar();

    if (applySharedState()) {
        runCalc();
        clearSharedState();
    }
}