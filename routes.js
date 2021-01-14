const optixTimeQuery = require("./controllers/optix-time-query");
const downloadFile = require("./controllers/download-file");

module.exports = function (app) {
    app.get("/action/timeseries", optixTimeQuery.timeseries);
    // app.get("/action/timeseries/download", downloadFile);
    app.get("/action/metadata", optixTimeQuery.getMetadata);
    app.post("/action/metadata", optixTimeQuery.editMetadata, optixTimeQuery.getMetadata);
    app.get("/action/test", (req, res) => {
        console.log(req.query);
    });
};
