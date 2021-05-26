const metadata = require("./routes/metadata");
const dataset = require("./routes/dataset");
const auth = require("./routes/auth");
const user = require("./routes/user");
const swagger = require("./routes/swagger");

// guaranteed to get dependencies
module.exports = (app) => {
    metadata(app);
    dataset(app);
    user(app);
    auth(app);
    swagger(app);
    return app;
};
