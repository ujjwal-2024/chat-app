import React, { useContext, useEffect, useRef, useState } from 'react'
import './ChatBox.css'
import assets from '../../assets/assets'
import { AppContext } from '../../context/AppContext';
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'react-toastify';
import upload from '../../lib/upload';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];
const DISAPPEAR_OPTIONS = [
  { label: 'Off', value: null },
  { label: '5 min', value: 5 * 60 * 1000 },
  { label: '1 hr', value: 60 * 60 * 1000 },
  { label: '24 hr', value: 24 * 60 * 60 * 1000 },
];

const ChatBox = () => {

  const { userData, setUserData, messagesId, chatUser, messages, setMessages, chatVisible, setChatVisible, isTyping } = useContext(AppContext);
  const [input, setInput] = useState("");
  const [hoveredMsg, setHoveredMsg] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState("");
  const [disappearTimer, setDisappearTimer] = useState(null);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [showInfoMenu, setShowInfoMenu] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedByUser, setBlockedByUser] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // #9 Image preview before sending
  const [previewImage, setPreviewImage] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  // #10 Fullscreen image lightbox
  const [lightboxImage, setLightboxImage] = useState(null);

  const scrollEnd = useRef();
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const infoMenuRef = useRef(null);

  // Check if user is blocked/muted
  useEffect(() => {
    if (userData && chatUser) {
      setIsBlocked(userData.blockedUsers?.includes(chatUser.rId) || false);
      setIsMuted(userData.mutedUsers?.includes(chatUser.rId) || false);
      // Check if WE are blocked by the other user
      const checkBlockedBy = async () => {
        const otherUserRef = doc(db, "users", chatUser.rId);
        const otherUserSnap = await getDoc(otherUserRef);
        if (otherUserSnap.exists()) {
          const otherData = otherUserSnap.data();
          setBlockedByUser(otherData.blockedUsers?.includes(userData.id) || false);
        }
      };
      checkBlockedBy();
    }
  }, [userData, chatUser]);

  // Close info menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (infoMenuRef.current && !infoMenuRef.current.contains(e.target)) {
        setShowInfoMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setLightboxImage(null);
        setPreviewImage(null);
        setPreviewFile(null);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // Check and delete expired messages
  useEffect(() => {
    if (!messages || !messagesId) return;
    const now = Date.now();
    const expired = messages.filter(msg => msg.expiresAt && msg.expiresAt.toMillis() < now && !msg.deleted);
    if (expired.length > 0) {
      const deleteExpired = async () => {
        const msgRef = doc(db, "messages", messagesId);
        const msgSnap = await getDoc(msgRef);
        const allMessages = msgSnap.data().messages;
        let changed = false;
        allMessages.forEach((msg, i) => {
          if (msg.expiresAt && msg.expiresAt.toMillis() < now && !msg.deleted) {
            allMessages[i] = { ...msg, text: "⏱️ This message has disappeared", image: null, deleted: true };
            changed = true;
          }
        });
        if (changed) await updateDoc(msgRef, { messages: allMessages });
      };
      deleteExpired();
    }
  }, [messages]);

  const blockUser = async () => {
    try {
      const userRef = doc(db, "users", userData.id);
      const blockedUsers = userData.blockedUsers || [];
      if (isBlocked) {
        const updated = blockedUsers.filter(id => id !== chatUser.rId);
        await updateDoc(userRef, { blockedUsers: updated });
        setIsBlocked(false);
        setUserData(prev => ({ ...prev, blockedUsers: updated }));
        toast.success("User unblocked");
      } else {
        const updated = [...blockedUsers, chatUser.rId];
        await updateDoc(userRef, { blockedUsers: updated });
        setIsBlocked(true);
        setUserData(prev => ({ ...prev, blockedUsers: updated }));
        toast.success("User blocked");
      }
      setShowInfoMenu(false);
    } catch (error) { toast.error(error.message); }
  }

  const muteUser = async () => {
    try {
      const userRef = doc(db, "users", userData.id);
      const mutedUsers = userData.mutedUsers || [];
      if (isMuted) {
        await updateDoc(userRef, { mutedUsers: mutedUsers.filter(id => id !== chatUser.rId) });
        setIsMuted(false);
        toast.success("User unmuted");
      } else {
        await updateDoc(userRef, { mutedUsers: [...mutedUsers, chatUser.rId] });
        setIsMuted(true);
        toast.success("User muted");
      }
      setShowInfoMenu(false);
    } catch (error) { toast.error(error.message); }
  }

  const clearChat = async () => {
    try {
      if (!messagesId) return;
      await updateDoc(doc(db, "messages", messagesId), { messages: [] });
      toast.success("Chat cleared");
      setShowInfoMenu(false);
    } catch (error) { toast.error(error.message); }
  }

  const sendMessage = async () => {
    try {
      if (isBlocked) { toast.error("You have blocked this user"); return; }
      if (blockedByUser) { toast.error("You cannot send messages to this user"); return; }
      if (input && messagesId) {
        const msgData = {
          sId: userData.id,
          text: input,
          createdAt: new Date(),
          reactions: {}
        }
        if (replyTo) {
          msgData.replyTo = { text: replyTo.text || null, image: replyTo.image || null, sId: replyTo.sId }
        }
        if (disappearTimer) {
          msgData.expiresAt = new Date(Date.now() + disappearTimer);
        }
        await updateDoc(doc(db, "messages", messagesId), { messages: arrayUnion(msgData) })
        const userIDs = [chatUser.rId, userData.id];
        userIDs.forEach(async (id) => {
          const userChatsRef = doc(db, "chats", id);
          const userChatsSnapshot = await getDoc(userChatsRef);
          if (userChatsSnapshot.exists()) {
            const userChatsData = userChatsSnapshot.data();
            const chatIndex = userChatsData.chatsData.findIndex((c) => c.messageId === messagesId);
            userChatsData.chatsData[chatIndex].lastMessage = input;
            userChatsData.chatsData[chatIndex].updatedAt = Date.now();
            if (userChatsData.chatsData[chatIndex].rId == userData.id) {
              userChatsData.chatsData[chatIndex].messageSeen = false;
            }
            await updateDoc(userChatsRef, { chatsData: userChatsData.chatsData });
          }
        })
      }
    } catch (error) { toast.error(error.message) }
    setInput("");
    setReplyTo(null);
    await updateDoc(doc(db, "users", userData.id), { typingTo: null });
  }

  const handleTyping = async (e) => {
    setInput(e.target.value);
    if (chatUser && userData) {
      await updateDoc(doc(db, "users", userData.id), { typingTo: chatUser.rId });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(async () => {
        await updateDoc(doc(db, "users", userData.id), { typingTo: null });
      }, 2000);
    }
  }

  const handleReply = (msg) => {
    setReplyTo(msg);
    inputRef.current?.focus();
    setHoveredMsg(null);
  }

  const handleEdit = (msg, index) => {
    setEditingIndex(index);
    setEditText(msg.text);
    setHoveredMsg(null);
  }

  const saveEdit = async (msgIndex) => {
    try {
      const msgRef = doc(db, "messages", messagesId);
      const msgSnap = await getDoc(msgRef);
      const allMessages = msgSnap.data().messages;
      const actualIndex = allMessages.length - 1 - msgIndex;
      allMessages[actualIndex] = { ...allMessages[actualIndex], text: editText, edited: true };
      await updateDoc(msgRef, { messages: allMessages });
      setEditingIndex(null);
      setEditText("");
    } catch (error) { toast.error(error.message); }
  }

  const deleteMessage = async (msgIndex) => {
    try {
      const msgRef = doc(db, "messages", messagesId);
      const msgSnap = await getDoc(msgRef);
      const allMessages = msgSnap.data().messages;
      const actualIndex = allMessages.length - 1 - msgIndex;
      allMessages[actualIndex] = { ...allMessages[actualIndex], text: "🚫 This message was deleted", image: null, deleted: true };
      await updateDoc(msgRef, { messages: allMessages });
      setHoveredMsg(null);
    } catch (error) { toast.error(error.message); }
  }

  const addReaction = async (msgIndex, emoji) => {
    try {
      const msgRef = doc(db, "messages", messagesId);
      const msgSnap = await getDoc(msgRef);
      const allMessages = msgSnap.data().messages;
      const actualIndex = allMessages.length - 1 - msgIndex;
      const msg = { ...allMessages[actualIndex] };
      if (!msg.reactions) msg.reactions = {};
      const reactionUsers = msg.reactions[emoji] || [];
      if (reactionUsers.includes(userData.id)) {
        msg.reactions[emoji] = reactionUsers.filter(id => id !== userData.id);
        if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
      } else {
        Object.keys(msg.reactions).forEach(e => {
          msg.reactions[e] = msg.reactions[e].filter(id => id !== userData.id);
          if (msg.reactions[e].length === 0) delete msg.reactions[e];
        });
        msg.reactions[emoji] = [...reactionUsers, userData.id];
      }
      allMessages[actualIndex] = msg;
      await updateDoc(msgRef, { messages: allMessages });
      setHoveredMsg(null);
    } catch (error) { toast.error(error.message); }
  }

  // #9 Handle image selection — show preview first
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreviewFile(file);
    setPreviewImage(URL.createObjectURL(file));
    e.target.value = '';
  }

  // #9 Confirm and send the previewed image
  const confirmSendImage = async () => {
    if (!previewFile || !messagesId) return;
    setPreviewImage(null);
    setPreviewFile(null);
    const fileUrl = await upload(previewFile);
    if (fileUrl) {
      await updateDoc(doc(db, "messages", messagesId), {
        messages: arrayUnion({ sId: userData.id, image: fileUrl, createdAt: new Date(), reactions: {} })
      });
      const userIDs = [chatUser.rId, userData.id];
      userIDs.forEach(async (id) => {
        const userChatsRef = doc(db, "chats", id);
        const userChatsSnapshot = await getDoc(userChatsRef);
        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();
          const chatIndex = userChatsData.chatsData.findIndex((c) => c.messageId === messagesId);
          userChatsData.chatsData[chatIndex].lastMessage = "Image";
          userChatsData.chatsData[chatIndex].updatedAt = Date.now();
          await updateDoc(userChatsRef, { chatsData: userChatsData.chatsData });
        }
      });
    }
  }

  const getTimeLeft = (expiresAt) => {
    if (!expiresAt) return null;
    const ms = expiresAt.toMillis() - Date.now();
    if (ms <= 0) return null;
    const mins = Math.floor(ms / 60000);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `⏱️ ${hrs}h left`;
    if (mins > 0) return `⏱️ ${mins}m left`;
    return `⏱️ <1m left`;
  }

  const convertTimestamp = (timestamp) => {
    let date = timestamp.toDate();
    const hour = date.getHours();
    const minute = date.getMinutes().toString().padStart(2, '0');
    if (hour > 12) return (hour - 12) + ':' + minute + " PM";
    return hour + ':' + minute + " AM";
  }

  useEffect(() => {
    scrollEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages])

  useEffect(() => {
    if (messagesId) {
      const unSub = onSnapshot(doc(db, "messages", messagesId), (res) => {
        setMessages(res.data().messages.reverse());
      });
      return () => unSub();
    }
  }, [messagesId]);

  useEffect(() => {
    return () => {
      if (userData) updateDoc(doc(db, "users", userData.id), { typingTo: null });
    }
  }, []);

  return chatUser ? (
    <div className={`chat-box ${chatVisible ? "" : "hidden"}`}>

      {/* #10 Fullscreen image lightbox */}
      {lightboxImage && (
        <div className="lightbox" onClick={() => setLightboxImage(null)}>
          <button className="lightbox-close" onClick={() => setLightboxImage(null)}>✕</button>
          <img src={lightboxImage} alt="" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* #9 Image preview modal */}
      {previewImage && (
        <div className="img-preview-overlay">
          <div className="img-preview-modal">
            <p className="img-preview-title">Send this image?</p>
            <img src={previewImage} alt="preview" className="img-preview-img" />
            <div className="img-preview-actions">
              <button onClick={() => { setPreviewImage(null); setPreviewFile(null); }} className="img-preview-cancel">Cancel</button>
              <button onClick={confirmSendImage} className="img-preview-confirm">Send ➤</button>
            </div>
          </div>
        </div>
      )}

      <div className="chat-user">
        <img src={chatUser ? chatUser.userData.avatar : assets.profile_img} alt="" />
        <p>
          {chatUser ? chatUser.userData.name : "Richard Sanford"}
          {Date.now() - chatUser.userData.lastSeen <= 70000
            ? <img className='dot' src={assets.green_dot} alt='' />
            : null}
        </p>
        <img onClick={() => setChatVisible(false)} className='arrow' src={assets.arrow_icon} alt="" />
        <div className="info-menu-wrap" ref={infoMenuRef}>
          <img className='help' src={assets.help_icon} alt="" onClick={() => setShowInfoMenu(!showInfoMenu)} style={{ cursor: 'pointer' }} />
          {showInfoMenu && (
            <div className="info-dropdown">
              <button onClick={blockUser} className={`info-option ${isBlocked ? 'danger-active' : ''}`}>
                {isBlocked ? '✅ Unblock User' : '🚫 Block User'}
              </button>
              <button onClick={muteUser} className="info-option">
                {isMuted ? '🔔 Unmute' : '🔕 Mute'}
              </button>
              <hr className="info-divider" />
              <button onClick={clearChat} className="info-option danger">🗑️ Clear Chat</button>
            </div>
          )}
        </div>
      </div>

      {isBlocked && (
        <div className="blocked-banner">
          🚫 You have blocked this user. <span onClick={blockUser}>Unblock</span>
        </div>
      )}
      {blockedByUser && (
        <div className="blocked-banner blocked-by">
          🚫 You have been blocked by this user.
        </div>
      )}

      <div className="chat-msg">
        <div ref={scrollEnd}></div>
        {isTyping && (
          <div className="typing-indicator r-msg">
            <div className="typing-bubble">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={msg.sId === userData.id ? "s-msg" : "r-msg"}>

            <div className="msg-wrapper">
              {/* + reaction button */}
              {!msg.deleted && (
                <div className={`msg-actions ${msg.sId === userData.id ? 'actions-left' : 'actions-right'}`}>
                  <button className="plus-btn" onClick={() => setHoveredMsg(hoveredMsg === index ? null : index)}>+</button>
                  {msg.sId === userData.id && (
                    <>
                      {!msg.image && <button className="action-btn" onClick={() => handleEdit(msg, index)} title="Edit">✏️</button>}
                      <button className="action-btn" onClick={() => deleteMessage(index)} title="Delete">🗑️</button>
                    </>
                  )}
                  <button className="action-btn" onClick={() => handleReply(msg)} title="Reply">↩️</button>
                </div>
              )}

              {/* Reaction picker — shows on + click */}
              {hoveredMsg === index && !msg.deleted && (
                <div className={`reaction-picker ${msg.sId === userData.id ? 'left' : 'right'}`}>
                  {REACTIONS.map((emoji) => (
                    <button key={emoji} onClick={() => addReaction(index, emoji)} className="reaction-btn">{emoji}</button>
                  ))}
                </div>
              )}

              {msg.replyTo && (
                <div className="reply-preview-msg">
                  {msg.replyTo.image ? <span>📷 Image</span>
                    : <span>{msg.replyTo.text?.slice(0, 60)}{msg.replyTo.text?.length > 60 ? '...' : ''}</span>}
                </div>
              )}

              {editingIndex === index ? (
                <div className="edit-input-wrapper">
                  <input className="edit-input" value={editText} onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveEdit(index); if (e.key === "Escape") setEditingIndex(null); }} autoFocus />
                  <div className="edit-actions">
                    <button onClick={() => saveEdit(index)} className="edit-save">✓</button>
                    <button onClick={() => setEditingIndex(null)} className="edit-cancel">✕</button>
                  </div>
                </div>
              ) : (
                msg["image"] && !msg.deleted
                  /* #10 Click image to open fullscreen */
                  ? <img className='msg-img' src={msg["image"]} alt="" onClick={() => setLightboxImage(msg["image"])} />
                  : <p className={`msg ${msg.deleted ? 'deleted-msg' : ''}`}>
                      {msg["text"]}
                      {msg.edited && !msg.deleted && <span className="edited-label"> (edited)</span>}
                    </p>
              )}

              {msg.expiresAt && !msg.deleted && (
                <span className="expire-label">{getTimeLeft(msg.expiresAt)}</span>
              )}

              {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                <div className="reactions-display">
                  {Object.entries(msg.reactions).map(([emoji, users]) =>
                    users.length > 0 && (
                      <button key={emoji} onClick={() => addReaction(index, emoji)}
                        className={`reaction-tag ${users.includes(userData.id) ? 'my-reaction' : ''}`}>
                        {emoji} {users.length}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            <div>
              <img src={msg.sId === userData.id ? userData.avatar : chatUser.userData.avatar} alt="" />
              <p>{convertTimestamp(msg.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>

      {replyTo && (
        <div className="reply-bar">
          <div className="reply-bar-content">
            <span className="reply-bar-label">Replying to</span>
            <span className="reply-bar-text">{replyTo.image ? '📷 Image' : replyTo.text?.slice(0, 60)}</span>
          </div>
          <button onClick={() => setReplyTo(null)} className="reply-bar-close">✕</button>
        </div>
      )}

      <div className="chat-input">
        <input ref={inputRef} onKeyDown={(e) => e.key === "Enter" ? sendMessage() : null}
          onChange={handleTyping} value={input} type="text"
          placeholder={isBlocked ? 'Unblock to send messages' : blockedByUser ? 'You cannot send messages' : replyTo ? 'Type your reply...' : 'Send a message'}
          disabled={isBlocked || blockedByUser} />

        <div className="timer-wrap">
          <button className={`timer-btn ${disappearTimer ? 'timer-active' : ''}`}
            onClick={() => setShowTimerMenu(!showTimerMenu)} title="Disappearing message">⏱️</button>
          {showTimerMenu && (
            <div className="timer-menu">
              {DISAPPEAR_OPTIONS.map((opt) => (
                <button key={opt.label} className={`timer-option ${disappearTimer === opt.value ? 'selected' : ''}`}
                  onClick={() => { setDisappearTimer(opt.value); setShowTimerMenu(false); }}>{opt.label}</button>
              ))}
            </div>
          )}
        </div>

        {/* #9 Image select — shows preview first */}
        <input onChange={handleImageSelect} type="file" id='image' accept="image/png, image/jpeg" hidden />
        <label htmlFor="image">
          <img src={assets.gallery_icon} alt="" />
        </label>
        <button onClick={sendMessage} className="send-btn">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
  ) : (
    <div className={`chat-welcome ${chatVisible ? "" : "hidden"}`}>
      <img src={assets.logo_icon} alt='' />
      <p>Chat anytime, anywhere</p>
    </div>
  )
}

export default ChatBox