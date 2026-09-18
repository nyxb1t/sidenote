export function errorHandler(error, req, res, next) {
  console.error(error);
  res.status(error.statusCode ?? 500).json({
    error: {
      code: error.code ?? 'INTERNAL_ERROR',
      message: error.statusCode && error.message ? error.message : 'Internal server error',
    },
  });
}
