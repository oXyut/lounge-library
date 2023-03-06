import express, {Request, Response} from 'express';
import next from 'next';

import cron from 'node-cron';
import * as path from 'path';
import * as fs from 'fs';

const dev = process.env.NODE_ENV !== 'production';
const app = next({dev});
const handle = app.getRequestHandler();
const port = process.env.PORT || 3000;


type Lending = {
  studentId: string,
  bookIsbn: string,
  bookTitle: string,
  bookAuthors: string[],
  lendingDatetime: number,
  isLendingNow: boolean,
  returnedDatetime: number | null,
}

const returnedDataPath = path.join(process.cwd(), 'data', 'returned.json')

// 毎日0時に，31日以上前に返却されたデータをアーカイブする
cron.schedule('0 0 * * *', () => {
  const fullReturnedData = JSON.parse(fs.readFileSync(returnedDataPath, 'utf8'))
  const newArchiveData = fullReturnedData.filter((item: Lending) => {
    if (item.returnedDatetime !== null) {
      const now = new Date()
      const returnedDatetime = new Date(item.returnedDatetime)
      const diff = now.getTime() - returnedDatetime.getTime()
      const diffDays = diff / (1000 * 3600 * 24)
      return diffDays > 31
    }
  })
  const returnedData = fullReturnedData.filter((item: Lending) => {
    if (item.returnedDatetime !== null) {
      const now = new Date()
      const returnedDatetime = new Date(item.returnedDatetime)
      const diff = now.getTime() - returnedDatetime.getTime()
      const diffDays = diff / (1000 * 3600 * 24)
      return diffDays <= 31
    }
  })

  newArchiveData.forEach((element:Lending)  => {
    const date = element.returnedDatetime ? new Date(element.returnedDatetime) : new Date()
    const archiveDataPath = path.join(process.cwd(), 'data', 'archive', `${date.getFullYear()}-${date.getMonth() + 1}.csv`)

    try{
      fs.statSync(archiveDataPath)
    } catch (err) {
      // なければcsvファイルを作成
      // ヘッダーを書き込み
      fs.writeFileSync(archiveDataPath, 'studentId,bookIsbn,bookTitle,bookAuthors,lendingDatetime,returnedDatetime\n')
    }

    // csvとして書き込み
    const archiveDataPathCSV = `${element.studentId},${element.bookIsbn},${element.bookTitle},${element.bookAuthors.join("，")},${element.lendingDatetime},${element.returnedDatetime}\n`
    fs.appendFileSync(archiveDataPath, archiveDataPathCSV)
  });
  fs.writeFileSync(returnedDataPath, JSON.stringify(returnedData))
  console.log(`Archived ${newArchiveData.length} items.(${new Date()})`)
})

app.prepare().then(() => {
  const server = express();

  server.all("*", (req: Request, res: Response) => {
    return handle(req, res);
  });
  server.listen(port, (err?: any) => {
    if (err) throw err;
    console.log(
      `> Ready on http://localhost:${port} - env ${process.env.NODE_ENV}`
    )
  })
})