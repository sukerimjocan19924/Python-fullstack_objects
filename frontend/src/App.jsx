import { useState } from 'react'
import './App.css'

function App() {

  const [message, setMessage] = useState("Test message")
  const [file, setFile] = useState(null)
  const [previewImage, setPreviewImage] = useState("")
  const [resultImage, setResultImage] = useState("")
  const [resultMessage, setResultMessage] = useState("")

  const [loading, setLoading] = useState(false)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]

    if (!selectedFile) {
      return
    }

    setFile(selectedFile)
    setPreviewImage(URL.createObjectURL(selectedFile))

    setResultImage("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!file) {
      alert("이미지를 선택해 주세요")
      return
    }
    const formData = new FormData()
    formData.append("message", message)
    formData.append("file", file)

    try {
      setLoading(true)

      const response = await fetch("http://localhost:8000/detect", {
        method: "POST",
        body: formData
      })

      const data = await response.json()
      setResultMessage(data.message)
      setResultImage(`data:image/jpeg;base64, ${data.image}`)
    } catch (error) {
      console.error(error)
      alert('객체 탐지중 오류가 발생했습니다.')
    }finally{
      setLoading(false)
    }
  }

  return (
    <main className='container'>
      <h1>YOLOv8 객체 탐지 실습</h1>
      <form className='upload-form' onSubmit={handleSubmit}>
        <label>
          메시지:
          <input 
            type="text" 
            value={message}
            onChange={(e)=>setMessage(e.target.value)} />
        </label>
        <label >
          이미지 업로드
          <input 
            type="file" 
            onChange={handleFileChange}
            accept='image/*' />
        </label>
        <button type='submit' disabled={loading}>
          {loading ? "탐지 중..." : "객체 탐지 실행"}
        </button>
      </form>
      <section className='image-area'>
        {previewImage &&(
          <div>
          <h2>업로드 이미지</h2>
          <img src={previewImage} alt="업로드이미지" />
        </div>
        )}

        {resultImage &&(
          <div>
          <h2>업로드 이미지</h2>
          <p>message</p>
          <img src={resultImage} alt="탐지결과이미지" />
        </div>
        )}
      </section>
    </main>
  )
}

export default App
