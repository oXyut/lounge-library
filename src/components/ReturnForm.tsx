import { useContext } from 'react';
import { TextField } from '@mui/material';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { red } from '@mui/material/colors';

import { StudentIdContext, LendingListContext } from '../App';

export default function RetrunForm () {

  const { studentId, isStudentIdValid, studentIdOnChangeHandler } = useContext(StudentIdContext)
  const { lendingList } = useContext(LendingListContext)

  const returnBook = (id: string) => {
    console.log(id)
  }
  return (
    <>
      <TextField
        value={studentId}
        label="学籍番号"
        onChange={studentIdOnChangeHandler}
        error={studentId.length !== 0 && !isStudentIdValid}
      ></TextField>
      { isStudentIdValid && lendingList.filter((lending) => lending.studentId === studentId).length > 0 &&
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>貸出日</TableCell>
                <TableCell>学籍番号</TableCell>
                <TableCell>ISBN</TableCell>
                <TableCell>著者</TableCell>
                <TableCell>タイトル</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lendingList.map((row) => (
                <>
                { row.studentId === studentId &&
                  <TableRow
                  key={row.lendingDatetime + "-" + row.studentId}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell >{row.lendingDatetime}</TableCell>
                    <TableCell >{row.studentId}</TableCell>
                    <TableCell component="th" scope="row">{row.bookIsbn}</TableCell>
                    <TableCell >{row.bookAuthors.join(", ")}</TableCell>
                    <TableCell >{row.bookTitle}</TableCell>
                    <TableCell>
                      <IconButton onClick={ ()=>returnBook(row.bookIsbn) }>
                        <DeleteIcon sx={{ color: red.A700 }}/>
                      </IconButton>
                    </TableCell>
                  </TableRow>
                }
                </>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      }
    </>
  )
}