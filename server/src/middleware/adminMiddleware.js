const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Administrative privileges required to access the Database Analytics Lab.',
      },
    });
  }
  next();
};

module.exports = {
  requireAdmin,
};
