import { useContext } from 'react';
import { Typography, LinearProgress, Button } from '@mui/material';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

import { LendingListContext, IsRequestingNowContext } from '../pages/index';
import dayjs from 'dayjs';

export default function ShowLendingList () {
  const { lendingList } = useContext(LendingListContext)
  const { isRequestingNow } = useContext(IsRequestingNowContext)
  return (
    <>
    <Typography variant="h5" component="h2" gutterBottom sx={{ textDecoration: 'underline' }}>貸し出されている書籍</Typography>
    {
          <>
          {isRequestingNow && <LinearProgress />}
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
                  key={row.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell >{dayjs.unix(row.lendingDatetime/1000).format("YY/MM/DD")}</TableCell>
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
    }
    </>
  )
}