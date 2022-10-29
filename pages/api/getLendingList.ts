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
  isLendingNow: boolean,
  returnedDatetime: number | null,
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
  const lendingData = JSON.parse(fs.readFileSync(lendingDataPath, 'utf8'))
  // isLendingNow を追加
  lendingData.map((item: Lending) => {
    item.isLendingNow = true
  })

  // ここから返却済みのものを加える操作
  const returnedDataPath = path.join(process.cwd(), 'data', 'returned.json')
  try{
    fs.statSync(returnedDataPath)
  } catch (err) {
    fs.writeFileSync(returnedDataPath, '[]')
  }
  // 返却済みのデータを取得
  const returnedData = JSON.parse(fs.readFileSync(returnedDataPath, 'utf8'))
  returnedData.map((item: Lending) => {
    item.isLendingNow = false
  })
  
  lendingData.push(...returnedData)
  res.status(200).json(lendingData)
}
