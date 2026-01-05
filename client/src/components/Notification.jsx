import { useEffect, useState } from 'react'

function Notification({ message, type = 'info' }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    setShow(true)
    const timer = setTimeout(() => setShow(false), 3000)
    return () => clearTimeout(timer)
  }, [message])

  const getBackgroundColor = () => {
    switch (type) {
      case 'error':
        return '#e74c3c'
      case 'success':
        return '#27ae60'
      default:
        return '#3498db'
    }
  }

  return (
    <div
      className={`notification ${show ? 'show' : ''}`}
      style={{ backgroundColor: getBackgroundColor() }}
    >
      {message}
    </div>
  )
}

export default Notification
