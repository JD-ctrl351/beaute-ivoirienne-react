import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { db, storage } from '../firebase'; // On importe "storage"
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Fonctions pour le téléversement
import { getAuth, updateProfile } from "firebase/auth";
import { Link } from 'react-router-dom';

function AppointmentsPage() {
  const { currentUser } = useContext(AuthContext);
  const auth = getAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProfessional, setIsProfessional] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');

  const [clientData, setClientData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  
  // NOUVEAU : État pour le téléversement de la photo client
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [favoriteProfiles, setFavoriteProfiles] = useState([]);

  const fetchAppointments = async () => {
    if (!currentUser) return;
    try {
        const q = query(collection(db, "appointments"), where("clientId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        let appointmentsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id, 
            ...data,
            createdAt: data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
        };
        });
        appointmentsData.sort((a, b) => b.createdAt - a.createdAt);
        setAppointments(appointmentsData);
    } catch (error) {
        console.error("Erreur de chargement des rendez-vous:", error);
    }
  };


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
          
          await fetchAppointments();

          const clientDocRef = doc(db, "clients", currentUser.uid);
          const clientDocSnap = await getDoc(clientDocRef);
          if (clientDocSnap.exists()) {
            const data = clientDocSnap.data();
            setClientData(data);
            setEditName(data.name || '');

            if (data.favorites && data.favorites.length > 0) {
                const favPromises = data.favorites.map(favId => getDoc(doc(db, "professionals", favId)));
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
        const updatedData = { 
            name: editName,
        };
        await updateProfile(auth.currentUser, { 
            displayName: editName,
        });
        await updateDoc(clientDocRef, updatedData);
        
        setClientData(prev => ({...prev, ...updatedData}));
        setIsEditing(false);
        alert("Profil mis à jour avec succès !");
    } catch (error) {
        console.error("Erreur de mise à jour du profil:", error);
        alert("Une erreur est survenue.");
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    const storageRef = ref(storage, `images/${currentUser.uid}/profile_${Date.now()}`);
    
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Mettre à jour dans l'authentification Firebase
      await updateProfile(auth.currentUser, { photoURL: downloadURL });

      // Mettre à jour dans le document client
      const clientDocRef = doc(db, "clients", currentUser.uid);
      await updateDoc(clientDocRef, { photoURL: downloadURL });

      setClientData(prev => ({ ...prev, photoURL: downloadURL }));
      alert("Photo de profil mise à jour !");
    } catch (error) {
      console.error("Erreur de téléversement de la photo :", error);
      alert("Une erreur est survenue.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCancelAppointment = async (appointment) => {
    if (!window.confirm("Êtes-vous sûr de vouloir annuler ce rendez-vous ?")) return;

    const appointmentRef = doc(db, "appointments", appointment.id);
    try {
        await updateDoc(appointmentRef, { status: 'annulé' });

        const proRef = doc(db, "professionals", appointment.professionalId);
        const proSnap = await getDoc(proRef);
        if (proSnap.exists()) {
            const proEmail = proSnap.data().email;
            await addDoc(collection(db, "mail"), {
                to: proEmail,
                message: {
                    subject: "Un rendez-vous a été annulé",
                    html: `Bonjour ${appointment.professionalName},<br><br>Le rendez-vous avec <strong>${clientData.name || currentUser.email}</strong> prévu le ${new Date(appointment.date).toLocaleDateString('fr-FR')} à ${appointment.time} a été annulé.<br><br>L'équipe Beauté Ivoirienne.`,
                },
            });
        }
        
        alert("Rendez-vous annulé.");
        fetchAppointments();
    } catch (error) {
        console.error("Erreur lors de l'annulation du RDV:", error);
        alert("Une erreur est survenue.");
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pendingAppointments = appointments.filter(rdv => rdv.status === 'en attente');
  const upcomingAppointments = appointments.filter(rdv => rdv.status === 'confirmé' && new Date(rdv.date) >= today);
  const pastAppointments = appointments.filter(rdv => rdv.status !== 'en attente' && new Date(rdv.date) < today);

  const renderAppointments = (list, canCancel = false) => {
    if (list.length === 0) {
      return <p className="text-gray-500 text-center py-8">Aucun rendez-vous.</p>;
    }
    return list.map(rdv => (
      <div key={rdv.id} className="border-b last:border-b-0 p-4 flex justify-between items-center">
        <div>
          <p className="font-bold text-lg text-gray-800">{rdv.professionalName}</p>
          <p className="text-gray-600">{new Date(rdv.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {rdv.time}</p>
        </div>
        <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 text-sm font-semibold rounded-full
            ${rdv.status === 'confirmé' ? 'bg-green-100 text-green-800' : ''}
            ${rdv.status === 'en attente' ? 'bg-yellow-100 text-yellow-800' : ''}
            ${rdv.status === 'refusé' ? 'bg-red-100 text-red-800' : ''}
            ${rdv.status === 'annulé' ? 'bg-gray-100 text-gray-800' : ''}
            `}>
            {rdv.status}
            </span>
            {canCancel && (
                <button onClick={() => handleCancelAppointment(rdv)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs transition">Annuler</button>
            )}
        </div>
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

  if (loading) return <div className="text-center py-16">Chargement...</div>;
  if (!currentUser) return (
    <div className="text-center max-w-2xl mx-auto my-16 bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold">Veuillez vous connecter</h2>
    </div>
  );
  if (isProfessional) return (
    <div className="text-center max-w-2xl mx-auto my-16 bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold">Accès Espace Client</h2>
      <p className="mt-4">Cette page est réservée aux clients. <Link to="/prestataires" className="text-orange-500 font-bold">Accéder à mon Espace Pro</Link>.</p>
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
                <button onClick={() => setActiveTab('upcoming')} className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'upcoming' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>RDV à venir</button>
                <button onClick={() => setActiveTab('pending')} className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'pending' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Demandes <span className="ml-2 bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">{pendingAppointments.length}</span></button>
                <button onClick={() => setActiveTab('favorites')} className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'favorites' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Favoris</button>
                <button onClick={() => setActiveTab('past')} className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'past' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Historique</button>
              </nav>
            </div>
            <div className="p-2 min-h-[200px]">
              {activeTab === 'upcoming' && renderAppointments(upcomingAppointments, true)}
              {activeTab === 'pending' && renderAppointments(pendingAppointments)}
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
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="relative">
                           <img 
                                src={clientData?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(clientData?.name || 'A')}&background=dbeafe&color=1e40af`}
                                alt="Profil"
                                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                            />
                            <label htmlFor="client-photo-upload" className="absolute -bottom-1 -right-1 bg-gray-700 hover:bg-gray-800 text-white p-2 rounded-full cursor-pointer transition">
                                {uploadingPhoto ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-camera"></i>}
                                <input id="client-photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                            </label>
                        </div>
                        <div>
                            <p className="font-bold text-xl">{clientData?.name}</p>
                            <p className="text-gray-600">{currentUser.email}</p>
                        </div>
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