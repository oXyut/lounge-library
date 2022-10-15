import './App.css';
import { useRef, useCallback, useState, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import styled from 'styled-components';
import Webcam from 'react-webcam';
import { Box, Button, TextField, Typography, LinearProgress } from '@mui/material';
import {Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from '@mui/material';
import { setCommentRange } from 'typescript';
import axios, { AxiosResponse } from "axios";
import r from "../lib/googleApi.json"


type RES = typeof r

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
  const [lendingList, setlendingList] = useState<any>()
  const [isBookExist, setIsBookExist] = useState<boolean>(false) // 入力されたisbnの本が存在するかどうか
  
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
    const response = await axios.post<RES>(getDatabaseURL, {
    })
    console.log(response.data);
    setlendingList(response.data);
  }

  // axiosでデータベースに貸出情報をjson形式で送る
  const sendRequestToPostDatabase = async () => {
    const response = await axios.post<RES>(postDatabaseURL, {
      bookIsbn: isbn,
      studentId: studentId,
      lendingDatetime: new Date().toLocaleString(),
    }).then(() => {
      setIsbn('')
      setStudentId('')
    }
    )
  }

  // isbn が更新されたときに呼び出される関数
  // Google Books API にリクエストを送り，書籍のタイトルと著者を取得する。
  useEffect(() =>{
    if ((isbn.length===9) || (isbn.length===10) || (isbn.length===13)){ 
      const url = "https://www.googleapis.com/books/v1/volumes?q=isbn:" + isbn;
      axios.get(url)
        .then((res: AxiosResponse<RES>) => {
          console.log(res)
          if(res.data.totalItems > 0){
            console.log(res.data.items[0].volumeInfo.title)
            setTitle(res.data.items[0].volumeInfo.title)
            setAuthors(res.data.items[0].volumeInfo.authors)
          } else {
            setTitle("")
            setAuthors([""])
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

  const studentIdOnChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) =>{
    const _studentId = e.target.value
    setStudentId(_studentId)
  }

  return (
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
              <Button onClick={toggleCam} variant="contained">カメラをきる</Button>
              <Button onClick={capture} variant="contained">文字を読み取る</Button>
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
              <Button onClick={toggleCam} variant="contained">カメラをきる</Button>
              <Button onClick={delImage} variant="contained">リトライ</Button>
            </>
          )
        }
        </>
      ) : (
        <>
          <Button onClick={toggleCam} variant="contained">ISBN をカメラで読み取る</Button>
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
    <p>{ocr}</p>

    <TextField
      value={isbn}
      label="ISBN"
      onChange={isbnOnChangeHandler}
    ></TextField>

    <TextField
      value={studentId}
      label="学籍番号"
      onChange={studentIdOnChangeHandler}
    ></TextField>

    <Button
      variant="contained"
      onClick={sendRequestToPostDatabase}
    >
      借りる
    </Button>

    <Typography>
      {
        title != "" &&
        authors.join(", ") + "「" + title + "」"
      }
    </Typography>

    <Button onClick={sendRequestToGetDatabase} variant="contained">sendRequestToGetDatabase</Button>

    {/* lendingListの一覧を表示するテーブルを作成 */}
    {/* <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>ISBN</TableCell>
            <TableCell align="right">学籍番号</TableCell>
            <TableCell align="right">貸出日時</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lendingList.map((row) => (
            <TableRow
              key={row.bookIsbn}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {row.bookIsbn}
              </TableCell>
              <TableCell align="right">{row.studentId}</TableCell>
              <TableCell align="right">{row.lendingDatetime}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer> */}
    </>
  );
}

export default App;
