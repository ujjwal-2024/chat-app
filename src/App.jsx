import React, { useContext, useEffect } from 'react'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login/Login';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './config/firebase';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Chat from './pages/Chat/Chat';
import ProfileUpdate from './pages/ProfileUpdate/ProfileUpdate';
import { AppContext } from './context/AppContext';

const App = () => {

  const navigate = useNavigate();
  const { loadUserData, setChatUser, setMessagesId, setChatVisible, chatVisible } = useContext(AppContext);

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        loadUserData(user.uid);
      } else {
        setChatUser(null);
        setMessagesId(null);
        navigate('/');
      }
    })
  }, [])

  // Handle hardware back button on mobile
  useEffect(() => {
    const handlePopState = () => {
      if (chatVisible) {
        setChatVisible(false);
        // Push a new state so back button doesn't exit the app
        window.history.pushState(null, '', window.location.href);
      }
    };

    // Push initial state
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => window.removeEventListener('popstate', handlePopState);
  }, [chatVisible]);

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path='/chat' element={<Chat />} />
        <Route path='/' element={<Login />} />
        <Route path='/profile' element={<ProfileUpdate />} />
      </Routes>
    </>
  )
}

export default App