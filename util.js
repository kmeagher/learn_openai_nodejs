
function isNull(value) {
    return typeof value === 'undefined' || value === null;
}

exports.isNull = isNull;

function notNull(value) {
    return !isNull(value);
}

exports.notNull = notNull;

function isEmpty(value) {
    if (isNull(value)) return true;
    if (typeof value === 'string' && value.trim().length===0) return true;
    if (Array.isArray(value) && value.length===0) return true;
    return false;
}

exports.isEmpty = isEmpty;

function notEmpty(value) {
    return !isEmpty(value);
}

exports.notEmpty = notEmpty;
