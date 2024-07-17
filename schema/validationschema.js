const Joi = require("joi");

const signupSchema = Joi.object({
  fullname: Joi.string().min(3).max(50).required(),
  username: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  phonenumber: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .message({
      "string.pattern.base":
        "Phone number must be a valid international format",
    })
    .required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9!@#$%^&*(),.?":{}|<>]{8,}$/)
    .messages({
      "string.min": "Password must be at least 8 characters long",
      "string.pattern.base": "Password must contain both letters and numbers",
    }),
});

const personalInfoSchema = Joi.object({
  fullname: Joi.string().min(3).max(50).optional(),
  username: Joi.string().min(3).optional(),
  phonenumber: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .message({
      "string.pattern.base":
        "Phone number must be a valid international format",
    })
    .optional(),
});

const verifyOTPSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().max(6).required().messages({
    "any.only": "Invalid OTP",
  }),
});

const resendOTPSchema = Joi.object({
  email: Joi.string().email().required(),
});

const loginSchema = Joi.object({
  username: Joi.string().min(3).max(20),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9!@#$%^&*(),.?":{}|<>]{8,}$/)
    .messages({
      "string.min": "Password must be at least 8 characters long",
      "string.pattern.base": "Password must contain both letters and numbers",
    }),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const newPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9!@#$%^&*(),.?":{}|<>]{8,}$/)
    .messages({
      "string.min": "Password must be at least 8 characters long",
      "string.pattern.base": "Password must contain both letters and numbers",
    })
    .required(),
  confirmPassword: Joi.any().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match",
  }),
});

const dateSchema = Joi.object({
  startDate: Joi.date().required(),
  endDate: Joi.date().min(Joi.ref("startDate")).required().messages({
    "date.min": "End date must be greater than or equal to start date",
  }),
  limit: Joi.number().integer().min(1).default(12),
  page: Joi.number().integer().min(1).default(1),
});

const getDiarySchema = Joi.object({
  limit: Joi.number().integer().min(1).default(12),
  page: Joi.number().integer().min(1).default(1),
});

const postSchema = Joi.object({
  content: Joi.string().required(),
});

const timePattern = /^([0-1]?[0-9]):([0-5][0-9])\s(am|pm)$/;

const timeSchema = Joi.object({
  times: Joi.array()
    .items(
      Joi.string().pattern(timePattern).messages({
        "string.pattern.base": 'Must be a valid time in the format "12:30 am"',
      })
    )
    .required()
    .messages({
      "array.base": "Times must be an array",
      "any.required": "Times are required",
    }),
});

const setupPasswdSchema = Joi.object({
  oldpassword: Joi.string().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9!@#$%^&*(),.?":{}|<>]{8,}$/)
    .messages({
      "string.min": "Password must be at least 8 characters long",
      "string.pattern.base": "Password must contain both letters and numbers",
    })
    .required(),
  confirmPassword: Joi.any().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match",
  }),
});

const changeemailSchema = Joi.object({
  email: Joi.string().email().required(),
});

const changeemailVerifySchema = Joi.object({
  otp: Joi.string().max(6).required().messages({
    "any.only": "Invalid OTP",
  }),
});
module.exports = {
  signupSchema,
  personalInfoSchema,
  loginSchema,
  forgotPasswordSchema,
  dateSchema,
  verifyOTPSchema,
  resendOTPSchema,
  timeSchema,
  newPasswordSchema,
  setupPasswdSchema,
  changeemailSchema,
  changeemailVerifySchema,
  getDiarySchema,
  postSchema,
};
