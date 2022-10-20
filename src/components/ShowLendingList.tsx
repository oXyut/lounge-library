import { useContext } from 'react';
import { Typography, LinearProgress } from '@mui/material';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

import { LendingListContext } from '../App';

export default function ShowLendingList () {
  const { lendingList } = useContext(LendingListContext)
  return (
    <>
    <Typography variant="h5" component="h2" gutterBottom sx={{ textDecoration: 'underline' }}>貸出状況</Typography>
    {/* lendingListの中身を表示するTableの作成 ほぼGithub copilotが作ったので書いた内容にあまり責任持てないです*/}
    {
      lendingList.length !== 0 ? (
          <>
          <TableContainer>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>貸出日</TableCell>
                  <TableCell>学籍番号</TableCell>
                  {/* <TableCell>ISBN</TableCell> */}
                  <TableCell>タイトル</TableCell>
                  <TableCell>著者</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lendingList.filter(row => row.isLendingNow === true).map((row) => (
                  <TableRow
                  key={row.lendingDatetime}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell >{row.lendingDatetime}</TableCell>
                    <TableCell >{row.studentId}</TableCell>
                    {/* <TableCell component="th" scope="row">{row.bookIsbn}</TableCell> */}
                    <TableCell >{row.bookTitle}</TableCell>
                    <TableCell >{row.bookAuthors.join(", ")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          </>
      ):(
        <>
        <Typography>貸出履歴を読込中</Typography>
        <LinearProgress/>
        </>
      )
  }
    </>
  )
}