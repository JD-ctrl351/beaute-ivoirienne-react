import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from '../context/AuthContext'; // Importer le contexte d'authentification

function HomePage() {
  const { currentUser } = useContext(AuthContext); // Utiliser le contexte
  const [isProfessional, setIsProfessional] = useState(false);
  const [featured, setFeatured] = useState([]);
  const [latestArticles, setLatestArticles] = useState([]);
  const [latestReviews, setLatestReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchDomain, setSearchDomain] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHomepageData = async () => {
      try {
        // --- 1. Vérifier le rôle de l'utilisateur connecté ---
        if (currentUser) {
            const proDocSnap = await getDoc(doc(db, "professionals", currentUser.uid));
            if (proDocSnap.exists()) {
                setIsProfessional(true);
            }
        }

        // --- 2. Récupérer les professionnels à la une ---
        const professionalsRef = collection(db, 'professionals');
        const qPro = query(professionalsRef, where('verified', '==', true), limit(3));
        const proSnapshot = await getDocs(qPro);
        const featuredData = proSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFeatured(featuredData);

        // --- 3. Récupérer les derniers articles de blog ---
        const articlesRef = collection(db, 'articles');
        const qArt = query(articlesRef, limit(3)); // Limite à 3 articles
        const artSnapshot = await getDocs(qArt);
        const articlesData = artSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLatestArticles(articlesData);

        // --- 4. Récupérer les derniers avis (plus complexe) ---
        // On récupère quelques professionnels vérifiés avec des avis...
        const qReviewsPro = query(
            professionalsRef,
            where('verified', '==', true),
            limit(5) // On en prend un peu plus au cas où certains n'ont pas d'avis
        );
        const reviewsProSnapshot = await getDocs(qReviewsPro);
        const reviewsData = [];
        reviewsProSnapshot.docs.forEach(doc => {
            const pro = doc.data();
            if (pro.reviews && pro.reviews.length > 0) {
                // On prend le dernier avis de chaque professionnel
                const latestReview = pro.reviews[pro.reviews.length - 1];
                reviewsData.push({
                    ...latestReview,
                    proName: pro.name,
                    proId: doc.id
                });
            }
        });
        // On garde les 3 plus récents
        setLatestReviews(reviewsData.slice(0, 3));

      } catch (error) {
        console.error("Erreur lors de la récupération des données de la page d'accueil:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHomepageData();
  }, [currentUser]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/liste-prestataires?domaine=${searchDomain}&commune=${searchLocation}`);
  };

  // --- NOUVELLE FONCTION POUR LE BOUTON D'ACTION INTELLIGENT ---
  const renderCallToAction = () => {
      if (!currentUser) {
          return (
            <>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Vous êtes un professionnel de la beauté ?</h2>
                <p className="text-gray-600 max-w-2xl mx-auto mb-8">Rejoignez notre réseau, gagnez en visibilité et simplifiez la gestion de vos rendez-vous.</p>
                <Link to="/prestataires" className="inline-block bg-gray-800 hover:bg-black text-white px-8 py-3 rounded-full transition shadow-md font-semibold">
                    Découvrir l'Espace Pro
                </Link>
            </>
          );
      }
      if (isProfessional) {
           return (
            <>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Votre Espace Professionnel</h2>
                <p className="text-gray-600 max-w-2xl mx-auto mb-8">Gérez vos informations, vos services, vos disponibilités et vos rendez-vous en un seul endroit.</p>
                <Link to="/prestataires" className="inline-block bg-gray-800 hover:bg-black text-white px-8 py-3 rounded-full transition shadow-md font-semibold">
                    Accéder à mon tableau de bord
                </Link>
            </>
          );
      }
      // Si c'est un client, on peut l'inviter à voir ses RDV ou ne rien afficher.
      // Pour l'instant, ne rien afficher est plus simple.
      return null;
  }


  return (
    <>
      <section className="bg-gradient-to-r from-orange-100 to-yellow-100 py-20 text-center md:text-left">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between z-10 relative">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 leading-tight">La beauté ivoirienne à portée de clic</h2>
            <p className="text-lg text-gray-700 mb-8 max-w-lg mx-auto md:mx-0">Trouvez et réservez instantanément avec les meilleurs talents de la coiffure, de l'esthétique et du bien-être en Côte d'Ivoire.</p>

            <form onSubmit={handleSearchSubmit} className="mt-8 bg-white p-4 rounded-lg shadow-lg flex flex-col sm:flex-row items-center gap-2 max-w-lg mx-auto md:mx-0">
                <div className="flex-1 w-full">
                    <label htmlFor="search-domain" className="sr-only">Service</label>
                    <select
                        id="search-domain"
                        value={searchDomain}
                        onChange={(e) => setSearchDomain(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Quel service ?</option>
                      <option value="Coiffure">Coiffure</option>
                      <option value="Esthétique">Esthétique</option>
                      <option value="Onglerie">Onglerie</option>
                      <option value="Maquillage">Maquillage</option>
                      <option value="Spa">Spa & Massages</option>
                    </select>
                </div>
                 <div className="flex-1 w-full">
                    <label htmlFor="search-location" className="sr-only">Commune</label>
                    <select
                        id="search-location"
                        value={searchLocation}
                        onChange={(e) => setSearchLocation(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Où ? (toutes communes)</option>
                      <option value="Abobo">Abobo</option>
                      <option value="Adjamé">Adjamé</option>
                      <option value="Cocody">Cocody</option>
                      <option value="Koumassi">Koumassi</option>
                      <option value="Marcory">Marcory</option>
                      <option value="Port-Bouët">Port-Bouët</option>
                      <option value="Treichville">Treichville</option>
                      <option value="Yopougon">Yopougon</option>
                    </select>
                </div>
                <button type="submit" className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-md transition shadow-md font-semibold">
                    Rechercher
                </button>
            </form>
          </div>
          <div className="hidden md:flex md:w-1/2 justify-center">
            <img src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=2070&auto=format&fit=crop" alt="Salon de beauté ivoirien" className="rounded-lg shadow-xl w-full max-w-md" />
          </div>
        </div>
      </section>

      <section id="featured" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Nos Professionnels à la Une</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Découvrez une sélection de nos talents vérifiés.</p>
          </div>
          {loading ? (
            <p className="text-center">Chargement...</p>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featured.map(pro => (
                <div key={pro.id} className="bg-gray-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow flex flex-col">
                    <div className="flex-grow">
                        <div className="flex items-center mb-4">
                            <img
                            src={pro.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(pro.name)}&background=ffedd5&color=f97316&size=128&bold=true`}
                            alt={`Avatar de ${pro.name}`}
                            className="w-16 h-16 rounded-full mr-4"
                            />
                            <div>
                            <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                                {pro.name}
                                {pro.verified && (
                                    <span className="ml-2 text-xs bg-green-100 text-green-800 font-bold px-2 py-1 rounded-full">
                                    ✔
                                    </span>
                                )}
                            </h3>
                            <p className="text-sm text-gray-500">{pro.domain}</p>
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{pro.description || 'Aucune description.'}</p>
                    </div>
                    <Link to={`/prestataire/${pro.id}`} className="mt-auto text-center w-full bg-orange-500 text-white py-2.5 rounded-lg hover:bg-orange-600 transition-colors font-semibold">
                        Voir le profil
                    </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">Aucun professionnel vérifié à afficher pour le moment.</p>
          )}
        </div>
      </section>

      <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">Comment ça marche ?</h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">Réservez votre prochain soin en trois étapes simples.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                  <div className="flex flex-col items-center">
                      <div className="bg-orange-500 text-white rounded-full w-20 h-20 flex items-center justify-center text-3xl font-bold mb-4">1</div>
                      <h3 className="text-xl font-semibold mb-2">Découvrez</h3>
                      <p className="text-gray-600">Parcourez les profils, consultez les galeries et lisez les avis pour trouver le professionnel qui vous correspond.</p>
                  </div>
                   <div className="flex flex-col items-center">
                      <div className="bg-orange-500 text-white rounded-full w-20 h-20 flex items-center justify-center text-3xl font-bold mb-4">2</div>
                      <h3 className="text-xl font-semibold mb-2">Réservez</h3>
                      <p className="text-gray-600">Choisissez une prestation, consultez les disponibilités et réservez le créneau qui vous arrange en un clic.</p>
                  </div>
                   <div className="flex flex-col items-center">
                      <div className="bg-orange-500 text-white rounded-full w-20 h-20 flex items-center justify-center text-3xl font-bold mb-4">3</div>
                      <h3 className="text-xl font-semibold mb-2">Sublimez</h3>
                      <p className="text-gray-600">Rendez-vous à votre séance et laissez nos experts prendre soin de vous. C'est aussi simple que ça !</p>
                  </div>
              </div>
          </div>
      </section>

      {/* 👇 NOUVELLE SECTION "AVIS RÉCENTS" 👇 */}
      {latestReviews.length > 0 && (
        <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">La voix des clients</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {latestReviews.map((review, index) => (
                        <div key={index} className="bg-gray-50 p-6 rounded-lg">
                            <p className="text-gray-600 italic">"{review.comment}"</p>
                            <p className="text-right mt-4 font-semibold text-gray-800">- {review.authorEmail.split('@')[0]}</p>
                            <p className="text-right text-sm text-orange-500">chez <Link to={`/prestataire/${review.proId}`} className="hover:underline">{review.proName}</Link></p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
      )}

      {/* 👇 NOUVELLE SECTION "BLOG" 👇 */}
      {latestArticles.length > 0 && (
         <section className="py-16 bg-gray-50 border-t">
            <div className="container mx-auto px-4">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">Nos derniers conseils</h2>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     {latestArticles.map(article => (
                         <div key={article.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                             {/* Vous pouvez ajouter une image ici plus tard si vos articles en ont */}
                             <div className="p-6">
                                 <h3 className="font-bold text-lg mb-2">{article.title}</h3>
                                 <p className="text-gray-600 text-sm mb-4">{article.excerpt}</p>
                                 <Link to={`/blog/${article.slug}`} className="font-semibold text-orange-500 hover:underline">Lire la suite →</Link>
                             </div>
                         </div>
                     ))}
                 </div>
            </div>
         </section>
      )}


      <section className="py-16 bg-orange-50">
         <div className="container mx-auto px-4 text-center">
             {/* 👇 BOUTON D'ACTION INTELLIGENT 👇 */}
             {renderCallToAction()}
         </div>
      </section>
    </>
  );
}

export default HomePage;