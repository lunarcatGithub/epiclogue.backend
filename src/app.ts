// 외부 모듈
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import compression from 'compression'
import helmet from 'helmet'
import hpp from 'hpp'
import swaggerUi from 'swagger-ui-express'
import session from 'express-session'
import connectRedis from 'connect-redis'

// 라우터
import indexRouter from './routes/index'

// 유틸리티
import { connectDatabase } from './lib/database'
import errorMiddleware from './lib/errors/error.handler'
import swaggerSpec from './configs/apiDocs'
import apiResponser from './lib/middlewares/response.mw'
import redisClient from './lib/redisClient'

const app = express()
const RedisStore = connectRedis(session)

/**
 * 미들웨어 초기화
 */
app.use(
  cors({
    credentials: true,
    origin: process.env.NODE_ENV === 'production' ? '.epiclogue.com' : true,
  })
)
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    store: new RedisStore({ client: redisClient.getClient, url: process.env.REDIS_URL }),
    cookie: {
      httpOnly: true,
      maxAge: 3600000, // 1h to ms
      sameSite: process.env.NODE_ENV === 'test' ? 'None' : 'Lax',
      domain: process.env.NODE_ENV === 'test' ? 'localhost:3000' : '.epiclogue.com',
    },
  })
)
app.use(hpp())
app.use(helmet())
app.use(compression())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

/**
 * 데이터베이스 연결
 */
connectDatabase()

/**
 * 라우터 사용
 */
app.use('/', indexRouter)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

/**
 * 에러 핸들러
 */
app.use((err, req, res, next) => {
  if (err) {
    return errorMiddleware
  }

  next()
})

app.use((req, res) => {
  apiResponser({ res, statusCode: 404 })
})

export default app
