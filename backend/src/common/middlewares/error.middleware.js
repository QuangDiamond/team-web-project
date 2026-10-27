export function notFound(_req, res) {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
}

export function errorHandler(error, _req, res, _next) {
  console.error(error);

  const body = {
    success: false,
    message: error.message || 'Internal server error',
  };
  // Lỗi validate theo từng field (từ validator), frontend dùng để hiện lỗi dưới từng ô
  if (error.errors) {
    body.errors = error.errors;
  }

  res.status(error.status || 500).json(body);
}
