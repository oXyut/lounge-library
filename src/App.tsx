import './App.css';
import Webcam from 'react-webcam';
import { useRef, useCallback, useState, useEffect } from 'react';
import { createWorker } from 'tesseract.js';

const videoConstraints = {
  facingMode: 'environment',
  width: 300,
  height: 300
};
const w = 300, h = 300;

function App() {
  const [image, setImage] = useState<string | null | undefined>(null)
  const [ocr, setOcr] = useState('予測中')
  const webcamRef = useRef<Webcam>(null)
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
  }

  return (
    <>
    
    {
      image == null &&
      <>
      <Webcam
        audio={false}
        ref={webcamRef}
        videoConstraints={videoConstraints}
        width={w}
        height={h}
      />
      <button onClick={capture}>文字を読み取る</button>
      </>
    }
    {
      image != null &&
      <>
      <img src={image} />
      <button onClick={delImage}>リトライ</button>
      </>
    }

    <p>{ocr}</p>
    </>
  );
}

export default App;
