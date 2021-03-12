const optixTimeQuery = require("./controllers/optix-time-query");
const userDbQuery = require("./controllers/user-db-query");
const downloadFile = require("./controllers/download-file");
const { auth, getToken } = require("./controllers/auth");
const { initialize } = require("./controllers/initialize");

module.exports = function (app) {
    app.get("/login", getToken, auth, initialize);
    app.get("/action/timeseries", optixTimeQuery.timeseries);
    app.get("/action/timeseries/download", optixTimeQuery.timeseries, downloadFile);
    app.get("/action/metadata", optixTimeQuery.getMetadata);
    app.post("/action/metadata", optixTimeQuery.editMetadata, optixTimeQuery.getMetadata);
    app.post("/action/entity", optixTimeQuery.createEntity);
    app.get("/action/create-group", userDbQuery.createGroup);
    app.get("/action/add-dataset-to-group", userDbQuery.addDatasetToGroup);
};
