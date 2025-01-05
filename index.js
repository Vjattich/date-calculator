const ENTER_KEY = 13;

const NUMBER_POSITION = 1;
const DATE_INPUT_NUMBER = '1';
const ADD_INPUT_NUMBER = '2';

const HAS_TIME_REGEX = new RegExp('\\d{2}:\\d{2}:\\d{2}');
const RUS_DATE_REGEX = new RegExp('\\d{2}([.\\-])\\d{2}([.\\-])\\d{4}?.*');

const UNIT_ORDER = ['years', 'months', 'days', 'hours', 'minutes', 'seconds'];

let guideTimeunitId = null;
let tooltipTimeunitId = null;

let guideStage = 0;

const toElement = function (elements) {
    return elements
        .map(e => ({value: e.value, pos: e.classList[NUMBER_POSITION], self: e}))
        .reduce((acc, e) => {
            acc[e.pos] = e;
            return acc;
        }, {});
};

const getOperations = function (string) {
    return string
        .match(/\d+\s*[a-zA-Z]+/g)
        .map(segment => {
            const [, num, unit] = segment.match(/(\d+)\s*([a-zA-Z]+)/);
            return {num: num, unit: formatUnits(unit)};
        })
        .sort((a, b) => {
            return UNIT_ORDER.indexOf(b.unit) - UNIT_ORDER.indexOf(a.unit);
        });
};

const formatUnits = function (unit) {

    if (unit === '') {
        return null;
    }

    if ('Months'.startsWith(unit)) {
        return 'months';
    }

    if ('minutes'.startsWith(unit)) {
        return 'minutes';
    }

    if ('seconds'.startsWith(unit)) {
        return 'seconds';
    }

    if ('year'.startsWith(unit)) {
        return 'year';
    }

    return unit;
};

const onKeyUp = function (e) {

    let inputs = Array.from(document.getElementsByClassName('input'));

    let isEnterPress = ENTER_KEY === e.keyCode;

    if (!isEnterPress) {
        return;
    }

    let elements = toElement(inputs),
        value_1 = elements[DATE_INPUT_NUMBER].value,
        //parse to date, date input val
        firstDate = parseDate(value_1),
        //get val of add\subtract unit
        value_2 = elements[ADD_INPUT_NUMBER].value,
        //maybe its date
        secondDate = parseDate(value_2);

    let res;

    if (null == secondDate) {

        value_2 = value_2.trim();
        //take unit from value
        let operations = getOperations(value_2)

        if (value_2.length > 0 && operations.filter(Boolean).length === 0) {
            toggleTooltip()
            return;
        }

        let adds = operations,
            moment = firstDate.start.moment(),
            fixedDate = fixDate(firstDate, moment),
            //result
            result = adds.reduce((acc, s) => acc.add(s.num, s.unit), fixedDate),
            //if time without clockunit don't need to render it
            hasNotClockUnit = (result.hours() && result.minutes() && result.seconds()) === 0,
            pattern = hasNotClockUnit ? 'DD.MM.YYYY dddd MMMM' : 'DD.MM.YYYY HH:mm:ss dddd MMMM';

        res = result.format(pattern);

    } else {

        let moment_1 = firstDate.start.moment(),
            fixedDate_1 = fixDate(firstDate, moment_1),
            moment_2 = secondDate.start.moment(),
            fixedDate_2 = fixDate(secondDate, moment_2),
            //result
            result = fixedDate_1.diff(fixedDate_2),
            duration = moment.duration(result);

        res = formatDuration(duration);

    }

    document.getElementById('result').innerHTML = res;

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

const isNotVisible = function (e) {
    return e.classList.contains('opacity-0');
};

const formatDuration = function (duration) {

    let s = [
        {val: duration.years(), unit: 'years'},
        {val: duration.months(), unit: 'months'},
        {val: duration.days(), unit: 'days'},
        {val: duration.hours(), unit: 'hours'},
        {val: duration.minutes(), unit: 'minutes'},
        {val: duration.seconds(), unit: 'seconds'}
    ]

    let result = '';

    for (let i = 0; i < s.length; i++) {
        const elem = s[i];
        //ignore hours and rest if its null
        if (!elem.val) {
            continue;
        }

        result += Math.abs(elem.val) + ' ' + elem.unit + ' ';
    }

    return result;
};

const parseDate = function (string, /*for tests*/ referenceDate) {

    //easy, but bad, it parse words-dates, ether way u need to known all words
    let isDate = chrono.parseDate(string) !== null,
        params = {forwardDate: true};

    if (isDate) {
        string = HAS_TIME_REGEX.test(string) ? string : string + ' 00:00:00';
    }

    //не понятно почему либа сама это не умеет
    if (RUS_DATE_REGEX.test(string)) {
        return chrono.en_GB.parse(string, referenceDate, params)[0];
    }

    return chrono.parse(string, referenceDate, params)[0];
};


const fixDate = function (chronoObj, momentDate) {

    if (chronoObj.text === 'today') {
        return momentDate.startOf('day')
    }

    return momentDate;
};


const debounceTooltip = (callback, wait) => {
    return (...args) => {
        window.clearTimeout(tooltipTimeunitId);
        tooltipTimeunitId = window.setTimeout(() => {
            callback(...args);
            tooltipTimeunitId = null;
        }, wait);
    };
}

const toggleTooltip = function () {
    let elem = document.getElementById('unit-tooltip');
    let callback = toggleOpacity.bind(null, elem);
    if (tooltipTimeunitId === null) {
        callback()
    }
    debounceTooltip(callback, 2000)();
};

const debounceGuide = (callback, wait) => {
    return (...args) => {
        window.clearTimeout(guideTimeunitId);
        guideTimeunitId = window.setTimeout(() => {
            callback(...args);
            guideTimeunitId = null;
        }, wait);
    };
}

const toggleOpacity = function (element) {
    element.classList.toggle('opacity-0')
    element.classList.toggle('opacity-1')
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
        result = document.getElementById('result'),
        tooltips = document.getElementById('tooltips');

    input_1.value = null;
    input_2.value = null;
    input_1.readOnly = false;
    input_2.readOnly = false;
    result.innerHTML = null;
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
        input_2 = inputs[1],
        result = document.getElementById('result');

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
        result.innerHTML = null;
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
        result.innerHTML = null;
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
        result.innerHTML = null;
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
        input.addEventListener('keyup', onKeyUp)
    })

    let questionMark = document.getElementsByClassName('question-mark')[0],
        next = document.getElementsByClassName('next')[0],
        prev = document.getElementsByClassName('prev')[0];

    questionMark.addEventListener('click', toggleGuide);
    next.addEventListener('click', () => toggleStage(true));
    prev.addEventListener('click', () => toggleStage(false));

    document.getElementById('result').addEventListener('click', (e) => {

        let text = e.target.innerHTML;

        navigator.clipboard.writeText(text)
            .then(() => {
            })
            .catch(err => {
                console.error("Error copying text: ", err);
            });
    });
}

