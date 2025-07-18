import React, { useState, useEffect, useContext, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';

function ChatWindow({ conversation, userNames }) {
  const { currentUser } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const otherParticipantId = conversation.participants.find(id => id !== currentUser.uid);
  const otherParticipantName = userNames[otherParticipantId] || '...';

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Charger les messages en temps réel
  useEffect(() => {
    if (!conversation) return;

    const messagesRef = collection(db, 'conversations', conversation.id, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [conversation]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;
    const cleanMessage = newMessage.trim();
    setNewMessage('');

    const messagesRef = collection(db, 'conversations', conversation.id, 'messages');
    await addDoc(messagesRef, {
      text: cleanMessage,
      senderId: currentUser.uid,
      timestamp: serverTimestamp(),
    });

    // Mettre à jour la conversation avec le dernier message
    const conversationRef = doc(db, 'conversations', conversation.id);
    await updateDoc(conversationRef, {
        lastMessage: cleanMessage,
        lastMessageTimestamp: serverTimestamp()
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-gray-50">
        <h3 className="font-bold text-lg">{otherParticipantName}</h3>
      </div>

      <div className="flex-grow p-4 overflow-y-auto bg-gray-100">
        {messages.map(msg => (
          <div key={msg.id} className={`flex mb-4 ${msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded-lg py-2 px-4 max-w-sm ${msg.senderId === currentUser.uid ? 'bg-orange-500 text-white' : 'bg-white'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t bg-white">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez votre message..."
            className="flex-grow p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button type="submit" className="bg-orange-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-orange-600">
            Envoyer
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatWindow;