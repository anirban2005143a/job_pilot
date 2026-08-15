export const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: `Validation failed. ${result.error.issues[0].message}` ,
      });
    }

    req.body = result.data;

    next();
  };
};