import React, { useContext, useState } from 'react'
import './Login.css'
import { signup, login, resetPass } from '../../config/firebase';
import { AppContext } from '../../context/AppContext';

const Login = () => {

  const [currState, setCurrState] = useState("Sign up");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { darkMode, setDarkMode } = useContext(AppContext);

  const onSubmitHandler = (event) => {
    event.preventDefault();
    if (currState === "Sign up") {
      signup(userName, email, password);
    } else {
      login(email, password);
    }
  }

  return (
    <div className={`login ${darkMode ? 'dark' : 'light'}`}>
      <div className="orb orb1"></div>
      <div className="orb orb2"></div>
      <div className="orb orb3"></div>

      <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? '☀️ Light' : '🌙 Dark'}
      </button>

      <div className="glass-card">
        <div className="logo-area">
          <div className="logo-icon">💬</div>
          <span className="logo-text">Chatapp</span>
        </div>

        <div className="tab-row">
          <button type="button" className={`tab ${currState === 'Login' ? 'active' : ''}`} onClick={() => setCurrState('Login')}>Login</button>
          <button type="button" className={`tab ${currState === 'Sign up' ? 'active' : ''}`} onClick={() => setCurrState('Sign up')}>Sign up</button>
        </div>

        <h2 className="form-heading">{currState === 'Sign up' ? 'Create account' : 'Welcome back'}</h2>
        <p className="form-sub">{currState === 'Sign up' ? 'Join and start chatting today' : 'Sign in to continue chatting'}</p>

        <form onSubmit={onSubmitHandler} autoComplete={currState === "Login" ? "on" : "off"}>
          {currState === "Sign up" &&
            <div className="form-group">
              <label className="form-label">Username</label>
              <input onChange={(e) => setUserName(e.target.value)} value={userName} className='form-input' type="text" placeholder='your username' autoComplete="username" required />
            </div>
          }
          <div className="form-group">
            <label className="form-label">Email</label>
            <input onChange={(e) => setEmail(e.target.value)} value={email} className='form-input' type="email" placeholder='hello@example.com' autoComplete={currState === "Login" ? "email" : "off"} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input onChange={(e) => setPassword(e.target.value)} value={password} className='form-input' type="password" placeholder='••••••••' autoComplete={currState === "Login" ? "current-password" : "new-password"} required />
          </div>

          <div className="login-term">
            <input type="checkbox" required />
            <p>Agree to the terms of use & privacy policy.</p>
          </div>

          <button type='submit' className="submit-btn">
            {currState === "Sign up" ? "Create account" : "Login"}
          </button>

          <div className="login-forgot">
            {currState === "Sign up"
              ? <p className='login-toggle'>Already have an account? <span onClick={() => setCurrState("Login")}>Login here</span></p>
              : <p className='login-toggle'>Create an account <span onClick={() => setCurrState("Sign up")}>Click here</span></p>
            }
            {currState === "Login" &&
              <p className='login-toggle'>Forgot password? <span onClick={() => resetPass(email)}>Click here</span></p>
            }
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login