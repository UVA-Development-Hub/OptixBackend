const axios = require("axios");
const config = require("../../config");

// query agent for optix api
const queryAgent = axios.create({
    baseURL: config.optix.url,
    timeout: 0,
    auth: {
        username: config.optix.username,
        password: config.optix.password,
    },
});

/**
 * Description:
 *      make request to optix api
 *
 * @param {string} endPoint end point
 * @param {string} parameters query or body
 * @param {string} method http method
 * @return {object}
 */
function query(endPoint, parameters, method) {
    const option = {};
    switch (method) {
    case "get":
        option.params = parameters;
        return queryAgent.get(endPoint, option);
    case "post":
        return queryAgent.post(endPoint, parameters);
    case "put":
        return queryAgent.put(endPoint, parameters);
    case "delete":
        option.data = parameters;
        return queryAgent.delete(endPoint, option);
    }
}

module.exports = {
    query: query,
};
