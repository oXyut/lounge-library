import './App.css';
import { useRef, useCallback, useState, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import styled from 'styled-components';
import { Camera, CameraType } from 'react-camera-pro';

const videoConstraints = {
  facingMode: 'environment',
  width: 300,
  height: 300
};
const w = 300, h = 300;

const Gomi = styled.div`
  height: 20rem;
  display:block;
`;
const Wrapper = styled.div`
  position: absolute;
  width: 100%;
  height: 20rem;
  z-index: -10;
`;

function App() {
  const [image, setImage] = useState<string | null | undefined>(null)
  const [ocr, setOcr] = useState('予測中')
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
  }

  return (
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
      <Gomi>
      </Gomi>
      <button onClick={capture}>文字を読み取る</button>
      </>
    }
    {
      image != null &&
      <>
      <img src={image} width={ "100%" }/>
      <button onClick={delImage}>リトライ</button>
      </>
    }

    <p>{ocr}</p>
    </>
  );
}

export default App;
