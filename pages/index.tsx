import { useState, useEffect, createContext } from 'react';
import { Button, Box, Typography, Paper, Tab, Tabs, Stack, Container } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import axios from "axios";

import LendForm from "../components/LendForm";
import ReturnForm from "../components/ReturnForm";
import ShowLendingList from '../components/ShowLendingList';
import AppBar from "../components/AppBar"

type typeLendingList = {
  id : string,
  lendingDatetime: number,
  bookIsbn: string,
  bookAuthors: string[],
  bookTitle: string,
  studentId: string,
  isLendingNow: boolean,
}

const theme = createTheme({
  palette: {
    primary: {
      light: '#00695C',
      main: '#00695C',
      dark: '#00695C',
      contrastText: '#fff',
    },
    secondary: {
      light: '#ff7961',
      main: '#f44336',
      dark: '#ba000d',
      contrastText: '#000',
    },
  },
});



export const StudentIdContext = createContext({} as {
  studentId: string, setStudentId: React.Dispatch<React.SetStateAction<string>>, isStudentIdValid: boolean, studentIdOnChangeHandler: (event: React.ChangeEvent<HTMLInputElement>) => void
});
export const IsPostingNowContext = createContext({} as {
  isPostingNow: boolean, setIsPostingNow: React.Dispatch<React.SetStateAction<boolean>>,
});
export const IsRequestingNowContext = createContext({} as {
  isRequestingNow: boolean, setIsRequestingNow: React.Dispatch<React.SetStateAction<boolean>>,
});
export const LendingListContext = createContext({} as {
  lendingList: typeLendingList[], setLendingList: React.Dispatch<React.SetStateAction<typeLendingList[]>>,
});
export const IsFirstResquestContext = createContext({} as {
  isFirstRequest: boolean, setIsFirstRequest: React.Dispatch<React.SetStateAction<boolean>>,
});



function App() {
  // useState の定義一覧。
  // 学籍番号
  const [studentId, setStudentId] = useState<string>('')
  // Axios Response Type
  const [lendingList, setLendingList] = useState<typeLendingList[]>([])

  // 一度でもsendRequestが実行されたかどうか
  const [isFirstRequest, setIsFirstRequest] = useState<boolean>(false)

  // 本の貸出登録を行うときのプログレスバーの表示フラグ管理
  const [isPostingNow, setIsPostingNow] = useState<boolean>(false)

  // 本の情報をリクエストするときのプログレスバーを表示フラグ管理
  const [isRequestingNow, setIsRequestingNow] = useState<boolean>(false)

  // studentIdの値が適切かどうかのフラグ
  const [isStudentIdValid, setIsStudentIdValid] = useState<boolean>(false)

  // tabの状態を管理するuseState
  const [tabValue, setTabValue] = useState<number>(0)

  // axiosでデータベースにリクエストを送る
  const sendRequestToGetDatabase = async () => {
    setIsRequestingNow(true);
    const response = await axios.get<typeLendingList[]>("/api/getLendingList", {
    })
    const { data } = response;
    // dataをdata.data.lendingDatetimeをキーとして降順でソートする
    data.sort((a, b) => {
      if (a.lendingDatetime > b.lendingDatetime) {
        return -1;
      } else {
        return 1;
      }
    })
    setLendingList(data);
    setIsRequestingNow(false);
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
    // worning を黙らせてる↓
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPostingNow])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };


  return (
    <>
    <ThemeProvider theme={theme}>
    <LendingListContext.Provider value={{lendingList, setLendingList}}>
    <Container>
    {/* <Typography variant="h4" component="h1" gutterBottom>リフレッシュラウンジ6F貸出管理システム</Typography> */}
    <AppBar/>
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
    <IsFirstResquestContext.Provider value={{isFirstRequest, setIsFirstRequest}}>
    <IsRequestingNowContext.Provider value={{isRequestingNow, setIsRequestingNow}}>
    <ShowLendingList />
    </IsRequestingNowContext.Provider>
    </IsFirstResquestContext.Provider >
    <Button onClick={sendRequestToGetDatabase}>
      <ReplayIcon sx={{ mr: 1 }} />
      更新する
    </Button>
  </Paper>
  </Stack>
  </Container>
  </LendingListContext.Provider>
  </ThemeProvider>
  </>
  );
}

export default App;
