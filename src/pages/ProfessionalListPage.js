import React, { useState, useEffect } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase';
import { Link, useLocation } from 'react-router-dom';

function ProfessionalListPage() {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const [nameFilter, setNameFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState(queryParams.get('domaine') || '');
  const [locationFilter, setLocationFilter] = useState(queryParams.get('commune') || '');


  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "professionals"));
        const allProsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // On filtre pour retirer les admins ET les comptes désactivés
        const regularProsData = allProsData.filter(pro => !pro.isAdmin && !pro.isDisabled);

        setProfessionals(regularProsData);
      } catch (error) {
        console.error("Erreur de chargement des prestataires: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionals();
  }, []);

  const filteredProfessionals = professionals.filter(pro => {
    return (
      pro.name.toLowerCase().includes(nameFilter.toLowerCase()) &&
      (domainFilter === '' || pro.domain === domainFilter) &&
      (locationFilter === '' || pro.commune === locationFilter)
    );
  });

  if (loading) {
    return <div className="container mx-auto px-4 py-16 text-center">Chargement des prestataires...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 container mx-auto my-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Trouver le Professionnel Idéal</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">Recherchez par nom, domaine d'expertise ou commune.</p>
      </div>

      <div className="mb-8 p-4 bg-gray-100 rounded-lg shadow-inner">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="filter-name" className="block text-gray-700 mb-2">Nom du prestataire</label>
            <input
              type="text"
              id="filter-name"
              placeholder="Ex: Salon Lumière d'Afrique"
              className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="filter-domain" className="block text-gray-700 mb-2">Domaine</label>
            <select
              id="filter-domain"
              className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
            >
              <option value="">Tous</option>
              <option value="Coiffure">Coiffure</option>
              <option value="Esthétique">Esthétique</option>
              <option value="Onglerie">Onglerie</option>
              <option value="Maquillage">Maquillage</option>
              <option value="Spa">Spa & Massages</option>
            </select>
          </div>
          <div>
            <label htmlFor="filter-location" className="block text-gray-700 mb-2">Commune</label>
            <select
              id="filter-location"
              className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            >
              <option value="">Toutes</option>
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
        </div>
      </div>

      <div id="professional-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfessionals.map(pro => (
          <div key={pro.id} className="bg-gray-50 rounded-xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
            <div className="flex-grow">
              <div className="flex items-center mb-4">
                <img
                  src={pro.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(pro.name)}&background=ffedd5&color=f97316&size=128&bold=true`}
                  alt={`Avatar de ${pro.name}`}
                  className="w-16 h-16 rounded-full mr-4 object-cover"
                />
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                    {pro.name}
                    {pro.verified && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 font-bold px-2 py-1 rounded-full">
                        ✔ Vérifié
                      </span>
                    )}
                  </h3>
                </div>
              </div>
              <p className="text-orange-500 font-medium mb-3">
                <i className="fas fa-briefcase mr-2 opacity-70"></i>{pro.domain || 'Non spécifié'}
              </p>
              <p className="text-gray-500 font-medium mb-4">
                <i className="fas fa-map-marker-alt mr-2 opacity-70"></i>{pro.commune || 'Non spécifiée'}
              </p>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{pro.description || 'Aucune description.'}</p>
            </div>
            <Link to={`/prestataire/${pro.id}`} className="mt-auto text-center w-full bg-orange-500 text-white py-2.5 rounded-lg hover:bg-orange-600 transition-colors font-semibold">
              Voir le profil <i className="fas fa-arrow-right ml-1"></i>
            </Link>
          </div>
        ))}
      </div>

      {filteredProfessionals.length === 0 && (
        <div className="text-center text-gray-600 mt-8">
            <i className="fas fa-search fa-2x mb-4 text-gray-400"></i>
            <p>Aucun prestataire ne correspond à votre recherche.</p>
        </div>
      )}

    </div>
  );
}

export default ProfessionalListPage;