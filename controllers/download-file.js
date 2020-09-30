module.exports = function (req, res) {
  const type = req.query.type;
  const filename = req.query.filename;
  res.download(`./public/downloads/${filename}.${type}`);
};
