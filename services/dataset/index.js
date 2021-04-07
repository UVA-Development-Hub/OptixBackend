const fs = require("fs-extra");
const path = require("path");

function download(data, metric, start_time, end_time) {
    start_time = start_time.replace(/\//g, "-");
    let filename = `${metric}_${start_time}`;
    if (end_time) {
        end_time = end_time.replace(/\//g, "-");
        filename += `_${end_time}`;
    }
    filename += ".json";
    const filePath = path.normalize(__dirname + `/../public/downloads/${filename}`);
    if (fs.pathExistsSync(filePath)) {
        fs.removeSync(filePath);
    }
    fs.outputJsonSync(filePath, data);
    return filePath;
}

module.exports = {
    download: download,
};
