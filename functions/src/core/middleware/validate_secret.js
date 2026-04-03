/* eslint-disable */

const config = require("../config");

const validateSecret = (request, response) => {
  const secret = request.headers[config.secretHeader];
  if (!secret || secret !== config.ANALYTICS_SECRET) {
    response.status(403).json({error: "Forbidden"});
    return false;
  }
  return true;
};

module.exports = {validateSecret};
