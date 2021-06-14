const metadata = require("./routes/metadata");
const dataset = require("./routes/dataset");
const user = require("./routes/user");
const swagger = require("./routes/swagger");

// guaranteed to get dependencies
module.exports = (app) => {
    metadata(app);
    dataset(app);
    user(app);
    swagger(app);
    return app;
};
