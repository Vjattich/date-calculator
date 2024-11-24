const ENTER_KEY = 13;

const NUMBER_POSITION = 1;
const DATE_INPUT_NUMBER = '1';
const ADD_INPUT_NUMBER = '2';

let guideTimeunitId = null;
let tooltipTimeunitId = null;

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
        value = elements[DATE_INPUT_NUMBER].value,
        //parse to date, date input val
        parse = chrono.parse(value),
        date = parse[0],
        //get val of add\subtract unit
        add = elements[ADD_INPUT_NUMBER].value,
        //take unit from value
        unit = add.replace(/[^A-Za-z]/g, ''),
        formattedUnit = formatUnit(unit),
        //replace unit from value
        val = add.replaceAll(unit, '');

    if (add.length > 0 && '' === unit) {
        toggleTooltip()
        return;
    }

    let moment = date.start.moment(),
        fixedDate = date.text === 'now' && date.tags.ENCasualDateParser ? moment :  moment.startOf('day'),
        //result
        result = fixedDate.add(val, formattedUnit),
        //format to EUROPEAN date
        formattedResult = result.format('DD.MM.YYYY HH:mm:ss dddd MMMM');

    document.getElementById('result').textContent = formattedResult;

}

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

const toggleGuide = function () {
//todo toggle guide need to turn or off by press; and u cant cancel the fade animation
    let elem = document.getElementsByClassName('guide');
    let callback = toggleOpacity.bind(null, elem);
    if (guideTimeunitId === null) {
        callback()
    }
    debounceGuide(callback, 8000)();
};

const toggleOpacity = function (elements) {
    Array.from(elements).forEach(a => {
        a.classList.toggle('opacity-0');
        a.classList.toggle('opacity-1');
    });
};

//check requests to outher sites
window.onload = function () {

    let inputs = Array.from(document.getElementsByClassName('input'));

    inputs.forEach(input => {
        input.addEventListener('keyup', onKeyUp)
    })

    let questionMark = document.getElementsByClassName('question-mark')[0];

    questionMark.addEventListener('click', toggleGuide)

}

