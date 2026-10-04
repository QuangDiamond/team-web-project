export function notFound(_req, res) {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
}

export function errorHandler(error, _req, res, _next) {
  console.error(error);

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal server error',
  });
}
