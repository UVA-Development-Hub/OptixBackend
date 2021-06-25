const metadata = require("./routes/metadata");
const dataset = require("./routes/dataset");
const groups = require("./routes/groups");
const swagger = require("./routes/swagger");

// guaranteed to get dependencies
module.exports = (app) => {
    metadata(app);
    dataset(app);
    groups(app);
    swagger(app);
    return app;
};
