import { validationResult } from "express-validator";

const myValidationResult = validationResult.withDefaults({
  formatter: (error) => error.msg,
});

const validationMiddleware = (req, res, next) => {
  const result = myValidationResult(req);

  if (!result.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation errors",
      data: result.array(),
    });
  }

  next();
};

export default validationMiddleware;
