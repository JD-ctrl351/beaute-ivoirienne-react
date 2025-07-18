import React from 'react';

function TermsPage() {
  return (
    <div className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
            Conditions Générales de Vente
          </h1>
          <div className="prose max-w-none text-gray-700">
            <p className="text-sm text-gray-500">Dernière mise à jour : 18 juillet 2025</p>
            
            <h2 className="text-2xl font-semibold mt-6">Article 1 - Objet</h2>
            <p>
              Les présentes conditions régissent les ventes par la société Beauté Ivoirienne de services de mise en relation entre des professionnels de la beauté et des clients.
            </p>
            
            <h2 className="text-2xl font-semibold mt-6">Article 2 - Prix</h2>
            <p>
              L'utilisation des services de recherche et de réservation est gratuite pour les clients. Les prix des prestations des professionnels sont indiqués sur leurs profils respectifs en francs CFA (XOF).
            </p>

            <h2 className="text-2xl font-semibold mt-6">Article 3 - Rendez-vous</h2>
            <p>
                Beauté Ivoirienne agit en tant qu'intermédiaire. Le contrat de service est conclu directement entre le client et le professionnel. Beauté Ivoirienne ne peut être tenu responsable de la qualité de la prestation, des annulations ou de tout litige survenant entre le client et le professionnel.
            </p>
            
            <p className="font-bold mt-8 text-red-600">
                AVERTISSEMENT : Ce texte est un exemple générique et ne constitue pas un avis juridique. Vous devez le remplacer par vos propres conditions générales.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TermsPage;