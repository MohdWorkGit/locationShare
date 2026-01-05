import { useState, useRef } from 'react'

function PhotoUpload({ selectedPhoto, onPhotoSelect }) {
  const [preview, setPreview] = useState(selectedPhoto)
  const fileInputRef = useRef(null)

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB')
        return
      }

      // Read file and convert to base64
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result
        setPreview(base64String)
        onPhotoSelect(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemovePhoto = () => {
    setPreview(null)
    onPhotoSelect(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="photo-upload">
      <div className="photo-preview">
        {preview ? (
          <div className="preview-container">
            <img src={preview} alt="Profile" className="preview-image" />
            <button
              type="button"
              className="remove-photo-btn"
              onClick={handleRemovePhoto}
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="upload-placeholder" onClick={() => fileInputRef.current?.click()}>
            <span className="upload-icon">📷</span>
            <span className="upload-text">Upload Photo</span>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      {!preview && (
        <button
          type="button"
          className="btn-upload"
          onClick={() => fileInputRef.current?.click()}
        >
          Choose Photo
        </button>
      )}
    </div>
  )
}

export default PhotoUpload
