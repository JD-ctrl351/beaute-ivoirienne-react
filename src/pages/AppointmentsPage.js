import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';

function AppointmentsPage() {
  const { currentUser } = useContext(AuthContext);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProfessional, setIsProfessional] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  const [clientName, setClientName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  const [favoriteProfiles, setFavoriteProfiles] = useState([]);


  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const proDocRef = doc(db, "professionals", currentUser.uid);
        const proDocSnap = await getDoc(proDocRef);
        if (proDocSnap.exists()) {
          setIsProfessional(true);
        } else {
          setIsProfessional(false);
          
          // CORRECTION: Simplification de la requête et ajout du tri côté client
          const q = query(collection(db, "appointments"), where("clientId", "==", currentUser.uid));
          const querySnapshot = await getDocs(q);
          
          let appointmentsData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            // Assurez-vous que createdAt est un objet Date pour le tri
            return { 
              id: doc.id, 
              ...data,
              createdAt: data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
            };
          });

          // Tri des rendez-vous par date de création (du plus récent au plus ancien)
          appointmentsData.sort((a, b) => b.createdAt - a.createdAt);
          
          setAppointments(appointmentsData);

          const clientDocRef = doc(db, "clients", currentUser.uid);
          const clientDocSnap = await getDoc(clientDocRef);
          if (clientDocSnap.exists()) {
            const clientData = clientDocSnap.data();
            setClientName(clientData.name);
            setEditName(clientData.name);

            if (clientData.favorites && clientData.favorites.length > 0) {
                const favPromises = clientData.favorites.map(favId => getDoc(doc(db, "professionals", favId)));
                const favDocs = await Promise.all(favPromises);
                const favProfiles = favDocs.filter(d => d.exists()).map(docSnap => ({id: docSnap.id, ...docSnap.data()}));
                setFavoriteProfiles(favProfiles);
            }
          }
        }
      } catch (error) {
        console.error("Erreur de chargement des données:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const clientDocRef = doc(db, "clients", currentUser.uid);
    try {
        await updateDoc(clientDocRef, { name: editName });
        setClientName(editName);
        setIsEditing(false);
        alert("Nom mis à jour avec succès !");
    } catch (error) {
        console.error("Erreur de mise à jour du profil:", error);
        alert("Une erreur est survenue.");
    }
  };

  // Logique de filtrage améliorée
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Pour comparer uniquement les dates

  const pendingAppointments = appointments.filter(rdv => rdv.status === 'en attente');
  const upcomingAppointments = appointments.filter(rdv => rdv.status === 'confirmé' && new Date(rdv.date) >= today);
  const pastAppointments = appointments.filter(rdv => rdv.status !== 'en attente' && new Date(rdv.date) < today);


  const renderAppointments = (list) => {
    if (list.length === 0) {
      return <p className="text-gray-500 text-center py-8">Aucun rendez-vous dans cette catégorie.</p>;
    }
    return list.map(rdv => (
      <div key={rdv.id} className="border-b last:border-b-0 p-4 flex justify-between items-center">
        <div>
          <p className="font-bold text-lg text-gray-800">{rdv.professionalName}</p>
          <p className="text-gray-600">{new Date(rdv.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {rdv.time}</p>
        </div>
        <span className={`px-3 py-1 text-sm font-semibold rounded-full
          ${rdv.status === 'confirmé' ? 'bg-green-100 text-green-800' : ''}
          ${rdv.status === 'en attente' ? 'bg-yellow-100 text-yellow-800' : ''}
          ${rdv.status === 'refusé' ? 'bg-red-100 text-red-800' : ''}
          ${rdv.status === 'annulé' ? 'bg-gray-100 text-gray-800' : ''}
        `}>
          {rdv.status}
        </span>
      </div>
    ));
  };

  const renderFavorites = (list) => {
    if (list.length === 0) {
        return <p className="text-gray-500 text-center py-8">Vous n'avez aucun professionnel en favori.</p>;
    }
    return list.map(pro => (
        <div key={pro.id} className="border-b last:border-b-0 p-4 flex justify-between items-center">
            <div className="flex items-center">
                <img
                    src={pro.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(pro.name)}&background=ffedd5&color=f97316&size=128&bold=true`}
                    alt={pro.name}
                    className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                    <p className="font-bold text-lg text-gray-800">{pro.name}</p>
                    <p className="text-sm text-gray-600">{pro.domain}</p>
                </div>
            </div>
            <Link to={`/prestataire/${pro.id}`} className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold hover:bg-orange-600">
                Voir
            </Link>
        </div>
    ));
  };


  if (loading) return <div className="text-center py-16">Chargement de votre espace...</div>;

  if (!currentUser) return (
    <div className="text-center max-w-2xl mx-auto my-16 bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800">Veuillez vous connecter</h2>
      <p className="text-gray-600 mt-4">Vous devez être connecté pour accéder à cette page.</p>
    </div>
  );

  if (isProfessional) return (
    <div className="text-center max-w-2xl mx-auto my-16 bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800">Accès Espace Client</h2>
      <p className="text-gray-600 mt-4">Cette page est réservée aux clients. Pour gérer vos rendez-vous, veuillez accéder à votre <Link to="/prestataires" className="text-orange-500 font-bold">Espace Pro</Link>.</p>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Mon Espace Client</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-6 px-6 overflow-x-auto">
                <button onClick={() => setActiveTab('pending')} className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'pending' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                  Demandes en attente <span className="ml-2 bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">{pendingAppointments.length}</span>
                </button>
                <button onClick={() => setActiveTab('upcoming')} className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'upcoming' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                  RDV à venir
                </button>
                 <button onClick={() => setActiveTab('favorites')} className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'favorites' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                  Mes Favoris
                </button>
                <button onClick={() => setActiveTab('past')} className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'past' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                  Historique
                </button>
              </nav>
            </div>
            <div className="p-2 min-h-[200px]">
              {activeTab === 'pending' && renderAppointments(pendingAppointments)}
              {activeTab === 'upcoming' && renderAppointments(upcomingAppointments)}
              {activeTab === 'favorites' && renderFavorites(favoriteProfiles)}
              {activeTab === 'past' && renderAppointments(pastAppointments)}
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">Mon Profil</h3>
            {!isEditing ? (
                <div>
                    <div className="space-y-4">
                        <div><label className="font-semibold text-gray-600">Nom :</label><p>{clientName}</p></div>
                        <div><label className="font-semibold text-gray-600">Email :</label><p>{currentUser.email}</p></div>
                    </div>
                    <button onClick={() => setIsEditing(true)} className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition">
                        Modifier le nom
                    </button>
                </div>
            ) : (
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block font-semibold text-gray-700">Nom</label>
                        <input type="text" id="name" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full mt-1 p-2 border rounded-lg"/>
                    </div>
                     <div>
                        <label className="block font-semibold text-gray-700">Email</label>
                        <input type="email" value={currentUser.email} disabled className="w-full mt-1 p-2 border rounded-lg bg-gray-100"/>
                    </div>
                    <div className="flex space-x-4">
                        <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">Enregistrer</button>
                        <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Annuler</button>
                    </div>
                </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppointmentsPage;