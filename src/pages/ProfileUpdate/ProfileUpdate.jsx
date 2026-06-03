import React, { useContext, useEffect, useState } from 'react'
import './ProfileUpdate.css'
import assets from '../../assets/assets'
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, deleteUser, signOut } from 'firebase/auth';
import upload from '../../lib/upload';
import { toast } from 'react-toastify';
import { AppContext } from '../../context/AppContext';

const ProfileUpdate = () => {

  const [image, setImage] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [uid, setUid] = useState("");
  const navigate = useNavigate();
  const [prevImage, setPrevImage] = useState("");
  const { setUserData, darkMode, setDarkMode } = useContext(AppContext);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleteType, setDeleteType] = useState(null); // 'temp' or 'permanent'

  const profileUpdate = async (event) => {
    event.preventDefault();
    try {
      if (!prevImage && !image) { toast.error("Upload profile picture"); return 0; }
      const docRef = doc(db, "users", uid);
      if (image) {
        const imgUrl = await upload(image);
        setPrevImage(imgUrl);
        await updateDoc(docRef, { avatar: imgUrl, bio: bio, name: name })
      } else {
        await updateDoc(docRef, { bio: bio, name: name })
      }
      const snap = await getDoc(docRef);
      setUserData(snap.data());
      navigate('/chat')
    } catch (error) {
      console.error(error);
      toast.error(error.message)
    }
  }

  // Temporary deactivation — marks account as deactivated in Firestore
  const deactivateAccount = async () => {
    try {
      const docRef = doc(db, "users", uid);
      await updateDoc(docRef, {
        deactivated: true,
        deactivatedAt: Date.now()
      });
      await signOut(auth);
      toast.success("Account deactivated. Login anytime to reactivate.");
      navigate('/');
    } catch (error) {
      toast.error(error.message);
    }
  }

  // Permanent deletion — removes Firestore data and Firebase Auth user
  const deleteAccount = async () => {
    try {
      if (confirmText !== "DELETE") {
        toast.error('Type "DELETE" to confirm');
        return;
      }
      const user = auth.currentUser;

      // Delete Firestore user data
      await deleteDoc(doc(db, "users", uid));

      // Delete Firebase Auth account
      await deleteUser(user);

      toast.success("Account permanently deleted.");
      navigate('/');
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        toast.error("Please log out and log back in before deleting your account.");
      } else {
        toast.error(error.message);
      }
    }
  }

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.data().name) setName(docSnap.data().name);
        if (docSnap.data().bio) setBio(docSnap.data().bio);
        if (docSnap.data().avatar) setPrevImage(docSnap.data().avatar);
      } else {
        navigate("/")
      }
    })
  }, [])

  return (
    <div className={`profile ${darkMode ? 'dark' : 'light'}`}>
      <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? '☀️ Light' : '🌙 Dark'}
      </button>

      <div className="profile-container">
        <form onSubmit={profileUpdate} autoComplete="off">
          <h3>Profile details</h3>
          <label htmlFor='avatar'>
            <input onChange={(e) => setImage(e.target.files[0])} id='avatar' type="file" accept=".png, .jpg, .jpeg" hidden />
            <img src={image ? URL.createObjectURL(image) : assets.avatar_icon} alt="" />
            upload profile image
          </label>
          <input onChange={(e) => setName(e.target.value)} value={name} placeholder='Your name' type="text" autoComplete="off" required />
          <textarea onChange={(e) => setBio(e.target.value)} value={bio} placeholder='Write profile bio' required />
          <button type="submit">Save</button>

          {/* Account management */}
          <div className="account-danger-zone">
            <p className="danger-title">⚠️ Account Settings</p>
            <button type="button" className="deactivate-btn" onClick={() => { setDeleteType('temp'); setShowDeleteMenu(true); }}>
              😴 Deactivate Account
            </button>
            <button type="button" className="delete-btn" onClick={() => { setDeleteType('permanent'); setShowDeleteMenu(true); }}>
              🗑️ Delete Account Permanently
            </button>
          </div>
        </form>

        <img className='profile-pic' src={image ? URL.createObjectURL(image) : prevImage ? prevImage : assets.logo_icon} alt="" />
      </div>

      {/* Confirmation Modal */}
      {showDeleteMenu && (
        <div className="delete-overlay">
          <div className="delete-modal">
            {deleteType === 'temp' ? (
              <>
                <p className="delete-modal-title">😴 Deactivate Account?</p>
                <p className="delete-modal-desc">Your account will be hidden. You can reactivate anytime by logging back in.</p>
                <div className="delete-modal-actions">
                  <button className="modal-cancel" onClick={() => setShowDeleteMenu(false)}>Cancel</button>
                  <button className="modal-confirm deactivate" onClick={deactivateAccount}>Deactivate</button>
                </div>
              </>
            ) : (
              <>
                <p className="delete-modal-title">🗑️ Delete Account?</p>
                <p className="delete-modal-desc">This is <strong>permanent</strong>. All your data will be deleted and cannot be recovered.</p>
                <input
                  className="delete-confirm-input"
                  placeholder='Type "DELETE" to confirm'
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                />
                <div className="delete-modal-actions">
                  <button className="modal-cancel" onClick={() => { setShowDeleteMenu(false); setConfirmText(""); }}>Cancel</button>
                  <button className="modal-confirm delete" onClick={deleteAccount}>Delete Forever</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileUpdate