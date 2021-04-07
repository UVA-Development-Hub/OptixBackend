const express = require("express");
const metadata = require("./routes/metadata");
const dataset = require("./routes/dataset");

// guaranteed to get dependencies
module.exports = (app) => {
    metadata(app);
    dataset(app);
    // user(app);
    // auth(app);
    // ingestion(app);
    return app;
};
