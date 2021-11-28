// External Modules
import mongoose from 'mongoose'
import jwt, { Secret } from 'jsonwebtoken'
import isEmail from 'validator/lib/isEmail'

// Model
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    validate: [isEmail, 'invalid email'],
    trim: true,
  },
  referralCode: {
    unique: true,
    type: String,
    minlength: 20,
    maxlength: 20,
    trim: true,
  },
  score: {
    type: Number,
    required: true,
    default: 0,
  },
  isReferral: {
    type: Boolean,
    required: true,
    default: true,
  },
  totalReferrals: {
    type: Number,
    required: false,
    default: 0,
  },
  referralHistoryUsers: {
    type: [{
      type: String,
    }],
    default: [],
  },
  referralHistoryIncentives: {
    type: [{
      type: Number,
    }],
    default: [],
  },
}, { timestamps: true })

// Function to generate the token
userSchema.methods.generateAuthToken = function () {
  const user = this
  try {
    const payload = { user: user.username }
    const options = { expiresIn: '2d', issuer: 'referral' }
    const secret = process.env.JWT_SECRET as Secret
    const token = jwt.sign(payload, secret, options)
    return token
  } catch (error) {
    return console.log(error)
  }
}

const User = mongoose.model('User', userSchema)
export default User
