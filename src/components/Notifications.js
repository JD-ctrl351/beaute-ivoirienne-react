// src/components/Notifications.js

import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';

function Notifications() {
  const { currentUser } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    // Écouter les notifications en temps réel
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notifsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifsData);
    });

    return () => unsubscribe(); // Nettoyer l'écouteur
  }, [currentUser]);

  const handleMarkAsRead = async (id) => {
    const notifRef = doc(db, 'notifications', id);
    await updateDoc(notifRef, { isRead: true });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative text-gray-600 hover:text-orange-500 transition text-xl">
        <i className="fa-solid fa-bell"></i>
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50">
          <div className="p-4 font-bold border-b">Notifications</div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(notif => (
                <Link
                  to={notif.link || '#'}
                  key={notif.id}
                  onClick={() => {
                    handleMarkAsRead(notif.id);
                    setIsOpen(false);
                  }}
                  className={`block p-4 border-b hover:bg-gray-50 ${!notif.isRead ? 'bg-orange-50' : ''}`}
                >
                  <p className="text-sm text-gray-700">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {notif.createdAt?.toDate().toLocaleString('fr-FR')}
                  </p>
                </Link>
              ))
            ) : (
              <p className="p-4 text-sm text-gray-500">Aucune notification.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications;