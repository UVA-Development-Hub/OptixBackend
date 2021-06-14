const metadata = require("./routes/metadata");
const dataset = require("./routes/dataset");
const swagger = require("./routes/swagger");

// guaranteed to get dependencies
module.exports = (app) => {
    metadata(app);
    dataset(app);
    swagger(app);
    return app;
};
