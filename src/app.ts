// 외부 모듈
import express from 'express'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import cors from 'cors'
import compression from 'compression'
import helmet from 'helmet'
import hpp from 'hpp'
import swaggerUi from 'swagger-ui-express'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'

// 라우터
import indexRouter from './routes/index'

// 유틸리티
import { connectDatabase } from './lib/database'
import { stream } from './configs/winston'
import errorMiddleware from './middlewares/error.mw'
import swaggerSpec from './configs/apiDocs'
import apiResponser from './lib/apiResponser'

dotenvExpand(dotenv.config())
const app = express()

/**
 * 미들웨어 초기화
 */
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', { stream }))
} else if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  app.use(morgan('dev', { stream }))
}
app.use(cors({ credentials: true, origin: true }))
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
