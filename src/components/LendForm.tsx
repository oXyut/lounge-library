import { createWorker } from 'tesseract.js';
import { useRef, useCallback, useState, useEffect, useContext } from 'react';
import { Box, Button, TextField, Typography, LinearProgress, Stack, Snackbar } from '@mui/material';
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import NoPhotographyOutlinedIcon from '@mui/icons-material/NoPhotographyOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Webcam from 'react-webcam';
import axios, { AxiosResponse, AxiosError } from "axios";

import { StudentIdContext, IsPostingNowContext } from '../App';

import r from "../../lib/googleApi.json";
import firebaseURL from "../firebaseURL.json"

import _typePostLendingList from "../../lib/typePostLendingList.json";

type RES = typeof r
type typePostLendingList = typeof _typePostLendingList

const postDatabaseURL = firebaseURL.root + "/postDatabase";


export default function LendForm() {
  // 撮られた画像
  const [image, setImage] = useState<string | null | undefined>(null)
  // ISBN
  const [isbn, setIsbn] = useState<string>('')
  // カメラが起動しているかどうか
  const [isCamOn, setIsCamOn] = useState<boolean>(false)
  // OCRの進行状況。プログレスバーで使う。
  const [ocrProgress, setOcrProgress] = useState<{status: string, progress: number}>({status: 'recognizing text', progress: 1})
  // OCR で取得した文字列
  const [ocr, setOcr] = useState<string>('')
  // カメラで用いる ref
  const webcamRef = useRef<Webcam>(null);
  // 入力されたisbnの本が存在するかどうか
  const [isBookExist, setIsBookExist] = useState<boolean>(false)
  // Google Books API で取得した書籍のタイトル
  const [title, setTitle] = useState<string>('')
  // Google Books API で取得した書籍の著者
  const [authors, setAuthors] = useState<string[]>([''])
  // sendRequestToPostDatabase関数のエラーを収納するuseState
  const [errorSendRequestToPostDatabase, setErrorSendRequestToPostDatabase] = useState<string>("")

  const { studentId, setStudentId, isStudentIdValid, studentIdOnChangeHandler } = useContext(StudentIdContext)
  const { isPostingNow, setIsPostingNow } = useContext(IsPostingNowContext)

  // snakbarを管理するuseState
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string}>({open: false, message: ""})

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
    const result = text.match(/(I|1|\[|\])(S|5|s)(B|8|5)N[0-9 -]{9,18}/)
    if(result){
      // ISBN が取得できた場合，結果から数字のみを抽出して isbn に格納
      let resultString = result[0].toString()
      resultString = resultString.slice(4).replaceAll("-", "").replaceAll(" ", "")
      setIsbn(resultString)
    }
  }
  // カメラの起動・停止を切り替える関数
  const toggleCam = () => {
    setIsCamOn(!isCamOn)
  }
  // isbn が更新されたときに呼び出される関数
  // Google Books API にリクエストを送り，書籍のタイトルと著者を取得する。
  useEffect(() =>{
    if ((isbn.length===9) || (isbn.length===10) || (isbn.length===13)){
      const _url = "https://www.googleapis.com/books/v1/volumes?q=isbn:" + isbn;
      axios.get(_url)
        .then((res: AxiosResponse<RES>) => {
          if(res.data.totalItems > 0){
            if(res.data.items[0].volumeInfo.subtitle){
              setTitle(res.data.items[0].volumeInfo.title + " " + res.data.items[0].volumeInfo.subtitle)
            }else{
              setTitle(res.data.items[0].volumeInfo.title)
            }
            if(res.data.items[0].volumeInfo.authors){
              setAuthors(res.data.items[0].volumeInfo.authors)
            }else{
              setAuthors(["著者未定義"])
            }
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

  // axiosでデータベースに貸出情報をjson形式で送る
  const sendRequestToPostDatabase = async () => {
    setIsPostingNow(true)
    const request = await axios.post<typePostLendingList>(postDatabaseURL, {
      bookIsbn: isbn,
      bookAuthors: authors,
      bookTitle: title,
      studentId: studentId,
      isLendingNow: true,
    }).then((response: AxiosResponse) => {
      setIsbn('')
      setStudentId('')
      setIsPostingNow(false)
      setIsBookExist(false)
      setErrorSendRequestToPostDatabase("")
      setSnackbar({open: true, message: `貸出しました：${title}`})
    }).catch((error: AxiosError) => {
      setErrorSendRequestToPostDatabase(error.request.response)
      setIsPostingNow(false)
    })
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
                    maxWidth: "100%",
                    maxHeight: "100%",
                    mx: "auto",
                  }}
                >
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    forceScreenshotSourceSize
                    screenshotFormat="image/jpeg"
                    width="100%"
                    videoConstraints={videoConstraints}
                  />
                </Box>
                <Box sx={{height:5}}/>
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Stack spacing={2} direction="row">
                    <Button onClick={capture} variant="contained"><PhotoCameraIcon sx={{ mr: 1 }} />文字を読み取る</Button>
                    <Button onClick={toggleCam} variant="outlined"><NoPhotographyOutlinedIcon sx={{ mr: 1 }} />カメラをきる</Button>
                  </Stack>
                </Box>
              </>
            ) : (
              <>
                <Box
                  sx={{
                    width: "30em",
                    maxWidth: "100%",
                    maxHeight: "100%",
                    mx: "auto",
                  }}
                >
                  <img src={image} style={{ maxWidth: "100%", maxHeight:"100%" }} />
                </Box>
                <Box sx={{height:5}}/>
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Stack spacing={2} direction="row">
                    <Button onClick={delImage} variant="contained"><PhotoCameraIcon sx={{ mr: 1 }} />リトライ</Button>
                    <Button onClick={toggleCam} variant="outlined"><NoPhotographyOutlinedIcon sx={{ mr: 1 }} />カメラをきる</Button>
                  </Stack>
                </Box>
              </>
            )
          }
          </>
        ) : (
          <>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Button onClick={toggleCam} variant="contained">
              <PhotoCameraIcon sx={{ mr: 1 }} />
              ISBN をカメラで読み取る
            </Button>
          </Box>
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
      { ocr != "" &&
        <Accordion
          sx={{ my: 2, backgroundColor: "#f0f0f0" }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography>読み取られた文字を表示</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              {ocr}
            </Typography>
          </AccordionDetails>
        </Accordion>
      }
      <Box sx={{ height:20}} />
      <Typography variant="h6">借りる方法</Typography>
      <Typography>学籍番号とISBNを入力して借りるボタンを押してください</Typography>
      <Typography>※ ISBNはカメラで読み取ることもできます</Typography>
      <Typography>※ ISBNは半角数字（ハイフンなし）で入力（例 : 9784150110000）</Typography>
      <Typography>※ 学籍番号は半角英数字，小文字で入力（例 : 22s2099x）</Typography>
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
      <Snackbar
        open={snackbar.open}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        autoHideDuration={6000}
        message = {snackbar.message}
        onClose={() => setSnackbar({open: false, message: ""})}
      />

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
  )
}