const axios = require("axios");
const config = require("../../config");

const queryAgent = axios.create({
    baseURL: config.optix.url,
    timeout: 0,
    auth: {
        username: config.optix.username,
        password: config.optix.password,
    },
});

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
