const express = require("express");
const metadata = require("./routes/metadata");

// guaranteed to get dependencies
module.exports = (app) => {
    metadata(app);
    // data(app);
    // user(app);
    // auth(app);
    // ingestion(app);
    return app;
};
