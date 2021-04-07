const axios = require("axios");
require("dotenv").config();

const queryAgent = axios.create({
    baseURL: "https://uva.optix.earth/api/",
    timeout: process.env.TIMEOUT || 0,
    auth: {
        username: process.env.OPTIX_TIME_USERNAME,
        password: process.env.OPTIX_TIME_PASSWORD,
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
