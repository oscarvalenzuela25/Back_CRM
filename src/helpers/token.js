const jwt = require('jsonwebtoken');

exports.createToken = ({ user, seed, expiresIn }) => {
  const token = jwt.sign(
    {
      data: user,
    },
    seed,
    { expiresIn }
  );
  return token;
};

exports.decodeToken = ({ token, seed }) => {
  const { data } = jwt.verify(token, seed);
  return data;
};
