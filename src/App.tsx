import './App.css';
import { useRef, useCallback, useState, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import styled from 'styled-components';
import { Camera, CameraType } from 'react-camera-pro';
import { Box, Button, TextField, Typography } from '@mui/material';
import {Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from '@mui/material';
import { setCommentRange } from 'typescript';
import axios, { AxiosResponse } from "axios";
import r from "../lib/googleApi.json"


type RES = typeof r

const getDatabaseURL = "https://asia-northeast1-lounge-library.cloudfunctions.net/getDatabase";
const postDatabaseURL = "https://asia-northeast1-lounge-library.cloudfunctions.net/postDatabase";

const Wrapper = styled.div`
  position: absolute;
  width: 100%;
  height: 20rem;
  border: dashed;
`;

function App() {
  const [image, setImage] = useState<string | null | undefined>(null)
  const [ocr, setOcr] = useState<string>('')
  const [isbn, setIsbn] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [authors, setAuthors] = useState<string[]>([''])
  const [studentId, setStudentId] = useState<string>('')
  const [isCamOn, setIsCamOn] = useState<boolean>(false)

  // Axios Response Type
  const [lendingList, setlendingList] = useState<any>()
  const [isBookExist, setIsBookExist] = useState<boolean>(false) // 入力されたisbnの本が存在するかどうか

  const camera = useRef<CameraType>(null);
  const capture = useCallback(
    () => {
      const imageSrc = camera.current?.takePhoto();
      if( imageSrc != null){
        setImage(imageSrc)
        doOCR(imageSrc)
      }
    },
    [camera]
  )
  const delImage = () =>{
    setImage(null)
  }

  const worker = createWorker({
    logger: m => console.log(m),
  })
  const doOCR = async (img: string) => {
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(img);
    setOcr(text);

    const result = text.match(/(I|1)(S|5|s)(B|8|5)N[0-9 -]{9,18}/)
    if(result){
      let resultString = result[0].toString()
      console.log(resultString)
      resultString = resultString.slice(4).replaceAll("-", "").replaceAll(" ", "")
      setIsbn(resultString)
    }
  }

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

  useEffect(() =>{
      // console.log(isbn)
      // console.log(isbn.length)
      // console.log((isbn.length===9) || (isbn.length===10) || (isbn.length===13))
      if ((isbn.length===9) || (isbn.length===10) || (isbn.length===13)){ 
      const url = "https://www.googleapis.com/books/v1/volumes?q=isbn:" + isbn;
      axios.get(url)
        .then((res: AxiosResponse<RES>) => {
        // .then((res: any) => {
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
      isCamOn &&
      <>
      {
        image == null &&
        <>
          <Wrapper>
            <Camera
                ref={camera}
                facingMode="environment"
                errorMessages={{
                  noCameraAccessible: 'No camera device accessible. Please connect your camera or try a different browser.',
                  permissionDenied: 'Permission denied. Please refresh and give camera permission.',
                  switchCamera:
                    'It is not possible to switch camera to different one because there is only one video device accessible.',
                  canvas: 'Canvas is not supported.',
                }}
              />
            </Wrapper>
            <Box sx={{height: "20rem"}}/>
        <Button onClick={toggleCam} variant="contained">カメラをきる</Button>
        <Button onClick={capture} variant="contained">文字を読み取る</Button>
        </>
      }
      {
        image != null &&
        <>
        <img src={image} width={ "100%" }/>
        <Button onClick={toggleCam} variant="contained">カメラをきる</Button>
        <Button onClick={delImage} variant="contained">リトライ</Button>
        </>
      }
      </>
    }
    {
      !isCamOn &&
      <>
      <Wrapper>
        <Button onClick={toggleCam} variant="contained">ISBN をカメラで読み取る</Button>
      </Wrapper>
      <Box sx={{height: "20rem"}}/>
      </>
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
