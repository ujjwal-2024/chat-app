import React, { useContext, useEffect, useState } from 'react'
import './Chat.css'
import LeftSidebar from '../../components/LeftSidebar/LeftSidebar'
import ChatBox from '../../components/ChatBox/ChatBox'
import RightSidebar from '../../components/RightSidebar/RightSidebar'
import { AppContext } from '../../context/AppContext'

const Chat = () => {

  const { chatData, userData, darkMode, setDarkMode } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    if (chatData && userData) setLoading(false);
  }, [chatData, userData])

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // On tablet (<=1024px) hide right sidebar via grid
  const gridColumns = windowWidth > 1024
    ? '280px 1fr 220px'
    : windowWidth > 768
      ? '260px 1fr'
      : '1fr';

  return (
    <div className={`chat ${darkMode ? 'dark' : 'light'}`}>
      <button className="chat-theme-toggle" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? '☀️' : '🌙'}
      </button>
      {loading
        ? <p className='loading'>Loading...</p>
        : <div className="chat-container" style={{ gridTemplateColumns: gridColumns }}>
            <LeftSidebar />
            <ChatBox />
            {windowWidth > 1024 && <RightSidebar />}
          </div>
      }
    </div>
  )
}

export default Chat