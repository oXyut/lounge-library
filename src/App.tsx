import './App.css';
import { useState, useEffect, createContext } from 'react';
import { Box, Typography, LinearProgress, Tab, Tabs, Stack, Container } from '@mui/material';
import {Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import axios from "axios";

import _typeLendingList from "../lib/typeLendingList.json";

import LendForm from "./components/LendForm";
import ReturnForm from "./components/ReturnForm";
import ShowLendingList from './components/ShowLendingList';


type typeLendingList = typeof _typeLendingList;

const getDatabaseURL = "https://asia-northeast1-lounge-library.cloudfunctions.net/getDatabase";


export const StudentIdContext = createContext({} as {
  studentId: string, setStudentId: React.Dispatch<React.SetStateAction<string>>, isStudentIdValid: boolean, studentIdOnChangeHandler: (event: React.ChangeEvent<HTMLInputElement>) => void
});
export const IsPostingNowContext = createContext({} as {
  isPostingNow: boolean, setIsPostingNow: React.Dispatch<React.SetStateAction<boolean>>,
});
export const LendingListContext = createContext({} as {
  lendingList: typeLendingList[], setLendingList: React.Dispatch<React.SetStateAction<typeLendingList[]>>,
});

function App() {
  // useState の定義一覧。
  // 学籍番号
  const [studentId, setStudentId] = useState<string>('')
  // Axios Response Type
  const [lendingList, setLendingList] = useState<typeLendingList[]>([])

  // 本の貸出登録を行うときのプログレスバーの表示フラグ管理
  const [isPostingNow, setIsPostingNow] = useState<boolean>(false)
  
  // studentIdの値が適切かどうかのフラグ
  const [isStudentIdValid, setIsStudentIdValid] = useState<boolean>(false)

  // tabの状態を管理するuseState
  const [tabValue, setTabValue] = useState<number>(0)

  // axiosでデータベースにリクエストを送る
  const sendRequestToGetDatabase = async () => {
    const response = await axios.get<typeLendingList[]>(getDatabaseURL, {
    })
    const { data } = response;
    setLendingList(data);
  }

  // TextField に studentId を入力されたときに呼び出される関数
  const studentIdOnChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) =>{
    const _studentId = e.target.value
    setStudentId(_studentId)
  }

  // studentIdが適切かどうかを監視するuseEffect
  useEffect(() => {
    const _isStudentUndergraduate = studentId.match(/^[0-9]{2}[a-z]{1}[0-9]{4}[a-z]{1}$/)
    const _isStudentGraduate = studentId.match(/^[0-9]{2}[a-z]{2}[0-9]{3}[a-z]{1}$/)
    if(_isStudentUndergraduate || _isStudentGraduate){
      setIsStudentIdValid(true)
    } else {
      setIsStudentIdValid(false)
    }
  }, [studentId])

  // データベースにリクエストを送って貸出情報を更新する
  //(isPostingNowを見てるのは暫定的な処理で，後で変更が必要かも)
  useEffect(() => {
    sendRequestToGetDatabase()
  }, [isPostingNow])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };


  return (
    <>
    <LendingListContext.Provider value={{lendingList, setLendingList}}>
    <Container>
    <Typography variant="h4" component="h1" gutterBottom>リフレッシュラウンジ6F貸出管理システム</Typography>
    <Stack spacing={2}>
      <Paper
      elevation={3}
      >
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
        >
          <Tab label={<Typography variant='h6'>貸出</Typography>} {...{id: "tab-rent"}}/>
          <Tab label={<Typography variant='h6'>返却</Typography>} {...{id: "tab-return"}}/>
        </Tabs>
      </Box>
      <Box
        sx={{
          p: 3,
        }}
      >
        <StudentIdContext.Provider value={{studentId, setStudentId, isStudentIdValid, studentIdOnChangeHandler}}>
          <IsPostingNowContext.Provider value={{isPostingNow, setIsPostingNow}}>
            
            {tabValue === 0 &&
              <LendForm />
            }
            {tabValue === 1 &&
              <ReturnForm />
            }
          </IsPostingNowContext.Provider>
        </StudentIdContext.Provider>
      </Box>
    </Paper>

    <Paper
      elevation={3}
      sx={{
        p: 3,
      }}
    >
    <ShowLendingList />
  </Paper>
  </Stack>
  </Container>
  </LendingListContext.Provider>
  </>
  );
}

export default App;
