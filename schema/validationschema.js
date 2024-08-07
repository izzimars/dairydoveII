const Joi = require("joi");

const contactSchema = Joi.object({
  firstname: Joi.string().min(3).max(50).required(),
  lastname: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  phonenumber: Joi.string()
    .pattern(/^(\+|0)[1-9]\d{1,14}$/)
    .message({
      "string.pattern.base":
        "Phone number must be a valid international format",
    })
    .required(),
  content: Joi.string().min(3).required(),
});

const signupSchema = Joi.object({
  fullname: Joi.string().min(3).max(50).required(),
  username: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  phonenumber: Joi.string()
    .pattern(/^(\+|0)[1-9]\d{1,14}$/)
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
    .pattern(/^(\+|0)[1-9]\d{1,14}$/)
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

const sendPhoneOTPSchema = Joi.object({
  phonenumber: Joi.string()
    .pattern(/^(\+)[1-9]\d{1,14}$/)
    .message({
      "string.pattern.base":
        "Phone number must be a valid international format",
    })
    .optional(),
});

const verifyPhoneOTPSchema = Joi.object({
  phonenumber: Joi.string()
    .pattern(/^(\+|0)[1-9]\d{1,14}$/)
    .message({
      "string.pattern.base":
        "Phone number must be a valid international format",
    })
    .optional(),
  otp: Joi.string().max(6).required().messages({
    "any.only": "Invalid OTP",
  }),
});

const resendOTPSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resendPhoneOTPSchema = Joi.object({
  phonenumber: Joi.string()
    .pattern(/^(\+|0)[1-9]\d{1,14}$/)
    .message({
      "string.pattern.base":
        "Phone number must be a valid international format",
    })
    .optional(),
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

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const dateSchema = Joi.object({
  startDate: Joi.string().pattern(datePattern).required().messages({
    "string.pattern.base": "Start date must be in YYYY-MM-DD format",
  }),
  endDate: Joi.string().pattern(datePattern).required().messages({
    "string.pattern.base": "End date must be in YYYY-MM-DD format",
    "any.only": "End date must be greater than or equal to start date",
  }),
  limit: Joi.number().integer().min(1).default(12),
  page: Joi.number().integer().min(1).default(1),
}).custom((value, helpers) => {
  const { startDate, endDate } = value;
  if (new Date(startDate) > new Date(endDate)) {
    return helpers.message(
      "End date must be greater than or equal to start date"
    );
  }
  return value;
}, "Date validation");

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

const changePhonenumberSchema = Joi.object({
  phonenumber: Joi.string()
    .pattern(/^(\+)[1-9]\d{1,14}$/)
    .message({
      "string.pattern.base":
        "Phone number must be a valid international format",
    })
    .optional(),
});

const changeVerifySchema = Joi.object({
  otp: Joi.string().max(6).required().messages({
    "any.only": "Invalid OTP",
  }),
});

const mongoobjectIdPattern = /^[0-9a-fA-F]{24}$/;

const mongodbSchema = Joi.object({
  id: Joi.string().pattern(mongoobjectIdPattern).required().messages({
    "string.pattern.base": "Invalid MongoDB ObjectID",
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
  changeVerifySchema,
  getDiarySchema,
  postSchema,
  mongodbSchema,
  sendPhoneOTPSchema,
  verifyPhoneOTPSchema,
  resendPhoneOTPSchema,
  changePhonenumberSchema,
  contactSchema,
};
