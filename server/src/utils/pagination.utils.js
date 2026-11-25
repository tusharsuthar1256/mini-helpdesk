const getPagination = (query, defaultLimit) => {
  let page = parseInt(query.page) || 1;
  let limit = parseInt(query.limit) || defaultLimit;

  if (page < 1) page = 1;
  if (limit < 1) limit = defaultLimit;
  if (limit > 100) limit = 100;

  return { page, limit, skip: (page - 1) * limit };
};

const pageInfo = (page, limit, total) => {
  return { page, limit, total, totalPages: Math.ceil(total / limit) || 1 };
};

module.exports = { getPagination, pageInfo };
