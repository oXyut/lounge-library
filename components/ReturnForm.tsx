import { useEffect, useState, useContext } from 'react';
import { TextField } from '@mui/material';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox, Button, Typography, Box, Snackbar } from '@mui/material';
import { LinearProgress } from '@mui/material';
import axios, { AxiosResponse, AxiosError } from "axios";
import { StudentIdContext, LendingListContext, IsPostingNowContext } from 'pages/index';
import dayjs from 'dayjs';


export default function RetrunForm () {

  const { studentId, isStudentIdValid, studentIdOnChangeHandler } = useContext(StudentIdContext)
  const { lendingList } = useContext(LendingListContext)
  const { isPostingNow, setIsPostingNow} = useContext(IsPostingNowContext)
  const [ isBookGoingToBeReturned, setIsBookGoingToBeReturned ] = useState<{[key:string]:boolean}>({})
  // snackbarを管理するuseState
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string}>({open: false, message: ""})

  useEffect(() => {
    const lendingListByStudentId = lendingList.filter((lending) => lending.studentId === studentId)
    var newRetrunableList: {[key:string]:boolean}= {}
    lendingListByStudentId.forEach((lending) => {
      newRetrunableList[lending.id] = false
    })
    setIsBookGoingToBeReturned(newRetrunableList)
  }, [studentId, lendingList])


  const returnBook = async () => {
    const ids = Object.keys(isBookGoingToBeReturned).filter((key) => isBookGoingToBeReturned[key])
    const data = ids.map((id) => lendingList.filter((lending) => lending.id === id)[0]).map((lending) => {
      return {
        id: lending.id,
        isLendingNow: lending.isLendingNow
      }
    })
    console.log(data)
    setIsPostingNow(true)
    await axios.post("/lounge-library/api/returnBooks", {data})
      .then((response: AxiosResponse) => {
      setIsPostingNow(false);
      setSnackbar({open: true, message: `${ids.length}冊返却しました`})
    }).catch((error: AxiosError) => {
      setIsPostingNow(false);
    })
  }

  const checkboxHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.name
    setIsBookGoingToBeReturned({...isBookGoingToBeReturned, [id]: e.target.checked})
  }


  return (
      <>
        <Typography variant='h6'>
          返却方法
        </Typography>
        <Typography>
          １．学籍番号を入力
        </Typography>
        <Typography>
          ２．返却する書籍を選択
        </Typography>
        <Typography>
          ３．返却ボタンを押す
        </Typography>
        <Typography>
          ※ 返却済みの書籍を選択すると返却を取り消せます
        </Typography>
        <Box sx={{ height: 20 }} />

        <TextField
          value={studentId}
          label="学籍番号"
          onChange={studentIdOnChangeHandler}
          error={studentId.length !== 0 && !isStudentIdValid}
        ></TextField>

        {
          isPostingNow ? (
            <LinearProgress />
          ) : (
            <></>
          )
        }
        {
          isStudentIdValid? (
            <>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>返却</TableCell>
                <TableCell>貸出状況</TableCell>
                <TableCell>貸出日</TableCell>
                {/* <TableCell>学籍番号</TableCell> */}
                {/* <TableCell>ISBN</TableCell> */}
                <TableCell>タイトル</TableCell>
                <TableCell>著者</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lendingList.map((row) => (
                <>
                { row.studentId === studentId &&
                  <TableRow
                  key={row.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                  <TableCell>
                    <Checkbox name={row.id} checked={isBookGoingToBeReturned[row.id] === undefined ? false : isBookGoingToBeReturned[row.id]} onChange={ checkboxHandler } />
                  </TableCell>
                    {
                      row.isLendingNow ? (
                        <TableCell>貸出中</TableCell>
                      ) : (
                        <TableCell>返却済み</TableCell>
                      )
                    }
                    <TableCell >{dayjs.unix(row.lendingDatetime/1000).format("YY/MM/DD")}</TableCell>
                    {/* <TableCell >{row.studentId}</TableCell> */}
                    {/* <TableCell component="th" scope="row">{row.bookIsbn}</TableCell> */}
                    <TableCell >{row.bookTitle}</TableCell>
                    <TableCell >{row.bookAuthors.join(", ")}</TableCell>
                  </TableRow>
                }
                </>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ height: 30 }} />
        <Button
          variant="contained"
          onClick={returnBook}
          disabled={isPostingNow || !isStudentIdValid || Object.keys(isBookGoingToBeReturned).filter((key) => isBookGoingToBeReturned[key]).length === 0}
        >
          返却
        </Button>
        <Snackbar
          open={snackbar.open}
          message = {snackbar.message}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          autoHideDuration={6000}
          onClose={() => setSnackbar({open: false, message: ""})}
        />
        </>):(<></>)
}
</>)}