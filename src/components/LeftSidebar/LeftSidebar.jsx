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
    const [showSearch, setShowSearch] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [showFindPeople, setShowFindPeople] = useState(false);
    const navigate = useNavigate();

    // Load all users for Find People
    useEffect(() => {
        const loadAllUsers = async () => {
            if (!userData) return;
            const usersRef = collection(db, "users");
            const snap = await getDocs(usersRef);
            const users = snap.docs
                .map(d => d.data())
                .filter(u => u.id !== userData.id); // exclude self
            setAllUsers(users);
        };
        loadAllUsers();
    }, [userData]);

    // Users not already in chat list
    const newUsers = allUsers.filter(u =>
        !chatData?.some(c => c.rId === u.id)
    );

    const inputHandler = async (e) => {
        try {
            const input = e.target.value;
            if (input) {
                setShowSearch(true);
                const userRef = collection(db, "users");
                const qUsername = query(userRef, where("username", "==", input.toLowerCase()));
                const qName = query(userRef, where("name", "==", input));
                const [snapUsername, snapName] = await Promise.all([getDocs(qUsername), getDocs(qName)]);
                let foundDoc = null;
                if (!snapUsername.empty) foundDoc = snapUsername.docs[0];
                else if (!snapName.empty) foundDoc = snapName.docs[0];
                if (foundDoc && foundDoc.data().id !== userData.id) {
                    let userExist = false;
                    chatData.map((u) => { if (u.rId === foundDoc.data().id) userExist = true; })
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

    const addChat = async (targetUser) => {
        const u = targetUser || user;
        const messagesRef = collection(db, "messages");
        const chatsRef = collection(db, "chats");
        try {
            if (u.id === userData.id) return 0;
            const newMessageRef = doc(messagesRef);
            await setDoc(newMessageRef, { createAt: serverTimestamp(), messages: [] });
            await updateDoc(doc(chatsRef, u.id), {
                chatsData: arrayUnion({ messageId: newMessageRef.id, lastMessage: "", rId: userData.id, updatedAt: Date.now(), messageSeen: true }),
            });
            await updateDoc(doc(chatsRef, userData.id), {
                chatsData: arrayUnion({ messageId: newMessageRef.id, lastMessage: "", rId: u.id, updatedAt: Date.now(), messageSeen: true }),
            });
            const uSnap = await getDoc(doc(db, "users", u.id));
            const uData = uSnap.data();
            setChat({ messageId: newMessageRef.id, lastMessage: "", rId: u.id, updatedAt: Date.now(), messageSeen: true, userData: uData });
            setShowSearch(false);
            setShowFindPeople(false);
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
                    ? <div onClick={() => addChat()} className='friends add-user'>
                        <img src={user.avatar} alt="" />
                        <p>{user.name}</p>
                    </div>
                    : <>
                        {/* Existing chats */}
                        {chatData && chatData.map((item, index) => (
                            <div onClick={() => setChat(item)} key={index} className={`friends ${item.messageSeen || item.messageId === messagesId ? "" : "border"}`}>
                                <img src={item.userData.avatar} alt="" />
                                <div>
                                    <p>{item.userData.name}</p>
                                    <span>{item.lastMessage.slice(0, 30)}</span>
                                </div>
                            </div>
                        ))}

                        {/* Find People section */}
                        {newUsers.length > 0 && (
                            <div className="find-people-section">
                                <button
                                    className="find-people-toggle"
                                    onClick={() => setShowFindPeople(!showFindPeople)}
                                >
                                    <span>👥 Find People ({newUsers.length})</span>
                                    <span>{showFindPeople ? '▲' : '▼'}</span>
                                </button>

                                {showFindPeople && (
                                    <div className="find-people-list">
                                        {newUsers.map((u, i) => (
                                            <div key={i} className="find-person">
                                                <img src={u.avatar || 'https://i.pravatar.cc/150'} alt="" />
                                                <div className="find-person-info">
                                                    <p>{u.name || u.username}</p>
                                                    <span>@{u.username}</span>
                                                </div>
                                                <button onClick={() => addChat(u)} className="add-btn">+ Chat</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Empty state for new users */}
                        {(!chatData || chatData.length === 0) && newUsers.length === 0 && (
                            <div className="empty-state">
                                <p>No users found</p>
                            </div>
                        )}
                    </>
                }
            </div>
        </div>
    )
}

export default LeftSidebar