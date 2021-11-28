// External Modules
import express, {
  RequestHandler, Request, Response, NextFunction,
} from 'express'
import jwt, { Secret } from 'jsonwebtoken'
import randomstring from 'randomstring'

// Helper functions
import { pointsGain, milestones, maskedEmail } from '../utils/helper'
import validateToken from '../utils/tokenValidator'

// Model
import User from '../models/user'

const router = express.Router({ mergeParams: true })

// API to login and generate refresh token
const userLogin = (req:Request, res: Response, next:NextFunction) => {
  if (!req.body) {
    const result = {
      message: 'Received request with no body',
      status: 404,
    }
    return res.status(200).json(result)
  }

  const { password } = req.body
  const { username } = req.body

  // Retrieve the username from the database
  User.findOne({ username }).then((userDoc) => {
    if (!userDoc) {
      const result = {
        message: 'No such user found!!',
        status: 404,
      }
      return res.status(200).json(result)
    }
    const userObject = userDoc.toObject()

    // Get the password
    const userPassword = userObject.password

    if (userPassword === password) {
      // Create a token
      const payload = { user: userObject.username }
      const options = { expiresIn: '2d', issuer: 'referral' }
      const secret = process.env.JWT_SECRET as Secret

      if (secret === undefined) {
        const result = {
          message: 'Token secret key not initialized',
          status: 500,
        }
        return res.status(200).json(result)
      }

      const token = jwt.sign(payload, secret, options)

      const result = {
        message: 'Successfull Login',
        status: 200,
        token,
        userId: userObject._id,
        expiresIn: 172800 as Number,
      }

      return res.status(200).send(result)
    }
    const result = {
      message: 'Password is Incorrect!!',
      status: 400,
    }
    return res.status(200).json(result)
  })
    .catch((error) => {
      next(error)
      return res.status(400).json(error)
    })

  return null
}

// API to sign up with referral code and give incentives to both the referee and referred user
const userSignUp : RequestHandler = async (req:Request, res: Response) => {
  const { hasReferral } = req.body
  let refereeUser = null
  let refereeUserObj
  let score : Number = 0

  // If referral is present
  if (hasReferral) {
    refereeUser = await User.findOne({ referralCode: req.body.referral }).exec()
    if (!refereeUser) {
      return res.status(400).json({ error: 'Not a valid referral code' })
    }
    refereeUserObj = refereeUser.toObject()
    if (!refereeUserObj.isReferral) {
      return res.status(400).json({ error: 'Not a valid referral code' })
    }
    score = 100
  }

  try {
    // Adding new User
    const userBody = {
      username: req.body.username,
      password: req.body.password,
      email: req.body.email,
      score,
      referralCode: randomstring.generate(20),
    }

    const user = new User(userBody)
    const token = user.generateAuthToken()
    await user.save()
    const result = {
      message: 'Successfully Signed In',
      token,
      status: 200,
      userId: user._id,
      expiresIn: 172800 as Number,
    }

    // Updating the Referee
    if (hasReferral) {
      refereeUserObj.totalReferrals += 1
      refereeUserObj.score += pointsGain(refereeUserObj.totalReferrals)
      refereeUserObj.referralHistoryUsers.push(maskedEmail(userBody.email))
      refereeUserObj.referralHistoryIncentives.push(20)
      await refereeUser.update(refereeUserObj)
    }

    return res.status(200).json(result)
  } catch (error) {
    console.log(error)
    return res.status(400).json(error)
  }
}

// API to get the user details
const getUser : RequestHandler = async (req:Request, res: Response) => {
  try {
    const { user } = req
    if (!user) {
      throw new Error()
    }
    return res.status(200).json(user.toObject())
  } catch (error) {
    return res.status(500).json(error)
  }
}

// API to enrol into or withdraw from the Referral System
const updateReferral : RequestHandler = async (req:Request, res: Response) => {
  try {
    const { user } = req
    if (!user) {
      throw new Error()
    }
    const userObj = user.toObject()
    userObj.isReferral = req.body.isReferral
    await user.update(userObj)
    return res.status(200).json(userObj)
  } catch (error) {
    return res.status(500).json(error)
  }
}

// API to get the personalized referral code for the user.
const getReferral : RequestHandler = async (req:Request, res: Response) => {
  try {
    const { user } = req
    if (!user) {
      throw new Error()
    }
    const userObj = user.toObject()
    if (!userObj.isReferral) {
      return res.status(200).json({ message: 'Not enrolled in referral system yet!!' })
    }
    const results = {
      referralCode: userObj.referralCode,
    }
    return res.status(200).json(results)
  } catch (error) {
    return res.status(500).json(error)
  }
}

// API to get user's referral history and the incentives.
const getReferralIncentives : RequestHandler = async (req:Request, res: Response) => {
  try {
    const { user } = req
    if (!user) {
      throw new Error()
    }
    const userObj = user.toObject()
    const result = {
      emaiils: userObj.referralHistoryUsers,
      scores: userObj.referralHistoryIncentives,
    }
    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json(error)
  }
}

// API to get the milestones.
const getMilestones : RequestHandler = async (req:Request, res: Response) => {
  try {
    const { user } = req
    if (!user) {
      throw new Error()
    }
    const userObj = user.toObject()
    const result = milestones(userObj.totalReferrals)
    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json(error)
  }
}

router.get('/', validateToken, getUser)
router.get('/referral', validateToken, getReferral)
router.get('/referralIncentives', validateToken, getReferralIncentives)
router.get('/milestones', validateToken, getMilestones)
router.put('/updateReferral', validateToken, updateReferral)
router.post('/login', userLogin)
router.post('/signup', userSignUp)

export default router
