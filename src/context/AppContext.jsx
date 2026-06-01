import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { createContext, useEffect, useRef, useState } from "react";
import { auth, db } from "../config/firebase";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext()

const AppContextProvider = (props) => {

    const [userData, setUserData] = useState(null);
    const [chatData, setChatData] = useState(null);
    const [messagesId, setMessagesId] = useState(null);
    const [messages, setMessages] = useState([])
    const [chatUser, setChatUser] = useState(null);
    const [chatVisible, setChatVisible] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('chatapp-theme') === 'dark';
    });
    const prevMessagesLength = useRef(0);
    const navigate = useNavigate();

    // Save theme to localStorage
    useEffect(() => {
        localStorage.setItem('chatapp-theme', darkMode ? 'dark' : 'light');
        document.body.className = darkMode ? 'dark-theme' : 'light-theme';
    }, [darkMode]);

    // Play notification sound when new message arrives from other user
    useEffect(() => {
        if (messages.length > prevMessagesLength.current) {
            const latestMsg = messages[0]; // messages are reversed
            if (latestMsg && latestMsg.sId !== userData?.id) {
                const isMuted = userData?.mutedUsers?.includes(latestMsg.sId);
                if (isMuted) return;
                playNotificationSound();
            }
        }
        prevMessagesLength.current = messages.length;
    }, [messages]);

    const playNotificationSound = () => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create a pleasant "pop" notification sound
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
            
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.3);
        } catch (e) {
            console.log("Audio not supported");
        }
    }

    const loadUserData = async (uid) => {
        try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) {
                toast.error("User data not found");
                return;
            }
            const userData = userSnap.data();
            setUserData(userData);
            if (userData.avatar && userData.name) {
                navigate('/chat');
            } else {
                navigate('/profile')
            }
            await updateDoc(userRef, { lastSeen: Date.now() })
            setInterval(async () => {
                if (auth.currentUser) {
                    await updateDoc(userRef, { lastSeen: Date.now() })
                }
            }, 60000);
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(() => {
        if (chatUser && userData) {
            const userRef = doc(db, 'users', chatUser.rId);
            const unSub = onSnapshot(userRef, (snap) => {
                if (snap.exists()) {
                    const data = snap.data();
                    setIsTyping(data.typingTo === userData.id);
                }
            });
            return () => unSub();
        }
    }, [chatUser, userData]);

    useEffect(() => {
        if (userData) {
            const chatRef = doc(db, 'chats', userData.id)
            const unSub = onSnapshot(chatRef, async (res) => {
                const chatItems = res.data().chatsData;
                const tempData = [];
                for (const item of chatItems) {
                    const userRef = doc(db, "users", item.rId);
                    const userSnap = await getDoc(userRef);
                    const userData = userSnap.data();
                    tempData.push({ ...item, userData });
                }
                setChatData(tempData.sort((a, b) => b.updatedAt - a.updatedAt));
            })
            return () => unSub();
        }
    }, [userData])

    useEffect(() => {
        if (userData) {
            setInterval(async () => {
                const chatRef = doc(db, 'chats', userData.id)
                const data = await getDoc(chatRef)
                const chatItems = data.data().chatsData;
                const tempData = [];
                for (const item of chatItems) {
                    const userRef = doc(db, "users", item.rId);
                    const userSnap = await getDoc(userRef);
                    const userData = userSnap.data();
                    tempData.push({ ...item, userData });
                }
                setChatData(tempData.sort((a, b) => b.updatedAt - a.updatedAt));
            }, 10000);
        }
    }, [userData])

    const value = {
        userData, setUserData,
        loadUserData,
        chatData,
        messagesId, setMessagesId,
        chatUser, setChatUser,
        chatVisible, setChatVisible,
        messages, setMessages,
        isTyping,
        darkMode, setDarkMode
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}

export default AppContextProvider;