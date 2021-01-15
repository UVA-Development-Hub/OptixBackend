const fs = require("fs-extra");
const path = require("path");

function saveData(data, metric, start_time, end_time) {
    start_time = start_time.replace(/\//g, "-");
    let filename = `${metric}_${start_time}`;
    if (end_time) {
        end_time = end_time.replace(/\//g, "-");
        filename += `_${end_time}`;
    }
    const filePath = path.normalize(__dirname + `/../public/downloads/${filename}`);
    if (fs.pathExistsSync(filePath)) {
        fs.removeSync(filePath);
    }
    fs.outputJsonSync(filePath, data);
    return filePath;
}

module.exports = function (req, res) {
    const start_time = req.query.start_time;
    const end_time = req.query.end_time;
    const metric = req.query.metric;
    const data = res.locals.data;

    const filePath = saveData(data, metric, start_time, end_time);

    res.download(filePath);
};
