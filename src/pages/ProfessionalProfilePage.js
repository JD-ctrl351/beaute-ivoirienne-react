import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from '../context/AuthContext';

const dayNames = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

function ProfessionalProfilePage() {
  const { id } = useParams();
  const { currentUser } = useContext(AuthContext);

  const [professional, setProfessional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [viewedDate, setViewedDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchProfessional = async () => {
      setLoading(true);
      setSelectedService(null);
      try {
        const docRef = doc(db, "professionals", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfessional({ id: docSnap.id, ...docSnap.data() });
        } else {
          setProfessional(null);
        }
      } catch (error) {
        console.error("Erreur de chargement du profil:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfessional();
  }, [id]);

  // --- LA FONCTION CORRIGÉE ET INTELLIGENTE ---
  const handleDayClick = async (day) => {
    setIsBookingLoading(true);
    const date = new Date(viewedDate.getFullYear(), viewedDate.getMonth(), day);
    setSelectedDay(date);
    setSelectedTime(null);
    try {
      const dayName = dayNames[date.getDay()];
      const proAvailability = professional.availability?.[dayName];
      if (!proAvailability || !proAvailability.active) {
        setAvailableSlots([]);
        setIsBookingLoading(false);
        return;
      }
      
      const q = query(collection(db, "appointments"), 
        where("professionalId", "==", id), 
        where("date", "==", date.toISOString().split('T')[0]),
        where("status", "==", "confirmé") // On ne bloque que les créneaux confirmés
      );
      const querySnapshot = await getDocs(q);
      const bookedAppointments = querySnapshot.docs.map(doc => doc.data());

      const slots = [];
      const serviceDuration = selectedService.duration;
      let potentialSlotTime = new Date(`${date.toDateString()} ${proAvailability.start}`);
      const endTime = new Date(`${date.toDateString()} ${proAvailability.end}`);
      
      while (potentialSlotTime.getTime() + serviceDuration * 60000 <= endTime.getTime()) {
        const potentialSlotEnd = new Date(potentialSlotTime.getTime() + serviceDuration * 60000);
        let isOverlapping = false;
        
        for (const rdv of bookedAppointments) {
            const rdvStart = new Date(`${date.toDateString()} ${rdv.time}`);
            const rdvEnd = new Date(rdvStart.getTime() + rdv.serviceDuration * 60000);
            
            // Condition de chevauchement : [start1, end1) et [start2, end2)
            // C'est le cas si start1 < end2 ET start2 < end1
            if (potentialSlotTime < rdvEnd && rdvStart < potentialSlotEnd) {
                isOverlapping = true;
                break;
            }
        }

        if (!isOverlapping) {
            slots.push(potentialSlotTime.toTimeString().substring(0, 5));
        }
        
        // On avance au prochain créneau possible (toutes les 15 minutes)
        potentialSlotTime.setMinutes(potentialSlotTime.getMinutes() + 15);
      }
      setAvailableSlots(slots);

    } catch (error) {
      console.error("Erreur de calcul des créneaux:", error);
    } finally {
      setIsBookingLoading(false);
    }
  };

  const handleBookingSubmit = async () => {
    if (!currentUser) { alert("Vous devez être connecté."); return; }
    if (!selectedDay || !selectedTime || !selectedService) { alert("Veuillez sélectionner un service, une date et un créneau."); return; }
    
    const newAppointment = {
      clientId: currentUser.uid,
      clientEmail: currentUser.email,
      professionalId: id,
      professionalName: professional.name,
      date: selectedDay.toISOString().split('T')[0],
      time: selectedTime,
      serviceName: selectedService.name,
      serviceDuration: selectedService.duration,
      servicePrice: selectedService.price,
      status: 'en attente',
      createdAt: new Date(),
    };
    try {
      await addDoc(collection(db, "appointments"), newAppointment);
      alert(`Votre demande de rendez-vous a bien été envoyée !`);
      setSelectedService(null);
      setSelectedDay(null);
      setSelectedTime(null);
    } catch (error) {
      console.error("Erreur lors de la prise de RDV:", error);
      alert("Une erreur est survenue.");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0 || comment.trim() === '') {
      alert("Veuillez donner une note et un commentaire.");
      return;
    }
    const newReview = {
      authorId: currentUser.uid,
      authorEmail: currentUser.email,
      rating: rating,
      comment: comment,
      date: new Date().toISOString(),
    };
    try {
      const docRef = doc(db, "professionals", id);
      await updateDoc(docRef, { reviews: arrayUnion(newReview) });
      setProfessional(prev => ({ ...prev, reviews: [...(prev.reviews || []), newReview] }));
      setRating(0);
      setComment('');
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'avis:", error);
      alert("Une erreur est survenue.");
    }
  };

  const renderCalendar = () => {
    const year = viewedDate.getFullYear();
    const month = viewedDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0,0,0,0);

    const days = [];
    for (let i = 0; i < (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1); i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dayName = dayNames[currentDate.getDay()];
      const isAvailable = professional.availability?.[dayName]?.active && currentDate >= today;
      const isSelected = selectedDay?.getTime() === currentDate.getTime();
      days.push(
        <button key={day} disabled={!isAvailable} onClick={() => handleDayClick(day)} className={`p-2 border rounded-full text-center transition ${isSelected ? 'bg-orange-500 text-white font-bold' : isAvailable ? 'cursor-pointer hover:bg-orange-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
          {day}
        </button>
      );
    }
    return days;
  };

  if (loading) return <div className="text-center py-16">Chargement du profil...</div>;
  if (!professional) return <div className="text-center py-16 text-red-500">Oups ! Profil non trouvé.</div>;

  const avatarUrl = professional.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(professional.name)}&background=ffedd5&color=f97316&size=128&bold=true`;

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-4xl mx-auto">
        <div className="bg-gray-100 p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center">
            <img src={avatarUrl} alt={`Avatar de ${professional.name}`} className="w-32 h-32 rounded-full border-4 border-white shadow-md" />
            <div className="mt-4 md:mt-0 md:ml-6">
              <h1 className="text-4xl font-bold text-gray-900">{professional.name}</h1>
              <p className="text-xl text-orange-500 font-semibold mt-1">{professional.domain || 'Non spécifié'}</p>
              <p className="text-md text-gray-600 mt-2"><i className="fas fa-map-marker-alt mr-2 text-gray-400"></i>{professional.commune || 'Non spécifiée'}</p>
            </div>
          </div>
        </div>
        <div className="p-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">À propos</h2>
            <p className="text-gray-700 leading-relaxed">{professional.description || 'Aucune description fournie.'}</p>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Nos Prestations</h2>
            <div className="space-y-4">
              {professional.services && professional.services.length > 0 ? (
                professional.services.map(service => (
                  <div key={service.id} className={`p-4 border rounded-lg transition-all ${selectedService?.id === service.id ? 'bg-orange-50 border-orange-300' : ''}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-lg">{service.name}</h4>
                        <p className="text-sm text-gray-500">{service.duration} minutes</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">{service.price} XOF</p>
                        <button onClick={() => setSelectedService(service)} className="mt-1 bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold hover:bg-orange-600">Choisir</button>
                      </div>
                    </div>
                  </div>
                ))
              ) : ( <p className="text-gray-500">Ce professionnel n'a pas encore ajouté de services.</p> )}
            </div>
          </div>

          {selectedService && currentUser && currentUser.uid !== professional.id && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Choisissez une date et un créneau pour : <span className="text-orange-600">{selectedService.name}</span></h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setViewedDate(new Date(viewedDate.setMonth(viewedDate.getMonth() - 1)))} className="p-2 rounded-full hover:bg-gray-200">‹</button>
                    <h4 className="text-lg font-semibold capitalize">{viewedDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</h4>
                    <button onClick={() => setViewedDate(new Date(viewedDate.setMonth(viewedDate.getMonth() + 1)))} className="p-2 rounded-full hover:bg-gray-200">›</button>
                  </div>
                  <div className="grid grid-cols-7 text-center text-sm font-semibold text-gray-500 mb-2">
                    <div>L</div><div>M</div><div>M</div><div>J</div><div>V</div><div>S</div><div>D</div>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {renderCalendar()}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-4">Créneaux disponibles</h4>
                  {isBookingLoading ? <p>Calcul des créneaux...</p> : 
                   availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map(time => (<button key={time} onClick={() => setSelectedTime(time)} className={`p-2 rounded-lg border text-center transition ${selectedTime === time ? 'bg-orange-500 text-white' : 'hover:bg-orange-100'}`}>{time}</button>))}
                    </div>
                   ) : <p className="text-sm text-gray-400">Aucun créneau disponible pour cette date.</p>
                  }
                </div>
              </div>
              {selectedTime && (
                <div className="mt-6 text-center">
                   <button onClick={handleBookingSubmit} className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                     Confirmer le RDV pour le {selectedDay.toLocaleDateString('fr-FR')} à {selectedTime}
                   </button>
                </div>
              )}
            </div>
          )}
          {selectedService && !currentUser && ( <div className="text-center bg-gray-100 p-4 rounded-lg mt-4">Pour réserver, veuillez vous connecter.</div> )}
          
          <div className="mt-8 pt-6 border-t border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Avis des clients</h2>
              <div className="space-y-4">
                  {professional && professional.reviews && professional.reviews.length > 0 ? (
                    professional.reviews.map((review, index) => (
                      <div key={index} className="border-t py-4">
                        <div className="flex items-center justify-between">
                          <strong className="text-gray-800">{review.authorEmail}</strong>
                          <span className="text-sm">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                        </div>
                        <p className="text-gray-600 mt-2">{review.comment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">Soyez le premier à laisser un avis !</p>
                  )}
              </div>
          </div>
          {currentUser && currentUser.uid !== professional.id && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">Laissez votre avis</h2>
                  <form onSubmit={handleReviewSubmit} className="space-y-4 bg-gray-50 p-6 rounded-lg">
                    <div>
                      <label className="block text-gray-700 mb-1 font-semibold">Votre note</label>
                      <div className="flex space-x-1 text-2xl">
                        {[1, 2, 3, 4, 5].map(star => (
                          <span key={star} onClick={() => setRating(star)} className={`cursor-pointer ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="author-comment" className="block text-gray-700 mb-1 font-semibold">Votre commentaire</label>
                      <textarea id="author-comment" rows="4" className="w-full px-3 py-2 border rounded-lg" value={comment} onChange={(e) => setComment(e.target.value)} required />
                    </div>
                    <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-colors">Envoyer mon avis</button>
                  </form>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default ProfessionalProfilePage;