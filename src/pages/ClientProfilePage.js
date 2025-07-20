import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

function ClientProfilePage() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const docRef = doc(db, "clients", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setClient({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Ce client n'a pas été trouvé.");
        }
      } catch (err) {
        console.error("Erreur de chargement du profil client:", err);
        setError("Vous n'avez pas la permission de voir ce profil.");
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id]);

  if (loading) return <div className="text-center py-16">Chargement du profil...</div>;
  if (error) return <div className="text-center py-16 text-red-500">{error}</div>;
  if (!client) return null;

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=dbeafe&color=1e40af&size=128&bold=true`;

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-2xl mx-auto p-8">
        <div className="flex flex-col items-center text-center">
            <img src={avatarUrl} alt={`Avatar de ${client.name}`} className="w-32 h-32 rounded-full border-4 border-white shadow-md mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-md text-gray-600 mt-2">
                <i className="fas fa-envelope mr-2 text-gray-400"></i>{client.email}
            </p>
        </div>
      </div>
    </div>
  );
}

export default ClientProfilePage;