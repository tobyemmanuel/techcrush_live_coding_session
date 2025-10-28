import { body } from "express-validator";

const registrationValidator = [
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .bail()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long"),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Invalid email format"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("confirmPassword").custom((value, { req }) => {
    if (req.body.password && value !== req.body.password) {
      throw new Error("Password confirmation does not match password");
    }
    return true;
  }),
  body("phoneNumber")
    .optional()
    .isMobilePhone()
    .withMessage("Invalid phone number"),
  body("gender")
    .notEmpty()
    .withMessage("Gender is required")
    .bail()
    .isIn(["male", "female", "others"])
    .withMessage("Gender should be male, female or others"),
];

const loginValidator = [
  body("email")
    .notEmpty()
    .withMessage("Invalid Email or Password")
    .bail()
    .isEmail()
    .withMessage("Invalid Email or Password"),
  body("password").notEmpty().withMessage("Invalid Email or Password"),
];

export { registrationValidator, loginValidator };
