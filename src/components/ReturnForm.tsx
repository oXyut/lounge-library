import { useEffect, useState, useContext } from 'react';
import { TextField } from '@mui/material';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox, Button, Typography, Box } from '@mui/material';
import { LinearProgress } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { red } from '@mui/material/colors';
import _typeLendingList from '../../lib/typeLendingList.json';
import firebaseURL from '../firebaseURL.json';
import axios, { AxiosResponse, AxiosError } from "axios";
import { StudentIdContext, LendingListContext, IsPostingNowContext } from '../App';
import dayjs from 'dayjs';

type typeLendingList = {
  id : string,
  data: {
    lendingDatetime: {_seconds: number, _nanoseconds: number},
  isLendingNow: boolean,
  bookIsbn: string,
  bookAuthors: string[],
  bookTitle: string,
  studentId: string,
  }
}

const toggleIsLendingNowURL = firebaseURL.root + "/toggleIsLendingNow";


export default function RetrunForm () {

  const { studentId, isStudentIdValid, studentIdOnChangeHandler } = useContext(StudentIdContext)
  const { lendingList } = useContext(LendingListContext)
  const { isPostingNow, setIsPostingNow} = useContext(IsPostingNowContext)
  const [ isBookGoingToBeReturned, setIsBookGoingToBeReturned ] = useState<{[key:string]:boolean}>({})

  useEffect(() => {
    const lendingListByStudentId = lendingList.filter((lending) => lending.data.studentId === studentId)
    var newRetrunableList: {[key:string]:boolean}= {}
    lendingListByStudentId.forEach((lending) => {
      newRetrunableList[lending.id] = false
    })
    setIsBookGoingToBeReturned(newRetrunableList)
  }, [studentId, lendingList])


  const returnBook = async () => {
    console.log("isBookGoing...", isBookGoingToBeReturned)
    const ids = Object.keys(isBookGoingToBeReturned).filter((key) => isBookGoingToBeReturned[key]) // 返却する本の情報（今はlendingDatetimeで指定している。配列で複数のlendingDatetimeを持ってる。うまく加工して）
    console.log("ids", ids)
    setIsPostingNow(true)
    const request = await axios.post<typeLendingList>(toggleIsLendingNowURL, {ids})
      .then((response: AxiosResponse) => {
      console.log(response)
      setIsPostingNow(false);
    }).catch((error: AxiosError) => {
      console.log(error)
      setIsPostingNow(false);
    })
  }
  const checkboxHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.name
    console.log({...isBookGoingToBeReturned, [id]: e.target.checked})
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
          ２．返却する本を選択
        </Typography>
        <Typography>
          ３．返却ボタンを押す
        </Typography>
        <Typography>
          ※ 返却済みの本を選択すると返却を取り消せます
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
                <TableCell>貸出日</TableCell>
                {/* <TableCell>学籍番号</TableCell> */}
                {/* <TableCell>ISBN</TableCell> */}
                <TableCell>タイトル</TableCell>
                <TableCell>著者</TableCell>
                <TableCell>貸出状況</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lendingList.map((row) => (
                <>
                { row.data.studentId === studentId &&
                  <TableRow
                  key={row.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                  <TableCell>
                    <Checkbox name={row.id} checked={isBookGoingToBeReturned[row.id] === undefined ? false : isBookGoingToBeReturned[row.id]} onChange={ checkboxHandler } />
                  </TableCell>
                    <TableCell >{dayjs.unix(row.data.lendingDatetime._seconds).format("YY/MM/DD")}</TableCell>
                    {/* <TableCell >{row.studentId}</TableCell> */}
                    {/* <TableCell component="th" scope="row">{row.bookIsbn}</TableCell> */}
                    <TableCell >{row.data.bookTitle}</TableCell>
                    <TableCell >{row.data.bookAuthors.join(", ")}</TableCell>
                    {
                      row.data.isLendingNow ? (
                        <TableCell>貸出中</TableCell>
                      ) : (
                        <TableCell>返却済み</TableCell>
                      )
                    }
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
        </>):(<></>)
}
</>)}