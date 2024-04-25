
const uuid = require('uuid');

const authorizedUsers = [];

function AuthUser(req) {
    const token = `${uuid.v4()}.${uuid.v4()}`;
    const user = {
        created: new Date(),
        updated: new Date(),
        token: token
    };
    authorizedUsers.push(user);
    return user;
}

exports.create = AuthUser;

function getUser(req) {
    const token = req.params.token;
    if (typeof token === 'undefined' || token === null || token.trim().length===0) return null;
    const index = authorizedUsers.findIndex((u) => u.token === token);
    if (index === -1) return null;
    return authorizedUsers[index];
}

exports.getUser = getUser;

exports.validate = (req) => {
    const user = getUser(req);
    const response = {
        errored: typeof user === 'undefined' || user === null
    };
    if (response.errored) {
        response.statusCode = 401;
        response.message = "unauthorized";
    } else {
        response.message = "success";
        response.data = [user];
    }
    return response;
}


