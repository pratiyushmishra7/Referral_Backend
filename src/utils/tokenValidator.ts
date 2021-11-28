// External Modules

import jwt, { Secret } from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { createError } from './helper'
import User from '../models/user'

// Function to validate the token and add user details to the request
const validateToken = (req: Request, res:Response, next:NextFunction) => {
  const authorizationHeader = req.headers.authorization
  if (authorizationHeader) {
    const token = authorizationHeader.split(' ')[1]
    const options = {
      expiresIn: '2d',
      issuer: 'referral',
    }

    try {
      const secret = process.env.JWT_SECRET as Secret
      if (!secret) {
        next(createError(500, 'Internal error', 'The JWT secret is not configured properly'))
        return
      }
      jwt.verify(token, secret, options, (err, authorizedData) => {
        if (err) {
          console.log('jwt.verify error 1')
          next(err)
          return
        }

        const usernameFromToken = (<any>authorizedData).user

        if (!usernameFromToken) {
          next(createError(401, 'Invalid token', 'Token supplied does not belong to any user'))
          return
        }

        // Retrieve user from the database
        User.findOne({ username: usernameFromToken })
          .then((userObject) => {
            if (!userObject) {
              next(createError(404, 'Not found', `User with username ${usernameFromToken} does not exist`))
            } else {
              // Pass to the next function in the middleware with user object added
              req.user = userObject
              next()
            }
          })
          .catch((error) => {
            next(error)
          })
      })
    } catch (err) {
      next(err)
    }
  } else {
    next(createError(401, 'Forbidden', 'No authorization header found'))
  }
}

export default validateToken
