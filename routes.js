const optixTimeQuery = require("./controllers/optix-time-query");
const downloadFile = require("./controllers/download-file");
// const initialize = require("./controllers/initialize");

module.exports = function (app) {
    // app.post("/action/initialize", initialize);
    app.get("/action/timeseries", optixTimeQuery.timeseries);
    app.get("/action/timeseries/download", optixTimeQuery.timeseries, downloadFile);
    app.get("/action/metadata", optixTimeQuery.getMetadata);
    app.post("/action/metadata", optixTimeQuery.editMetadata, optixTimeQuery.getMetadata);
};
