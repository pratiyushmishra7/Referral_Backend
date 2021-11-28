export const ENVIRONMENT = process.env.NODE_ENV

export const MONGODB_URI: string = process.env.MONGODB_URI || 'mongodb://localhost:27017/referral'

export const JWT_SECRET: string = process.env.JWT_SECRET || 'default'
