const { spawn } = require("child_process");
const saveQuery = require("../utils/save-query");

module.exports = function (req, res) {
  const query = req.query;
  let options = ["./public/python/curl_uva_api.py"];
  for (let key in query) {
    if (query[key].length !== 0) {
      options.push(`--${key}`);
      options.push(query[key]);
    }
  }
  console.log(options);
  const curl_uva_api = spawn("python3", options);
  curl_uva_api.stdout.on("data", (data) => {
    // console.log(data);
  });

  curl_uva_api.stderr.on("data", (data) => {
    let response = data.toString();

    response = JSON.parse(response.replace(/INFO: /gi, "").replace(/'/g, `"`));
    saveQuery(query.project, response);
    console.log(response);
    res.send(response);
  });
};
