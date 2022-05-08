const fs = require("fs");
const path = require("path");

const clearImage = (pathName) => {
  const fileDir = path.join(__dirname, "..", pathName);
  fs.unlink(fileDir, (err) => console.log(err));
};

exports.clearImage = clearImage;
