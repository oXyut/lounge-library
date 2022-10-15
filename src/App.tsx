import './App.css';
import { useRef, useCallback, useState, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import styled from 'styled-components';
import Webcam from 'react-webcam';
import { Box, Button, TextField, Typography } from '@mui/material';
import { setCommentRange } from 'typescript';
import axios, { AxiosResponse } from "axios";
import r from "../lib/googleApi.json"

type RES = typeof r

function App() {
  const [image, setImage] = useState<string | null | undefined>(null)
  const [ocr, setOcr] = useState<string>('')
  const [isbn, setIsbn] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [authors, setAuthors] = useState<string[]>([''])
  const [studentNo, setStudentNo] = useState<string>('')
  const [isCamOn, setIsCamOn] = useState<boolean>(false)
  
  const webcamRef = useRef<Webcam>(null);

  const videoConstraints = {
    width: 1920,
    height: 1080,
    facingMode: "environment"
  };


  const capture = useCallback(
    () => {
      const imageSrc = webcamRef.current?.getScreenshot();
      if( imageSrc != null){
        setImage(imageSrc)
        doOCR(imageSrc)
      }
    },
    [webcamRef]
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
                }}
              >
                <img src={image} width="100%" height="auto" />
              </Box>
              <Button onClick={toggleCam} variant="contained">カメラをきる</Button>
              <Button onClick={delImage} variant="contained">リトライ</Button>
            </>
          )
        }
        </>
      ) : (
        <>
          <Box
            sx={{
              // width: imageDisplaySize.width,
              // height: imageDisplaySize.height,
              bgcolor: "black"
            }}
          >
            <Button onClick={toggleCam} variant="contained">ISBN をカメラで読み取る</Button>
          </Box>
        </>
      )
    }
    <p>{ocr}</p>

    <TextField
      value={isbn}
      label="ISBN"
      onChange={isbnOnChangeHandler}
    ></TextField>
    <TextField
      value={studentNo}
      label="学籍番号"
    ></TextField>
    <Button variant="contained">
      借りる
    </Button>
    <Typography>
      {
        title != "" &&
        authors.join(", ") + "「" + title + "」"
      }
    </Typography>
    </>
  );
}

export default App;
