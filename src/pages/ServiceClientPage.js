import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, orderBy, updateDoc, deleteField } from 'firebase/firestore';
import ChatWindow from '../components/ChatWindow';

// ✅ Mettez ici l'UID de votre Service Client
const SERVICE_CLIENT_UID = "ET79QIbEM9hDLDg80LYq9jhNbpy2";

function ServiceClientPage() {
  const { currentUser } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userNames, setUserNames] = useState({});
  const [error, setError] = useState('');
  const [allClients, setAllClients] = useState([]);
  const [allProfessionals, setAllProfessionals] = useState([]);
  const [verificationRequests, setVerificationRequests] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      // Requête pour les demandes de vérification en attente
      const requestsQuery = query(
        collection(db, "professionals"),
        where("verificationRequested", "==", true),
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      setVerificationRequests(requestsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

      // Requête pour tous les clients
      const clientsQuery = query(collection(db, "clients"), orderBy("name"));
      const clientsSnapshot = await getDocs(clientsQuery);
      setAllClients(clientsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

      // Requête pour tous les professionnels
      const professionalsQuery = query(collection(db, "professionals"), orderBy("name"));
      const professionalsSnapshot = await getDocs(professionalsQuery);
      setAllProfessionals(professionalsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

    } catch (err) {
      console.error("Erreur de chargement des données admin:", err);
      setError("Impossible de charger les données d'administration.");
    }
  };

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    
    // Sécurité : Seul le service client peut accéder à cette page
    if (currentUser.uid !== SERVICE_CLIENT_UID) {
      setError("Accès non autorisé.");
      setLoading(false);
      navigate('/'); // Redirection vers l'accueil
      return;
    }

    fetchData();

    // Logique pour la messagerie...
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      setLoading(true);
      try {
        let convos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        convos.sort((a, b) => (b.lastMessageTimestamp?.toDate() || 0) - (a.lastMessageTimestamp?.toDate() || 0));
        
        const namesToFetch = new Set();
        const currentNames = {};
        convos.forEach(convo => {
          if (convo.participantNames) Object.assign(currentNames, convo.participantNames);
          convo.participants.forEach(id => { if (!currentNames[id]) namesToFetch.add(id); });
        });

        for (const userId of namesToFetch) {
          if (userNames[userId]) {
            currentNames[userId] = userNames[userId];
            continue;
          }
          let userDoc = await getDoc(doc(db, 'clients', userId));
          if (userDoc.exists()) {
            currentNames[userId] = userDoc.data().name;
          } else {
            userDoc = await getDoc(doc(db, 'professionals', userId));
            if (userDoc.exists()) currentNames[userId] = userDoc.data().name;
          }
        }
        setUserNames(currentNames);
        setConversations(convos);

        const params = new URLSearchParams(location.search);
        const activeId = params.get('id');
        if (activeId) {
          const foundConvo = convos.find(c => c.id === activeId);
          if (foundConvo) setActiveConversation(foundConvo);
        } else if (convos.length > 0) {
          setActiveConversation(convos[0]);
        }
      } catch(e) {
        console.error("Erreur useEffect:", e);
        setError("Erreur lors de la récupération des conversations.");
      } finally {
        setLoading(false);
      }
    }, (err) => {
      console.error("Erreur onSnapshot:", err);
      setError("Impossible de charger les conversations.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, navigate]);

  const handleApproveVerification = async (proId) => {
    if (!window.confirm("Voulez-vous vraiment approuver ce professionnel ? Il recevra le badge 'Vérifié'.")) return;
    const proDocRef = doc(db, "professionals", proId);
    try {
      await updateDoc(proDocRef, {
        verified: true,
        verificationRequested: deleteField() // Supprime le champ de demande
      });
      alert("Professionnel approuvé avec succès !");
      fetchData(); // Rafraîchir les données
    } catch (error) {
      console.error("Erreur lors de l'approbation :", error);
      alert("Une erreur est survenue lors de l'approbation.");
    }
  };
  
  const handleRefuseVerification = async (proId) => {
    const reason = prompt("Veuillez indiquer la raison du refus (optionnel). Cette information n'est pas envoyée au professionnel pour le moment.");
    // Si l'admin clique sur "Annuler", la raison sera `null`. On arrête tout.
    if (reason === null) return;
    
    const proDocRef = doc(db, "professionals", proId);
    try {
      await updateDoc(proDocRef, {
        verificationRequested: deleteField(), // Supprime le champ de demande
        // On pourrait ajouter un champ `verificationStatus: 'refused'` si on voulait garder une trace
      });
      alert("La demande de vérification a été refusée.");
      fetchData(); // Rafraîchir les données
    } catch (error) {
      console.error("Erreur lors du refus :", error);
      alert("Une erreur est survenue lors du refus.");
    }
  };
  
  const handleToggleAccountStatus = async (userId, userType, isDisabled) => {
    const action = isDisabled ? "réactiver" : "désactiver";
    if (!window.confirm(`Voulez-vous vraiment ${action} ce compte ?`)) return;

    const collectionName = userType === 'client' ? 'clients' : 'professionals';
    const userDocRef = doc(db, collectionName, userId);

    try {
      await updateDoc(userDocRef, { isDisabled: !isDisabled });
      alert(`Le compte a été ${action} avec succès.`);
      fetchData(); // Rafraîchir les données
    } catch (error) {
      console.error(`Erreur lors de la tentative de ${action} le compte:`, error);
      alert("Une erreur est survenue.");
    }
  };

  const handleConversationSelect = (convo) => {
    setActiveConversation(convo);
    navigate(`/service-client-dashboard?id=${convo.id}`);
  };

  if (loading) return <div className="text-center py-16">Chargement du dashboard...</div>;
  if (error) return <div className="text-center py-16 text-red-500">{error}</div>;
  if (!currentUser) return null;

  return (
    <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Service Client</h1>

        {verificationRequests.length > 0 && (
          <section className="bg-blue-50 border-2 border-blue-200 rounded-xl shadow-md p-8 mb-8">
            <h3 className="text-2xl font-semibold text-blue-800 mb-6">Demandes de Vérification en Attente ({verificationRequests.length})</h3>
            <div className="space-y-4">
              {verificationRequests.map(pro => (
                <div key={pro.id} className="p-4 bg-white rounded-lg shadow">
                    <div className="flex items-start justify-between flex-wrap">
                        <div className="mb-2">
                            <Link to={`/prestataire/${pro.id}`} target="_blank" className="font-bold text-lg text-blue-600 hover:underline">{pro.name}</Link>
                            <p className="text-sm text-gray-600">{pro.email}</p>
                        </div>
                        <div className="flex space-x-2 flex-shrink-0">
                           <button onClick={() => handleRefuseVerification(pro.id)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded text-sm transition-colors">
                                Refuser
                           </button>
                           <button onClick={() => handleApproveVerification(pro.id)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded text-sm transition-colors">
                                Approuver
                           </button>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="font-semibold text-gray-700">Date de naissance:</p>
                            <p>{pro.dateOfBirth || "Non fourni"}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-700">Téléphone:</p>
                            <p>{pro.phoneNumber || "Non fourni"}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-700">Lien de preuve:</p>
                            {pro.proofLink ? (
                                <a href={pro.proofLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline block truncate">
                                    Consulter le lien <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                                </a>
                            ) : <p>Non fourni</p>}
                        </div>
                    </div>
                </div>
              ))}
            </div>
          </section>
        )}
        
        <section className="bg-white rounded-xl shadow-md p-8 mb-8">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">Gestion des Utilisateurs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h4 className="font-bold text-lg mb-2">Clients ({allClients.length})</h4>
                <div className="max-h-60 overflow-y-auto border rounded-lg p-2 bg-gray-50">
                {allClients.map(client => (
                    <div key={client.id} className="p-2 hover:bg-gray-100 rounded flex justify-between items-center">
                      <div>
                        <Link to={`/client/${client.id}`} className="text-blue-600 hover:underline">{client.name}</Link>
                        <span className={`text-sm ml-2 block ${client.isDisabled ? 'text-red-500' : 'text-gray-500'}`}>{client.email}</span>
                      </div>
                      <button 
                        onClick={() => handleToggleAccountStatus(client.id, 'client', client.isDisabled)}
                        className={`font-bold py-1 px-3 rounded text-xs text-white ${client.isDisabled ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                      >
                        {client.isDisabled ? 'Réactiver' : 'Désactiver'}
                      </button>
                    </div>
                ))}
                </div>
            </div>
            <div>
                <h4 className="font-bold text-lg mb-2">Professionnels ({allProfessionals.filter(pro => !pro.isAdmin).length})</h4>
                <div className="max-h-60 overflow-y-auto border rounded-lg p-2 bg-gray-50">
                {allProfessionals.filter(pro => !pro.isAdmin).map(pro => (
                    <div key={pro.id} className="p-2 hover:bg-gray-100 rounded flex justify-between items-center">
                       <div>
                        <Link to={`/prestataire/${pro.id}`} className="text-blue-600 hover:underline">{pro.name}</Link>
                        <span className={`text-sm ml-2 block ${pro.isDisabled ? 'text-red-500' : 'text-gray-500'}`}>{pro.email}</span>
                      </div>
                      <button 
                        onClick={() => handleToggleAccountStatus(pro.id, 'professional', pro.isDisabled)}
                        className={`font-bold py-1 px-3 rounded text-xs text-white ${pro.isDisabled ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                      >
                        {pro.isDisabled ? 'Réactiver' : 'Désactiver'}
                      </button>
                    </div>
                ))}
                </div>
            </div>
            </div>
        </section>

        <section className="flex h-[calc(100vh-250px)] border rounded-lg shadow-lg bg-white">
            <div className="w-full md:w-1/3 border-r bg-gray-50 overflow-y-auto">
                <div className="p-4 border-b"><h2 className="text-xl font-bold">Boîte de réception</h2></div>
                {conversations.length > 0 ? (
                <ul>
                    {conversations.map(convo => {
                        const otherParticipantId = convo.participants.find(id => id !== currentUser.uid);
                        const otherParticipantName = userNames[otherParticipantId] || '...';
                        return (
                        <li key={convo.id} className={`p-4 cursor-pointer hover:bg-gray-100 ${activeConversation?.id === convo.id ? 'bg-orange-100' : ''}`} onClick={() => handleConversationSelect(convo)}>
                            <p className="font-semibold">{otherParticipantName}</p>
                            <p className="text-sm text-gray-600 truncate">{convo.lastMessage || '...'}</p>
                        </li>
                        )
                    })}
                </ul>
                ) : ( <p className="p-4 text-gray-500">Aucune conversation.</p> )}
            </div>
            <div className="hidden md:flex w-2/3 flex-col">
                {activeConversation ? (
                <ChatWindow conversation={activeConversation} userNames={userNames} />
                ) : (
                <div className="flex-grow flex items-center justify-center"><p className="text-gray-500">Sélectionnez une conversation.</p></div>
                )}
            </div>
        </section>
    </div>
  );
}

export default ServiceClientPage;