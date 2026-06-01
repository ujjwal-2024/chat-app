import React, { useContext, useEffect, useState } from 'react'
import './Chat.css'
import LeftSidebar from '../../components/LeftSidebar/LeftSidebar'
import ChatBox from '../../components/ChatBox/ChatBox'
import RightSidebar from '../../components/RightSidebar/RightSidebar'
import { AppContext } from '../../context/AppContext'

const Chat = () => {

  const { chatData, userData, darkMode, setDarkMode } = useContext(AppContext);
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (chatData && userData) {
      setLoading(false);
    }
  }, [chatData, userData])

  return (
    <div className={`chat ${darkMode ? 'dark' : 'light'}`}>
      <button className="chat-theme-toggle" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? '☀️' : '🌙'}
      </button>
      {loading
        ? <p className='loading'>Loading...</p>
        : <div className="chat-container">
            <LeftSidebar />
            <ChatBox />
            <RightSidebar />
          </div>
      }
    </div>
  )
}

export default Chat