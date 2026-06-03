import React, { useContext, useEffect, useState } from 'react'
import './LeftSidebar.css'
import assets from '../../assets/assets'
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import { db, logout } from '../../config/firebase';
import { arrayUnion, collection, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where, arrayRemove } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const LeftSidebar = () => {

    const { chatData, userData, chatUser, setChatUser, setMessagesId, messagesId, chatVisible, setChatVisible } = useContext(AppContext);
    const [user, setUser] = useState(null);
    const [showSearch, setShowSearch] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [showFindPeople, setShowFindPeople] = useState(false);
    const [requests, setRequests] = useState([]);
    const [showRequests, setShowRequests] = useState(false);
    const navigate = useNavigate();

    // Listen to incoming chat requests
    useEffect(() => {
        if (!userData) return;
        const userRef = doc(db, "users", userData.id);
        const unSub = onSnapshot(userRef, async (snap) => {
            const data = snap.data();
            const incoming = data?.chatRequests || [];
            // Fetch sender details for each request
            const detailed = await Promise.all(incoming.map(async (req) => {
                const senderSnap = await getDoc(doc(db, "users", req.from));
                return { ...req, senderData: senderSnap.data() };
            }));
            setRequests(detailed);
        });
        return () => unSub();
    }, [userData]);

    // Load all users for Find People
    useEffect(() => {
        const loadAllUsers = async () => {
            if (!userData) return;
            const usersRef = collection(db, "users");
            const snap = await getDocs(usersRef);
            const users = snap.docs.map(d => d.data()).filter(u => u.id !== userData.id);
            setAllUsers(users);
        };
        loadAllUsers();
    }, [userData]);

    const newUsers = allUsers.filter(u => !chatData?.some(c => c.rId === u.id));

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
                    let userExist = chatData?.some(c => c.rId === foundDoc.data().id);
                    if (!userExist) setUser(foundDoc.data());
                    else setUser(null);
                } else {
                    setUser(null);
                }
            } else {
                setShowSearch(false);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    // Send a chat request instead of directly adding
    const sendRequest = async (targetUser) => {
        const u = targetUser || user;
        try {
            if (u.id === userData.id) return;

            // Check if request already sent
            const targetSnap = await getDoc(doc(db, "users", u.id));
            const targetData = targetSnap.data();
            const alreadySent = targetData?.chatRequests?.some(r => r.from === userData.id);
            if (alreadySent) {
                toast.info("Request already sent!");
                return;
            }

            // Add request to target user's chatRequests array
            await updateDoc(doc(db, "users", u.id), {
                chatRequests: arrayUnion({
                    from: userData.id,
                    sentAt: Date.now()
                })
            });

            toast.success(`Request sent to ${u.name}!`);
            setShowSearch(false);
            setShowFindPeople(false);
        } catch (error) {
            toast.error(error.message);
        }
    }

    // Accept request — create actual chat
    const acceptRequest = async (req) => {
        const messagesRef = collection(db, "messages");
        const chatsRef = collection(db, "chats");
        try {
            const newMessageRef = doc(messagesRef);
            await setDoc(newMessageRef, { createAt: serverTimestamp(), messages: [] });

            await updateDoc(doc(chatsRef, req.from), {
                chatsData: arrayUnion({ messageId: newMessageRef.id, lastMessage: "", rId: userData.id, updatedAt: Date.now(), messageSeen: true })
            });
            await updateDoc(doc(chatsRef, userData.id), {
                chatsData: arrayUnion({ messageId: newMessageRef.id, lastMessage: "", rId: req.from, updatedAt: Date.now(), messageSeen: true })
            });

            // Remove request
            await updateDoc(doc(db, "users", userData.id), {
                chatRequests: arrayRemove({ from: req.from, sentAt: req.sentAt })
            });

            toast.success(`You are now connected with ${req.senderData?.name}!`);
        } catch (error) {
            toast.error(error.message);
        }
    }

    // Decline request
    const declineRequest = async (req) => {
        try {
            await updateDoc(doc(db, "users", userData.id), {
                chatRequests: arrayRemove({ from: req.from, sentAt: req.sentAt })
            });
            toast.success("Request declined");
        } catch (error) {
            toast.error(error.message);
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
                setChatUser(prev => ({ ...prev, userData }));
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
                    ? <div className='friends add-user'>
                        <img src={user.avatar || 'https://i.pravatar.cc/150'} alt="" />
                        <div>
                            <p>{user.name}</p>
                            <span>@{user.username}</span>
                        </div>
                        <button onClick={() => sendRequest(user)} className="add-btn">Send Request</button>
                      </div>
                    : <>
                        {/* Incoming Requests */}
                        {requests.length > 0 && (
                            <div className="find-people-section">
                                <button className="find-people-toggle requests-toggle" onClick={() => setShowRequests(!showRequests)}>
                                    <span>📩 Requests ({requests.length})</span>
                                    <span>{showRequests ? '▲' : '▼'}</span>
                                </button>
                                {showRequests && (
                                    <div className="find-people-list">
                                        {requests.map((req, i) => (
                                            <div key={i} className="find-person">
                                                <img src={req.senderData?.avatar || 'https://i.pravatar.cc/150'} alt="" />
                                                <div className="find-person-info">
                                                    <p>{req.senderData?.name}</p>
                                                    <span>@{req.senderData?.username}</span>
                                                </div>
                                                <div className="request-actions">
                                                    <button onClick={() => acceptRequest(req)} className="accept-btn">✓</button>
                                                    <button onClick={() => declineRequest(req)} className="decline-btn">✕</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

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

                        {/* Find People */}
                        {newUsers.length > 0 && (
                            <div className="find-people-section">
                                <button className="find-people-toggle" onClick={() => setShowFindPeople(!showFindPeople)}>
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
                                                <button onClick={() => sendRequest(u)} className="add-btn">+ Request</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                }
            </div>
        </div>
    )
}

export default LeftSidebar