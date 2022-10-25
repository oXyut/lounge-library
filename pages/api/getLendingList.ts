// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import * as path from 'path'
import * as fs from 'fs'


type Lending = {
  studentId: string,
  bookIsbn: string,
  bookTitle: string,
  bookAuthors: string[],
  lendingDatetime: number,
}
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Lending[]>
) {
  const lendingDataPath = path.join(process.cwd(), 'data', 'lending.json')
  try{
    fs.statSync(lendingDataPath)
  } catch (err) {
    fs.writeFileSync(lendingDataPath, '[]')
  }
  const jsonData = JSON.parse(fs.readFileSync(lendingDataPath, 'utf8'))
  res.status(200).json(jsonData)
}
