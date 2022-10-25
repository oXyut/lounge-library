// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import * as fs from 'fs'
import * as path from 'path'

type Lending = {
  studentId: string,
  bookIsbn: string,
  bookTitle: string,
  bookAuthors: string[],
  lendingDatetime: number,
  id: string,
}
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const lendingDataPath = path.join(process.cwd(), 'data', 'lending.json')
  const returnedDataPath = path.join(process.cwd(), 'data', 'returned.json')
  try{
    fs.statSync(lendingDataPath)
  } catch (err) {
    fs.writeFileSync(lendingDataPath, '[]')
  }
  try{
    fs.statSync(returnedDataPath)
  } catch (err) {
    fs.writeFileSync(returnedDataPath, '[]')
  }
  const lendingData = JSON.parse(fs.readFileSync(lendingDataPath, 'utf8'))
  const returnedData = JSON.parse(fs.readFileSync(returnedDataPath, 'utf8'))

  const newLendingData = lendingData.filter((item: Lending) => !req.body.ids.includes(item.id))
  fs.writeFileSync(lendingDataPath, JSON.stringify(newLendingData))

  const newReturndedData = [...returnedData, ...lendingData.filter((item: Lending) => req.body.ids.includes(item.id))]
  fs.writeFileSync(returnedDataPath, JSON.stringify(newReturndedData))

  res.status(200).send("ok")
}