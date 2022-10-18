import './App.css';
import { useRef, useCallback, useState, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import styled from 'styled-components';
import Webcam from 'react-webcam';
import { Box, Button, TextField, Typography, LinearProgress, Tab, Tabs, Stack } from '@mui/material';
import {Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import NoPhotographyOutlinedIcon from '@mui/icons-material/NoPhotographyOutlined';
import { red } from '@mui/material/colors';
import { setCommentRange } from 'typescript';
import axios, { AxiosResponse, AxiosError } from "axios";

import r from "../lib/googleApi.json";
import _typeLendingList from "../lib/typeLendingList.json";
import _typeLendingListWithBookInfo from "../lib/typeLendingListWithBookInfo.json";

import SortingAndSelectingTable from "./components/SortingAndSelectingTable";
import { Container } from '@mui/system';

type RES = typeof r
type typeLendingList = typeof _typeLendingList;
type typeLendingListWithBookInfo = typeof _typeLendingListWithBookInfo;

const getDatabaseURL = "https://asia-northeast1-lounge-library.cloudfunctions.net/getDatabase";
const postDatabaseURL = "https://asia-northeast1-lounge-library.cloudfunctions.net/postDatabase";

function App() {
  // useState の定義一覧。
  // 撮られた画像
  const [image, setImage] = useState<string | null | undefined>(null)
  // OCR で取得した文字列
  const [ocr, setOcr] = useState<string>('')
  // ISBN
  const [isbn, setIsbn] = useState<string>('')
  // Google Books API で取得した書籍のタイトル
  const [title, setTitle] = useState<string>('')
  // Google Books API で取得した書籍の著者
  const [authors, setAuthors] = useState<string[]>([''])
  // 学籍番号
  const [studentId, setStudentId] = useState<string>('')
  // カメラが起動しているかどうか
  const [isCamOn, setIsCamOn] = useState<boolean>(false)
  // OCRの進行状況。プログレスバーで使う。
  const [ocrProgress, setOcrProgress] = useState<{status: string, progress: number}>({status: 'recognizing text', progress: 1})
  // Axios Response Type
  const [lendingList, setlendingList] = useState<typeLendingList[]>([])
  const [isBookExist, setIsBookExist] = useState<boolean>(false) // 入力されたisbnの本が存在するかどうか

  // 本の貸出登録を行うときのプログレスバーの表示フラグ管理
  const [isPostingNow, setIsPostingNow] = useState<boolean>(false)
  
  // studentIdの値が適切かどうかのフラグ
  const [isStudentIdValid, setIsStudentIdValid] = useState<boolean>(false)

  // どの本を返却するかを選んでいる状態かどうかのフラグ
  const [isSelectReturnBookMode, setIsSelectReturnBookMode] = useState<boolean>(false)

  // databaseから取得したlendingListに著者やタイトルを追加したもの（未実装）
  const [lendingListWithBookInfo, setLendingListWithBookInfo] = useState<typeLendingListWithBookInfo[]>([])

  // sendRequestToPostDatabase関数のエラーを収納するuseState
  const [errorSendRequestToPostDatabase, setErrorSendRequestToPostDatabase] = useState<string>("")

  // tabの状態を管理するuseState
  const [tabValue, setTabValue] = useState<number>(0)

  // カメラで用いる ref
  const webcamRef = useRef<Webcam>(null);

  // カメラの設定。画質と，起動するカメラの向き（内カメラか外カメラか）を指定。
  const videoConstraints = {
    width: 1920,
    height: 1080,
    facingMode: "environment"
  };

  // 写真が撮られた時に呼び出される処理
  const capture = useCallback(
    () => {
      const imageSrc = webcamRef.current?.getScreenshot();
      if( imageSrc != null){
        // 撮られた画像が null でなければ，image を更新し，OCR を実行する。
        setImage(imageSrc)
        doOCR(imageSrc)
      }
    },
    [webcamRef]
  )

  // 画像を削除する関数。リトライボタンが押されたときに呼び出される。
  const delImage = () =>{
    setImage(null)
  }

  // OCR してくれる労働者を定義
  const worker = createWorker({
    logger: m => {
      setOcrProgress({status: m.status, progress: m.progress})
    }
  })



  // OCR を実行する関数
  const doOCR = async (img: string) => {
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(img);

    // 取得した文字列を ocr に格納
    setOcr(text);

    // 取得した文字列から ISBN の部分を抽出
    const result = text.match(/(I|1)(S|5|s)(B|8|5)N[0-9 -]{9,18}/)
    if(result){
      // ISBN が取得できた場合，結果から数字のみを抽出して isbn に格納
      let resultString = result[0].toString()
      console.log(resultString)
      resultString = resultString.slice(4).replaceAll("-", "").replaceAll(" ", "")
      setIsbn(resultString)
    }
  }

  // カメラの起動・停止を切り替える関数
  const toggleCam = () => {
    setIsCamOn(!isCamOn)
  }

  // axiosでデータベースにリクエストを送る
  const sendRequestToGetDatabase = async () => {
    const response = await axios.post<typeLendingList[]>(getDatabaseURL, {
    })
    const { data } = response;
    setlendingList(data);
  }

  // axiosでデータベースに貸出情報をjson形式で送る
  const sendRequestToPostDatabase = async () => {
    setIsPostingNow(true)
    const request = await axios.post<typeLendingList>(postDatabaseURL, {
      bookIsbn: isbn,
      studentId: studentId,
      lendingDatetime: new Date().toLocaleString(),
      isLendingNow: true,
    }).then((response: AxiosResponse) => {
      console.log(response)
      setIsbn('')
      setStudentId('')
      setIsPostingNow(false)
      setIsBookExist(false)
      setErrorSendRequestToPostDatabase("")
    }).catch((error: AxiosError) => {
      console.log(error)
      setErrorSendRequestToPostDatabase(error.request.response)
      setIsPostingNow(false)
    })
  }

  // isbn が更新されたときに呼び出される関数
  // Google Books API にリクエストを送り，書籍のタイトルと著者を取得する。
  useEffect(() =>{
    if ((isbn.length===9) || (isbn.length===10) || (isbn.length===13)){ 
      const _url = "https://www.googleapis.com/books/v1/volumes?q=isbn:" + isbn;
      axios.get(_url)
        .then((res: AxiosResponse<RES>) => {
          console.log(res)
          if(res.data.totalItems > 0){
            console.log(res.data.items[0].volumeInfo.title)
            setTitle(res.data.items[0].volumeInfo.title)
            setAuthors(res.data.items[0].volumeInfo.authors)
            setIsBookExist(true)
          } else {
            setTitle("")
            setAuthors([""])
            setIsBookExist(false)
          }
        })
    } else {
      return
    }
  }, [isbn])

  // TextField に直接 ISBN を入力されたときに呼び出される関数
  const isbnOnChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) =>{
    const _isbn = e.target.value
    setIsbn(_isbn)
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

  const returnBook = (id: string) => {
    console.log(id)
  }
  return (
    <>
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
        <Tab label="貸出" {...{id: "tab-rent"}}/>
        <Tab label="返却" {...{id: "tab-return"}}/>
      </Tabs>
    </Box>
    <Box
      sx={{
        p: 3,
      }}
    >
    {tabValue === 0 &&
      <>
      {
        isCamOn ? (
          <>
          {
            image == null ? (
              <>
                <Box
                  sx={{
                    width: "30em",
                    height: "30em",
                    border: "1px solid black",
                    maxWidth: "100%",
                  }}
                >
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    forceScreenshotSourceSize
                    screenshotFormat="image/jpeg"
                    width="100%"
                    height="100%"
                    videoConstraints={videoConstraints}
                  />
                </Box>
                <Stack spacing={2} direction="row">
                  <Button onClick={capture} variant="contained"><PhotoCameraIcon sx={{ mr: 1 }} />文字を読み取る</Button>
                  <Button onClick={toggleCam} variant="outlined"><NoPhotographyOutlinedIcon sx={{ mr: 1 }} />カメラをきる</Button>
                </Stack>
              </>
            ) : (
              <>
                <Box
                  sx={{
                    width: "30em",
                    height: "30em",
                    border: "1px solid black",
                    maxWidth: "100%",
                  }}
                >
                  <img src={image} style={{ maxWidth: "100%", maxHeight:"100%"}} />
                </Box>
                <Stack spacing={2} direction="row">
                  <Button onClick={delImage} variant="contained"><PhotoCameraIcon sx={{ mr: 1 }} />リトライ</Button>
                  <Button onClick={toggleCam} variant="outlined"><NoPhotographyOutlinedIcon sx={{ mr: 1 }} />カメラをきる</Button>
                </Stack>
              </>
            )
          }
          </>
        ) : (
          <>
            <Button onClick={toggleCam} variant="contained">
              <PhotoCameraIcon sx={{ mr: 1 }} />
              ISBN をカメラで読み取る
            </Button>
          </>
        )
      }
      { !(ocrProgress.progress === 1 && ocrProgress.status === "recognizing text") &&
      <Box sx={{ width: '100%' }}>
        <Typography>
          {ocrProgress.status}
        </Typography>
        <LinearProgress variant="determinate" value={ocrProgress.progress * 100} />
      </Box>
      }
      {/* <p>{ocr}</p> */}
      <Box sx={{ height:20}} />
      <Typography>ISBNは半角数字（ハイフンなし）で入力してください 例 : 9784150110000</Typography>
      <Typography>学籍番号は半角英数字，小文字で入力してください 例 : 22s2099x</Typography>
      <Box sx={{ height:20}} />
      
      <Stack spacing={2} direction="column">
          <TextField
            value={isbn}
            label="ISBN"
            onChange={isbnOnChangeHandler}
            error={isbn.length !== 0 && !isBookExist}
          ></TextField>
      
        <TextField
          value={studentId}
          label="学籍番号"
          onChange={studentIdOnChangeHandler}
          error={studentId.length !== 0 && !isStudentIdValid}
        ></TextField>
        {
          isBookExist ? (
          <Typography>
            {
              title != "" &&
              authors + "「" + title + "」"
            }
          </Typography>
          ) : (<></>)
        }
        <Button
          variant="contained"
          onClick={sendRequestToPostDatabase}
          disabled={isPostingNow || !isBookExist || !isStudentIdValid}
        >
          借りる
        </Button>
      </Stack>

      {
        isPostingNow ? (
          <LinearProgress />
        ): (
          <></>
        )
      }

      {
        (errorSendRequestToPostDatabase !== "") ?(
          <Typography color="error">{errorSendRequestToPostDatabase}</Typography>
        ):(
          <></>
        )
      }


      </>
    }
    {tabValue === 1 &&
      <>
        <TextField
          value={studentId}
          label="学籍番号"
          onChange={studentIdOnChangeHandler}
          error={studentId.length !== 0 && !isStudentIdValid}
        ></TextField>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>貸出日</TableCell>
                <TableCell>学籍番号</TableCell>
                <TableCell>ISBN</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lendingList.map((row) => (
                <>
                { row.studentId === studentId &&
                  <TableRow
                  key={row.lendingDatetime}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell >{row.lendingDatetime}</TableCell>
                    <TableCell >{row.studentId}</TableCell>
                    <TableCell component="th" scope="row">{row.bookIsbn}</TableCell>
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
      </>
    }
    </Box>
    </Paper>

    <Paper
      elevation={3}
      sx={{
        p: 3,
      }}
    >
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
                  <TableCell>ISBN</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lendingList.map((row) => (
                  <TableRow
                  key={row.lendingDatetime}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell >{row.lendingDatetime}</TableCell>
                    <TableCell >{row.studentId}</TableCell>
                    <TableCell component="th" scope="row">{row.bookIsbn}</TableCell>
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
  </Paper>
  </Stack>
  </Container>
  </>
  );
}

export default App;
