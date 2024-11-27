const ENTER_KEY = 13;

const NUMBER_POSITION = 1;
const DATE_INPUT_NUMBER = '1';
const ADD_INPUT_NUMBER = '2';

let guideTimeunitId = null;
let tooltipTimeunitId = null;

let guideStage = -1;

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
        firstDate = chrono.parse(value_1)[0],
        //get val of add\subtract unit
        value_2 = elements[ADD_INPUT_NUMBER].value,
        //maybe its date
        secondDate = chrono.parse(value_2)[0];

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
            fixedDate = firstDate.text === 'now' && firstDate.tags.ENCasualDateParser ? moment : moment.startOf('day'),
            //result
            result = fixedDate.add(operation, formattedUnit),
            //if time without clockunit don't need to render it
            hasNotClockUnit = (result.hours() && result.minutes() && result.minutes()) === 0,
            pattern = hasNotClockUnit ? 'DD.MM.YYYY <br> dddd MMMM' : 'DD.MM.YYYY HH:mm:ss <br> dddd MMMM';

        res = result.format(pattern);

    } else {

        let moment_1 = firstDate.start.moment(),
            fixedDate_1 = firstDate.text === 'now' && firstDate.tags.ENCasualDateParser ? moment_1 : moment_1.startOf('day'),
            moment_2 = secondDate.start.moment(),
            fixedDate_2 = secondDate.text === 'now' && secondDate.tags.ENCasualDateParser ? moment_2 : moment_2.startOf('day'),
            //result
            result = fixedDate_1.diff(fixedDate_2),
            duration = moment.duration(result);

        res = formatDuration(duration);

    }

    document.getElementById('result').innerHTML = res;
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
    let elem = document.getElementsByClassName('tooltip');
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

const toggleOpacity = function (elements) {
    Array.from(elements).forEach(a => {
        a.classList.toggle('opacity-0');
        a.classList.toggle('opacity-1');
    });
};

const toggleGuide = function () {
    //todo 118 years 11 months 25 days test + result
    //todo game with exampels on guide\

    guideStage = 0;

    let questionMark = document.getElementsByClassName('question-mark')[0],
        next = document.getElementsByClassName('next')[0],
        prev = document.getElementsByClassName('prev')[0]

    next.classList.toggle('hidden');
    prev.classList.toggle('hidden');
};

const toggleStage = function (isNext) {

    if (isNext) {
        guideStage = guideStage + 1;
    }
    else {
        guideStage = guideStage - 1;
    }

    console.log(guideStage);

    if (guideStage > 2) {
        toggleGuide();
    }

    if (guideStage === 1) {
    }


    if (guideStage === 2) {
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

