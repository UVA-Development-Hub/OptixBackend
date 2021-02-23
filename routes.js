const optixTimeQuery = require("./controllers/optix-time-query");
const downloadFile = require("./controllers/download-file");
const { auth, getToken } = require("./controllers/auth");
// const initialize = require("./controllers/initialize");

module.exports = function (app) {
    app.get("/login", getToken, auth, (req, res, next) => {
        res.send(`Hi ${res.locals.user.username}, your API call is authenticated!`);
    });
    // app.post("/action/initialize", initialize);
    // app.use(auth);
    app.get("/action/timeseries", optixTimeQuery.timeseries);
    app.get("/action/timeseries/download", optixTimeQuery.timeseries, downloadFile);
    app.get("/action/metadata", optixTimeQuery.getMetadata);
    app.post("/action/metadata", optixTimeQuery.editMetadata, optixTimeQuery.getMetadata);
    app.post("/action/entity", optixTimeQuery.createEntity);
};
