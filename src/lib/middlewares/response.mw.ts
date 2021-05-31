import { Request, Response } from 'express'

/**
 * @description 통합 응답 객체
 * @author taypark
 * @since 2020-02-18
 * @param res Express Response
 * @param status Http status code
 * @param data Data for requester
 * @param message Message for requester
 */

 export const apiResponser = ({ req, res, statusCode = 200, data, message }) => {
   let output = {
     result: 'ok',
     status: statusCode,
     data,
   }
 
   if (statusCode > 399) {
     output.result = 'error'
   }
 
   if (message) {
     output = { ...output, message }
   }
 
   /**
    * response 오브젝트 내재화
    */
   res.data = data
   res.statusCode = statusCode
   res.status(statusCode).json(output)
   apiResponseLogger(req, res)
 }
 