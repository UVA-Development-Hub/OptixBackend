const fs = require("fs-extra");
const {
  Parser,
  transforms: { unwind, flatten },
} = require("json2csv");

const outputDir = "./public/downloads/";

module.exports = function (filename, data) {
  fs.writeJson(`${outputDir}${filename}.json`, data, (err) => {
    if (err) {
      return console.error(err);
    }
    console.log("save json suceess!");
  });
  try {
    const parser = new Parser({ transforms: [flatten({ objects: true })] });
    const csv = parser.parse(data);
    console.log(csv);
    fs.outputFile(`${outputDir}${filename}.csv`, csv, (err) => {
      if (err) {
        return console.error(err);
      }
      console.log("save csv suceess!");
    });
  } catch (err) {
    console.error(err);
  }
};
