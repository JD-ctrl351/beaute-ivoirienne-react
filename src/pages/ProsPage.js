import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getAuth, updateProfile } from "firebase/auth";
import { Link, useNavigate } from 'react-router-dom';

const SERVICE_CLIENT_UID = "ET79QIbEM9hDLDg80LYq9jhNbpy2"; 
const MINIMUM_REVIEWS = 3;
const MINIMUM_RATING = 4.0;

// Composant pour la fenêtre modale de vérification
function VerificationModal({ proData, onClose, onProfileUpdate }) {
    const { currentUser } = useContext(AuthContext);
    const [phoneNumber, setPhoneNumber] = useState(proData.phoneNumber || '');
    const [dateOfBirth, setDateOfBirth] = useState(proData.dateOfBirth || '');
    const [proofLink, setProofLink] = useState(proData.proofLink || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!proofLink || !phoneNumber || !dateOfBirth) {
            alert("Veuillez remplir toutes les informations pour soumettre votre demande.");
            return;
        }
        if (!window.confirm("Confirmez-vous l'envoi de ces informations pour vérification ?")) return;

        setLoading(true);
        const proDocRef = doc(db, "professionals", currentUser.uid);
        try {
            const verificationData = {
                phoneNumber,
                dateOfBirth,
                proofLink,
                verificationRequested: true
            };
            await updateDoc(proDocRef, verificationData);
            onProfileUpdate(verificationData);
            alert("Votre demande de vérification a été envoyée avec succès !");
            onClose();
        } catch (error) {
            console.error("Erreur lors de la soumission de la vérification:", error);
            alert("Une erreur est survenue.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 max-w-lg w-full shadow-lg relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                <h3 className="text-2xl font-bold text-center mb-6 text-gray-800">Demande de Vérification</h3>
                <p className="text-center text-sm text-gray-600 mb-6">Veuillez fournir les informations suivantes. Elles seront examinées par notre équipe et ne seront pas affichées sur votre profil public.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label htmlFor="phoneNumber" className="block font-semibold text-gray-700">Numéro de téléphone</label><input type="tel" id="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required className="w-full mt-1 p-2 border rounded-lg"/></div>
                    <div><label htmlFor="dateOfBirth" className="block font-semibold text-gray-700">Date de naissance</label><input type="date" id="dateOfBirth" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required className="w-full mt-1 p-2 border rounded-lg"/></div>
                    <div><label htmlFor="proofLink" className="block font-semibold text-gray-700">Lien de preuve (Page pro Facebook, Instagram...)</label><input type="url" id="proofLink" placeholder="https://www.instagram.com/moncompte" value={proofLink} onChange={(e) => setProofLink(e.target.value)} required className="w-full mt-1 p-2 border rounded-lg"/></div>
                    
                    <div className="space-y-2 pt-4 border-t">
                        <p className="text-sm text-gray-500 text-center">Le téléversement de documents sera bientôt disponible pour une vérification avancée.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button type="button" disabled className="bg-gray-300 text-gray-500 font-bold py-2 px-4 rounded-lg cursor-not-allowed">Pièce d'identité (Recto)</button>
                            <button type="button" disabled className="bg-gray-300 text-gray-500 font-bold py-2 px-4 rounded-lg cursor-not-allowed">Pièce d'identité (Verso)</button>
                            <button type="button" disabled className="bg-gray-300 text-gray-500 font-bold py-2 px-4 rounded-lg cursor-not-allowed">Selfie</button>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition shadow-md disabled:bg-gray-400">
                        {loading ? 'Envoi en cours...' : 'Envoyer ma demande'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function ProsPage() {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const auth = getAuth();
  const [proData, setProData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  
  const [editName, setEditName] = useState('');
  const [editDomain, setEditDomain] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPhotoURL, setEditPhotoURL] = useState('');

  const initialAvailability = {
      lundi: { active: false, start: '09:00', end: '17:00' },
      mardi: { active: false, start: '09:00', end: '17:00' },
      mercredi: { active: false, start: '09:00', end: '17:00' },
      jeudi: { active: false, start: '09:00', end: '17:00' },
      vendredi: { active: false, start: '09:00', end: '17:00' },
      samedi: { active: false, start: '09:00', end: '17:00' },
      dimanche: { active: false, start: '09:00', end: '17:00' },
  };
  const [availability, setAvailability] = useState(initialAvailability);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    if (!currentUser) {
      setProData(null);
      setLoading(false);
      return;
    }
    if (currentUser.uid === SERVICE_CLIENT_UID) {
      navigate('/service-client-dashboard');
      return;
    }

    const checkUserRoleAndFetchData = async () => {
      setLoading(true);
      try {
        const proDocRef = doc(db, "professionals", currentUser.uid);
        const proDocSnap = await getDoc(proDocRef);
        if (proDocSnap.exists()) {
          const data = proDocSnap.data();
          setProData(data);
          setEditName(data.name || '');
          setEditDomain(data.domain || '');
          setEditDescription(data.description || '');
          setEditPhotoURL(data.photoURL || '');
          setAvailability(prev => ({...initialAvailability, ...data.availability}));
          const appointmentsQuery = query(collection(db, "appointments"), where("professionalId", "==", currentUser.uid));
          const appointmentsSnapshot = await getDocs(appointmentsQuery);
          const appointmentsData = appointmentsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setAppointments(appointmentsData);
        } else {
          setProData(null);
        }
      } catch (error) {
        console.error("Erreur de chargement des données pro :", error);
      } finally {
        setLoading(false);
      }
    };
    checkUserRoleAndFetchData();
  }, [currentUser, navigate]);
  
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const proDocRef = doc(db, "professionals", currentUser.uid);
    try {
      const updatedData = { 
        name: editName, 
        domain: editDomain, 
        description: editDescription,
        photoURL: editPhotoURL
      };
      await updateProfile(auth.currentUser, { photoURL: editPhotoURL });
      await updateDoc(proDocRef, updatedData);
      
      setProData(prev => ({ ...prev, ...updatedData }));
      setIsEditing(false);
      alert("Profil mis à jour avec succès !");
    } catch (error) {
      console.error("Erreur de mise à jour du profil:", error);
      alert("Une erreur est survenue.");
    }
  };

  const handleAppointmentStatus = async (appointmentId, newStatus) => {
    const appointmentRef = doc(db, "appointments", appointmentId);
    try {
      await updateDoc(appointmentRef, { status: newStatus });
      setAppointments(prev => prev.map(rdv => rdv.id === appointmentId ? { ...rdv, status: newStatus } : rdv));
    } catch (error) {
      console.error("Erreur de mise à jour du statut:", error);
      alert("Une erreur est survenue.");
    }
  };

  const handleAvailabilityChange = (day, field, value) => {
    setAvailability(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const handleAvailabilitySave = async () => {
    const proDocRef = doc(db, "professionals", currentUser.uid);
    try {
      await updateDoc(proDocRef, { availability: availability });
      alert("Disponibilités mises à jour avec succès !");
    } catch (error) {
      console.error("Erreur de mise à jour des disponibilités:", error);
      alert("Une erreur est survenue.");
    }
  };

   const handleAddService = async (e) => {
    e.preventDefault();
    if (!newServiceName || !newServicePrice || !newServiceDuration) {
      alert("Veuillez remplir au moins le nom, le prix et la durée.");
      return;
    }
    const newService = {
      id: Date.now().toString(), name: newServiceName, price: Number(newServicePrice),
      duration: Number(newServiceDuration), description: newServiceDescription,
    };
    const proDocRef = doc(db, "professionals", currentUser.uid);
    try {
      await updateDoc(proDocRef, { services: arrayUnion(newService) });
      setProData(prev => ({ ...prev, services: [...(prev.services || []), newService] }));
      setNewServiceName(''); setNewServicePrice(''); setNewServiceDuration(''); setNewServiceDescription('');
      alert("Service ajouté avec succès !");
    } catch (error) {
      console.error("Erreur lors de l'ajout du service:", error);
      alert("Une erreur est survenue.");
    }
  };

  const handleDeleteService = async (serviceToDelete) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le service "${serviceToDelete.name}" ?`)) return;
    const proDocRef = doc(db, "professionals", currentUser.uid);
    try {
      await updateDoc(proDocRef, { services: arrayRemove(serviceToDelete) });
      setProData(prev => ({ ...prev, services: prev.services.filter(s => s.id !== serviceToDelete.id) }));
      alert("Service supprimé.");
    } catch (error) {
      console.error("Erreur lors de la suppression du service:", error);
      alert("Une erreur est survenue.");
    }
  };
  
  const handleDeleteImage = async (imageUrlToDelete) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette image ?")) return;
    const proDocRef = doc(db, "professionals", currentUser.uid);
    try {
        await updateDoc(proDocRef, { gallery: arrayRemove(imageUrlToDelete) });
        setProData(prev => ({ ...prev, gallery: prev.gallery.filter(url => url !== imageUrlToDelete) }));
        alert("Image supprimée.");
    } catch (error) {
        console.error("Erreur lors de la suppression de l'image:", error);
        alert("Une erreur est survenue.");
    }
  };
  
  const renderAppointmentsList = (list, type) => {
    if (list.length === 0) return <p className="text-gray-500 text-center py-4">Aucun rendez-vous dans cette catégorie.</p>;
    return list.map(rdv => (
        <div key={rdv.id} className="border-t pt-4 flex flex-col md:flex-row justify-between items-start">
            <div>
                <Link to={`/client/${rdv.clientId}`} className="font-bold text-gray-800 hover:underline hover:text-orange-600">
                    {rdv.clientEmail}
                </Link>
                <p className="text-sm text-gray-600">{rdv.serviceName}</p>
                <p className="text-sm text-gray-500">{new Date(rdv.date).toLocaleDateString('fr-FR')} à {rdv.time}</p>
            </div>
            <div className="flex space-x-2 mt-2 md:mt-0">
                {type === 'pending' && (
                    <>
                        <button onClick={() => handleAppointmentStatus(rdv.id, 'confirmé')} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-xs transition">Confirmer</button>
                        <button onClick={() => handleAppointmentStatus(rdv.id, 'refusé')} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs transition">Refuser</button>
                    </>
                )}
                {type === 'confirmed' && (
                    <button onClick={() => handleAppointmentStatus(rdv.id, 'annulé')} className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-xs transition">Annuler</button>
                )}
            </div>
        </div>
    ));
  };

  if (loading) return <div className="text-center py-16">Vérification de votre statut...</div>;

  if (!currentUser || !proData) {
    return ( 
      <div className="text-center max-w-2xl mx-auto my-16 bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800">Accès Réservé</h2>
        <p className="text-gray-600 mt-4">Vous devez être un professionnel connecté pour voir cette page.</p>
      </div>
    );
  }
  
  const reviewCount = proData.reviews?.length || 0;
  const averageRating = reviewCount > 0 ? (proData.reviews.reduce((a, b) => a + b.rating, 0) / reviewCount) : 0;
  const canRequestVerification = reviewCount >= MINIMUM_REVIEWS && averageRating >= MINIMUM_RATING;
  const pendingAppointments = appointments.filter(rdv => rdv.status === 'en attente').sort((a,b) => new Date(a.date) - new Date(b.date));
  const confirmedAppointments = appointments.filter(rdv => rdv.status === 'confirmé').sort((a,b) => new Date(a.date) - new Date(b.date));
  const pastAppointments = appointments.filter(rdv => rdv.status === 'refusé' || rdv.status === 'annulé' || (rdv.status === 'confirmé' && new Date(rdv.date) < new Date())).sort((a,b) => new Date(b.date) - new Date(a.date));

  return (
    <>
      {isVerificationModalOpen && (
        <VerificationModal 
          proData={proData}
          onClose={() => setIsVerificationModalOpen(false)}
          onProfileUpdate={(updatedData) => setProData(prev => ({...prev, ...updatedData}))}
        />
      )}

      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Mon Tableau de Bord</h2>
          <Link to={`/prestataire/${currentUser.uid}`} className="text-white bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors text-sm font-semibold">Voir mon profil public</Link>
        </div>

        {!proData.verified && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-8 rounded-md shadow" role="alert">
              <p className="font-bold text-lg">Devenez un Professionnel Vérifié</p>
              <p className="mt-1">Pour gagner la confiance des clients et apparaître en priorité, faites vérifier votre profil.</p>
              
              <div className="mt-4 bg-white p-4 rounded">
                  <p className="font-semibold text-gray-800">Prérequis :</p>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                      <li className={reviewCount >= MINIMUM_REVIEWS ? 'text-green-600' : 'text-red-600'}>
                          {reviewCount >= MINIMUM_REVIEWS ? '✔' : '❌'} Avoir au moins {MINIMUM_REVIEWS} avis (actuellement : {reviewCount})
                      </li>
                      <li className={averageRating >= MINIMUM_RATING ? 'text-green-600' : 'text-red-600'}>
                          {averageRating >= MINIMUM_RATING ? '✔' : '❌'} Avoir une note moyenne de {MINIMUM_RATING}/5 (actuellement : {averageRating.toFixed(1)}/5)
                      </li>
                  </ul>
              </div>

              {proData.verificationRequested ? (
                <p className="mt-4 font-semibold text-blue-700">Votre demande de vérification est en cours d'examen.</p>
              ) : (
                <button onClick={() => setIsVerificationModalOpen(true)} disabled={!canRequestVerification} className={`mt-4 w-full font-bold py-2 px-4 rounded ${!canRequestVerification ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}>
                  {canRequestVerification ? 'Demander la vérification' : 'Prérequis non atteints'}
                </button>
              )}
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6 flex items-center"><i className="fas fa-star fa-2x text-yellow-400 mr-4"></i><div><p className="text-gray-500 text-sm">Note moyenne</p><p className="text-2xl font-bold text-gray-800">{averageRating.toFixed(1)}</p></div></div>
              <div className="bg-white rounded-xl shadow-md p-6 flex items-center"><i className="fas fa-calendar-check fa-2x text-green-500 mr-4"></i><div><p className="text-gray-500 text-sm">RDV total</p><p className="text-2xl font-bold text-gray-800">{appointments.length}</p></div></div>
              <div className="bg-white rounded-xl shadow-md p-6 flex items-center"><i className="fas fa-hourglass-half fa-2x text-blue-500 mr-4"></i><div><p className="text-gray-500 text-sm">Clients en attente</p><p className="text-2xl font-bold text-gray-800">{pendingAppointments.length}</p></div></div>
        </section>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                  <section className="bg-white rounded-xl shadow-md p-8">
                      <h3 className="text-2xl font-semibold text-gray-800 mb-6">Mon Profil Public</h3>
                      {!isEditing ? (
                          <div>
                            <div className="flex items-center space-x-4 mb-6">
                                  <img src={proData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(proData.name || 'A')}`} className="w-24 h-24 rounded-full object-cover border-4 border-gray-200" alt="Profil"/>
                                  <div>
                                      <p className="font-bold text-xl">{proData.name}</p>
                                      <p className="text-gray-600">{proData.domain}</p>
                                  </div>
                            </div>
                            <div><label className="font-semibold text-gray-600">Description :</label><p className="whitespace-pre-wrap mt-1">{proData.description || "Non renseignée"}</p></div>
                            <button onClick={() => setIsEditing(true)} className="mt-6 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition">Modifier</button>
                          </div>
                      ) : (
                          <form onSubmit={handleProfileUpdate} className="space-y-4">
                              <div><label htmlFor="name" className="block font-semibold text-gray-700">Nom public</label><input type="text" id="name" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full mt-1 p-2 border rounded-lg"/></div>
                              <div>
                                <label htmlFor="photoURL" className="block font-semibold text-gray-700">URL de la photo de profil</label>
                                <input type="url" id="photoURL" value={editPhotoURL} onChange={(e) => setEditPhotoURL(e.target.value)} className="w-full mt-1 p-2 border rounded-lg"/>
                              </div>
                              <div><label htmlFor="domain" className="block font-semibold text-gray-700">Domaine</label><input type="text" id="domain" value={editDomain} onChange={(e) => setEditDomain(e.target.value)} className="w-full mt-1 p-2 border rounded-lg"/></div>
                              <div><label htmlFor="description" className="block font-semibold text-gray-700">Description</label><textarea id="description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows="5" className="w-full mt-1 p-2 border rounded-lg"/></div>
                              <div className="flex space-x-4"><button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">Enregistrer</button><button type="button" onClick={() => setIsEditing(false)} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Annuler</button></div>
                          </form>
                      )}
                  </section>
                  
                  <section className="bg-white rounded-xl shadow-md p-8">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-6">Ma Galerie Photos</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {proData.gallery && proData.gallery.map((imageUrl, index) => (
                            <div key={index} className="relative group">
                                <img src={imageUrl} alt={`Galerie ${index + 1}`} className="w-full h-32 object-cover rounded-lg"/>
                                <button onClick={() => handleDeleteImage(imageUrl)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                     <div className="space-y-2 border-t pt-6 text-center">
                        <p className="text-sm text-gray-500 mb-2">Le téléversement direct des photos n'est pas encore disponible.</p>
                        <button disabled className="bg-gray-300 text-gray-500 font-bold py-2 px-4 rounded-lg cursor-not-allowed">
                            Ajouter une image (bientôt)
                        </button>
                    </div>
                  </section>
                
                  <section className="bg-white rounded-xl shadow-md p-8">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-6">Mes Services</h3>
                    <div className="space-y-2 mb-6">
                        {proData.services && proData.services.length > 0 ? (
                            proData.services.map(service => (
                            <div key={service.id} className="flex justify-between items-center border p-3 rounded-lg">
                                <div>
                                <p className="font-bold">{service.name}</p>
                                <p className="text-sm text-gray-600">{service.duration} minutes - {service.price} XOF</p>
                                </div>
                                <button onClick={() => handleDeleteService(service)} className="text-red-500 hover:text-red-700"><i className="fas fa-trash"></i></button>
                            </div>
                            ))
                        ) : (<p className="text-sm text-gray-500 text-center">Vous n'avez ajouté aucun service.</p>)}
                    </div>
                    <form onSubmit={handleAddService} className="space-y-4 border-t pt-6">
                        <h4 className="text-lg font-semibold text-gray-700">Ajouter un nouveau service</h4>
                        <div><label htmlFor="service-name" className="block text-sm font-medium text-gray-700">Nom du service</label><input type="text" id="service-name" value={newServiceName} onChange={e => setNewServiceName(e.target.value)} required className="mt-1 block w-full p-2 border rounded-md shadow-sm"/></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label htmlFor="service-price" className="block text-sm font-medium text-gray-700">Prix (XOF)</label><input type="number" id="service-price" value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)} required className="mt-1 block w-full p-2 border rounded-md shadow-sm"/></div>
                            <div><label htmlFor="service-duration" className="block text-sm font-medium text-gray-700">Durée (minutes)</label><input type="number" id="service-duration" value={newServiceDuration} onChange={e => setNewServiceDuration(e.target.value)} required className="mt-1 block w-full p-2 border rounded-md shadow-sm"/></div>
                        </div>
                        <div><label htmlFor="service-desc" className="block text-sm font-medium text-gray-700">Description (optionnel)</label><textarea id="service-desc" value={newServiceDescription} onChange={e => setNewServiceDescription(e.target.value)} rows="3" className="mt-1 block w-full p-2 border rounded-md shadow-sm"/></div>
                        <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg">Ajouter le service</button>
                    </form>
                  </section>

                  <section className="bg-white rounded-xl shadow-md p-8">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-6">Gestion des Disponibilités</h3>
                    <div className="space-y-4">
                        {Object.keys(availability).map(day => (
                            <div key={day} className="grid grid-cols-3 items-center gap-4 border-t pt-4">
                                <div className="flex items-center">
                                    <input type="checkbox" id={day} checked={availability[day].active} onChange={(e) => handleAvailabilityChange(day, 'active', e.target.checked)} className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                                    <label htmlFor={day} className="ml-3 block text-sm font-medium text-gray-700 capitalize">{day}</label>
                                </div>
                                <div className="col-span-2 grid grid-cols-2 gap-2">
                                    <input type="time" value={availability[day].start} disabled={!availability[day].active} onChange={(e) => handleAvailabilityChange(day, 'start', e.target.value)} className="p-2 border rounded-lg disabled:opacity-50" />
                                    <input type="time" value={availability[day].end} disabled={!availability[day].active} onChange={(e) => handleAvailabilityChange(day, 'end', e.target.value)} className="p-2 border rounded-lg disabled:opacity-50" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleAvailabilitySave} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition">Enregistrer les disponibilités</button>
                  </section>
              </div>
              <div className="lg:col-span-1">
                  <section className="bg-white rounded-xl shadow-md p-8">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-6">Rendez-vous</h3>
                    <div className="border-b border-gray-200 mb-4">
                        <nav className="-mb-px flex space-x-4 text-sm">
                            <button onClick={() => setActiveTab('pending')} className={`py-2 px-1 border-b-2 ${activeTab === 'pending' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                En attente ({pendingAppointments.length})
                            </button>
                            <button onClick={() => setActiveTab('confirmed')} className={`py-2 px-1 border-b-2 ${activeTab === 'confirmed' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                Confirmés ({confirmedAppointments.length})
                            </button>
                            <button onClick={() => setActiveTab('past')} className={`py-2 px-1 border-b-2 ${activeTab === 'past' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                Historique
                            </button>
                        </nav>
                    </div>
                    <div className="space-y-4">
                        {activeTab === 'pending' && renderAppointmentsList(pendingAppointments, 'pending')}
                        {activeTab === 'confirmed' && renderAppointmentsList(confirmedAppointments, 'confirmed')}
                        {activeTab === 'past' && renderAppointmentsList(pastAppointments, 'past')}
                    </div>
                  </section>
              </div>
       </div>
    </div>
    </>
  );
}

export default ProsPage;