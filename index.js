const ENTER_KEY = 13;

const NUMBER_POSITION = 1;
const DATE_INPUT_NUMBER = '1';
const ADD_INPUT_NUMBER = '2';

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

const formatUnit = function (unit) {
    if ('minutes'.startsWith(unit)) {
        return 'minutes';
    }
    if ('seconds'.startsWith(unit)) {
        return 'seconds';
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

        //take unit from value
        let unit = value_2.replace(/[^A-Za-z]/g, ''),
            formattedUnit = formatUnit(unit),
            //replace unit from value
            operation = value_2.replaceAll(unit, '');

        if (value_2.length > 0 && '' === unit) {
            toggleTooltip()
            return;
        }

        let moment = firstDate.start.moment(),
            fixedDate = fixDate(firstDate, moment),
            //result
            result = fixedDate.add(operation, formattedUnit),
            //if time without clockunit don't need to render it
            hasNotClockUnit = (result.hours() && result.minutes() && result.minutes()) === 0,
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

const parseDate = function (string) {

    //не понятно почему либа сама это не умеет
    if (new RegExp('\\d{2}([.\\-])\\d{2}([.\\-])\\d{4}').test(string)) {
        return chrono.en_GB.parse(string)[0]
    }

    return chrono.parse(string)[0];
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
    //todo 118 years 11 months 25 days test + result
    //test 01.01.2020 | 01\01\2020 + days = differen formats
    //test 2024-12-09 19:08:28 - 2024-12-10 11:44:25  = bad res; need moment(secondDate.ref)
    //test 22.11.1996 22.11.2030 - bug
    //phone units are bad css

    if (guideStage !== 0 && e.type === 'click') {
        e = {type: 'system'};
    }

    guideStage = 0;

    let questionMark = document.getElementsByClassName('question-mark')[0],
        next = document.getElementsByClassName('next')[0],
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

}

