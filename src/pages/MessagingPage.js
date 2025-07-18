import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import ChatWindow from '../components/ChatWindow';

function MessagingPage() {
  const { currentUser } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userNames, setUserNames] = useState({});

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const conversationsRef = collection(db, 'conversations');
    // CORRECTION: On retire le tri de la requête pour éviter le besoin d'un index
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      let convos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // On trie les conversations ici, dans le code, après les avoir récupérées
      convos.sort((a, b) => {
          const dateA = a.lastMessageTimestamp?.toDate() || 0;
          const dateB = b.lastMessageTimestamp?.toDate() || 0;
          return dateB - dateA;
      });

      const userIds = new Set();
      convos.forEach(c => c.participants.forEach(id => userIds.add(id)));
      const names = {};
      for (const userId of userIds) {
        if (!userNames[userId]) {
            const clientDoc = await getDoc(doc(db, 'clients', userId));
            if(clientDoc.exists()) {
                 names[userId] = clientDoc.data().name;
            } else {
                const proDoc = await getDoc(doc(db, 'professionals', userId));
                if(proDoc.exists()) {
                    names[userId] = proDoc.data().name;
                }
            }
        }
      }
      setUserNames(prev => ({...prev, ...names}));
      
      setConversations(convos);

      const params = new URLSearchParams(location.search);
      const activeId = params.get('id');
      if (activeId) {
        const foundConvo = convos.find(c => c.id === activeId);
        if (foundConvo) setActiveConversation(foundConvo);
      } else if (convos.length > 0) {
        setActiveConversation(convos[0]);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, location.search]);

  const handleConversationSelect = (convo) => {
    setActiveConversation(convo);
    navigate(`/messagerie?id=${convo.id}`);
  }

  if (loading) {
    return <div className="text-center py-16">Chargement des conversations...</div>;
  }

  if (!currentUser) {
      return <div className="text-center py-16">Veuillez vous connecter pour voir vos messages.</div>
  }

  return (
    <div className="container mx-auto my-8 h-[calc(100vh-200px)]">
      <div className="flex h-full border rounded-lg shadow-lg bg-white">
        <div className="w-full md:w-1/3 border-r bg-gray-50 overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">Conversations</h2>
          </div>
          {conversations.length > 0 ? (
            <ul>
              {conversations.map(convo => {
                  const otherParticipantId = convo.participants.find(id => id !== currentUser.uid);
                  const otherParticipantName = userNames[otherParticipantId] || '...';
                  return (
                    <li
                        key={convo.id}
                        className={`p-4 cursor-pointer hover:bg-gray-100 ${activeConversation?.id === convo.id ? 'bg-orange-100' : ''}`}
                        onClick={() => handleConversationSelect(convo)}
                    >
                        <p className="font-semibold">{otherParticipantName}</p>
                        <p className="text-sm text-gray-600 truncate">{convo.lastMessage || '...'}</p>
                    </li>
                  )
                })}
            </ul>
          ) : (
            <p className="p-4 text-gray-500">Aucune conversation.</p>
          )}
        </div>

        <div className="hidden md:flex w-2/3 flex-col">
          {activeConversation ? (
            <ChatWindow conversation={activeConversation} userNames={userNames} />
          ) : (
            <div className="flex-grow flex items-center justify-center">
              <p className="text-gray-500">Sélectionnez une conversation pour commencer à discuter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessagingPage;