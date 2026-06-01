import React, { useContext, useEffect, useState } from 'react'
import './LeftSidebar.css'
import assets from '../../assets/assets'
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import { db, logout } from '../../config/firebase';
import { arrayUnion, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const LeftSidebar = () => {

    const { chatData, userData, chatUser, setChatUser, setMessagesId, messagesId, chatVisible, setChatVisible } = useContext(AppContext);
    const [user, setUser] = useState(null);
    const [showSearch, setShowSearch] = useState(false)
    const navigate = useNavigate();

    const inputHandler = async (e) => {
        try {
            const input = e.target.value;
            if (input) {
                setShowSearch(true);
                const userRef = collection(db, "users");

                // #11 Search by username OR name
                const qUsername = query(userRef, where("username", "==", input.toLowerCase()));
                const qName = query(userRef, where("name", "==", input));

                const [snapUsername, snapName] = await Promise.all([getDocs(qUsername), getDocs(qName)]);

                // Pick first result from either query
                let foundDoc = null;
                if (!snapUsername.empty) foundDoc = snapUsername.docs[0];
                else if (!snapName.empty) foundDoc = snapName.docs[0];

                if (foundDoc && foundDoc.data().id !== userData.id) {
                    let userExist = false;
                    chatData.map((u) => {
                        if (u.rId === foundDoc.data().id) userExist = true;
                    })
                    if (!userExist) setUser(foundDoc.data());
                    else setUser(null);
                } else {
                    setUser(null);
                }
            } else {
                setShowSearch(false);
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const addChat = async () => {
        const messagesRef = collection(db, "messages");
        const chatsRef = collection(db, "chats");
        try {
            if (user.id === userData.id) return 0;
            const newMessageRef = doc(messagesRef);
            await setDoc(newMessageRef, { createAt: serverTimestamp(), messages: [] });
            await updateDoc(doc(chatsRef, user.id), {
                chatsData: arrayUnion({ messageId: newMessageRef.id, lastMessage: "", rId: userData.id, updatedAt: Date.now(), messageSeen: true }),
            });
            await updateDoc(doc(chatsRef, userData.id), {
                chatsData: arrayUnion({ messageId: newMessageRef.id, lastMessage: "", rId: user.id, updatedAt: Date.now(), messageSeen: true }),
            });
            const uSnap = await getDoc(doc(db, "users", user.id));
            const uData = uSnap.data();
            setChat({ messageId: newMessageRef.id, lastMessage: "", rId: user.id, updatedAt: Date.now(), messageSeen: true, userData: uData });
            setShowSearch(false);
            setChatVisible(true);
        } catch (error) {
            toast.error(error.message)
        }
    }

    const setChat = async (item) => {
        setMessagesId(item.messageId);
        setChatUser(item);
        const userChatsRef = doc(db, "chats", userData.id);
        const userChatsSnapshot = await getDoc(userChatsRef);
        const userChatsData = userChatsSnapshot.data();
        const chatIndex = userChatsData.chatsData.findIndex((c) => c.messageId === item.messageId);
        userChatsData.chatsData[chatIndex].messageSeen = true;
        await updateDoc(userChatsRef, { chatsData: userChatsData.chatsData });
        setChatVisible(true);
    }

    useEffect(() => {
        const updateChatUserData = async () => {
            if (chatUser) {
                const userRef = doc(db, "users", chatUser.userData.id);
                const userSnap = await getDoc(userRef);
                const userData = userSnap.data();
                setChatUser(prev => ({ ...prev, userData: userData }))
            }
        }
        updateChatUserData();
    }, [chatData])

    return (
        <div className={`ls ${chatVisible ? "hidden" : ""}`}>
            <div className='ls-top'>
                <div className='ls-nav'>
                    <img className='logo' src={assets.logo} alt="" />
                    <div className='menu'>
                        <img src={assets.menu_icon} alt="" />
                        <div className='sub-menu'>
                            <p onClick={() => navigate('/profile')}>Edit Profile</p>
                            <hr />
                            <p onClick={() => logout()}>Logout</p>
                        </div>
                    </div>
                </div>
                <div className="ls-search">
                    <img src={assets.search_icon} alt="" />
                    <input onChange={inputHandler} type="text" placeholder='Search by name or username..' />
                </div>
            </div>
            <div className="ls-list">
                {showSearch && user
                    ? <div onClick={addChat} className='friends add-user'>
                        <img src={user.avatar} alt="" />
                        <p>{user.name}</p>
                    </div>
                    : chatData.map((item, index) => (
                        <div onClick={() => setChat(item)} key={index} className={`friends ${item.messageSeen || item.messageId === messagesId ? "" : "border"}`}>
                            <img src={item.userData.avatar} alt="" />
                            <div>
                                <p>{item.userData.name}</p>
                                <span>{item.lastMessage.slice(0, 30)}</span>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    )
}

export default LeftSidebar