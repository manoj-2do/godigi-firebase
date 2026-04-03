const validateCreateUserBody = (body, response) => {
  const {email, password} = body;
  if (!email || !password) {
    response.status(400).json({error: "Email and password are required"});
    return false;
  }
  return true;
};

module.exports = {validateCreateUserBody};
