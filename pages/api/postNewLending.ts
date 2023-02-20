// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import * as fs from 'fs'
import * as path from 'path'
import {v4 as uuidv4} from 'uuid'

// type Data = {
//   studentId: string,
//   bookIsbn: string,
//   bookTitle: string,
//   bookAuthors: string[],
// }

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const dataPath = path.join(process.cwd(), 'data', 'lending.json')
  try{
    fs.statSync(dataPath)
  } catch (err) {
    fs.writeFileSync(dataPath, '[]')
  }
  const id = uuidv4();
  const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
  jsonData.push({...req.body, lendingDatetime: Date.now(), id: id, returnedDatetime: null})
  fs.writeFileSync(dataPath, JSON.stringify(jsonData))
  res.status(200).json({id: id})
}