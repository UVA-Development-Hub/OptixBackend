const optixTimeQuery = require("./controllers/optix-time-query");
const downloadFile = require("./controllers/download-file");

module.exports = function (app) {
  app.get("/action/timeseries", optixTimeQuery);
  app.get("/action/timeseries/download", downloadFile);
};
