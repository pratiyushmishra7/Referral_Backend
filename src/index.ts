// External Modules

import * as dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import responseTime from 'response-time'
import compression from 'compression' // compresses requests
import lusca from 'lusca'
import path from 'path'

import mongoose, { ConnectOptions } from 'mongoose'
import bluebird from 'bluebird'
import { MONGODB_URI } from './utils/secrets'

// Routers
import userRouter from './controllers/user'

dotenv.config()

// App Variables

if (!process.env.PORT) {
  process.exit(1)
}

const PORT: number = parseInt(process.env.PORT as string, 10)

const app = express()

// Connect to MongoDB

const mongoUrl: string = MONGODB_URI
mongoose.Promise = bluebird
mongoose.connect(mongoUrl, { useNewUrlParser: true } as ConnectOptions).then(
  () => { /** ready to use. The `mongoose.connect()` promise resolves to undefined. */ },
).catch((err) => {
  console.log(`MongoDB connection error. Please make sure MongoDB is running. ${err}`)
  process.exit()
})

// App Configuration

app.set('port', process.env.PORT || 3000)
app.use(compression())
app.use(responseTime())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())
app.use(lusca.xframe('SAMEORIGIN'))
app.use(lusca.xssProtection(true))
app.use(
  express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }),
)

const apiRouter = express.Router()
app.use('/api', apiRouter)
apiRouter.use('/user', userRouter)

// test route to make sure everything is working
apiRouter.get('/', (req, res) => {
  res.send('Hello world!')
})

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})
