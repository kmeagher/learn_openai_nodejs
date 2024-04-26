
const uuid = require('uuid');
const moment = require('moment');
const util = require('../util');

const authorizedUsers = [];

function AuthUser(req) {
    const token = `${uuid.v4()}.${uuid.v4()}`;
    const user = {
        created: new Date(),
        updated: new Date(),
        expires: moment().add(1, 'hour'),
        token: token
    };
    authorizedUsers.push(user);
    return user;
}

exports.create = AuthUser;

function userIndex(req, token = null) {
    if (util.notEmpty(req) && util.notEmpty(req.params.token)) {
        token = req.params.token;
        return authorizedUsers.findIndex((u) => u.token === token);
    } else if (util.notEmpty(token)) {
        return authorizedUsers.findIndex(u => u.token === token);
    }
    return -1;
}

function getUser(req) {
    const index = userIndex(req);
    if (index === -1) return null;
    return authorizedUsers[index];
}

exports.getUser = getUser;

function removeUser(req) {
    const index = userIndex(req);
    if (index === -1) return;
    authorizedUsers.splice(index, 1);
}

function isActive(req) {
    const user = getUser(req);
    if (
        (util.isNull(user))
        || (util.isNull(user.created))
        || (util.isNull(user.updated))
    ) {
        removeUser(req)
        return false;
    }
    const updated = moment(user.updated);
    const expires = moment(updated).add(1, 'hour');
    if (updated.isSameOrAfter(expires)) {
        removeUser(req);
        return false;
    }
    return true;
}

exports.isActive = isActive;

exports.validate = (req) => {
    const user = getUser(req);
    const response = {
        errored: util.isNull(user)
    };
    if (response.errored || !isActive(req)) {
        response.statusCode = 401;
        response.message = "unauthorized";
    } else {
        response.message = "success";
        response.data = [user];
    }
    return response;
}

/**
 * looks for expired users and removes them from memory
 */
exports.cleanup = () => {
    console.log("Process Start: Cleanup Auth Users");
    const startCount = authorizedUsers.length;
    authorizedUsers.forEach(user => {
        const mockReq = {
            params: {
                token: user.token
            }
        };
        isActive(mockReq);
    });
    console.log("Process Note: Cleanup Auth Users => Start Count: " + startCount + " => End Count: " + authorizedUsers.length);
    console.log("Process End: Cleanup Auth Users");
}
