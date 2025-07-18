import React from 'react';

function PrivacyPolicyPage() {
  return (
    <div className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
            Politique de Confidentialité
          </h1>
          <div className="prose max-w-none text-gray-700">
            <p className="text-sm text-gray-500">Dernière mise à jour : 18 juillet 2025</p>
            <p>
              Bienvenue sur Beauté Ivoirienne. Votre vie privée est importante pour nous. Cette politique de confidentialité explique comment nous collectons, utilisons, divulguons et protégeons vos informations lorsque vous utilisez notre site web.
            </p>

            <h2 className="text-2xl font-semibold mt-6">1. Collecte des informations</h2>
            <p>
              Nous collectons des informations lorsque vous vous inscrivez sur notre site, prenez un rendez-vous ou remplissez un formulaire. Les informations collectées incluent votre nom, votre adresse e-mail et les détails de vos rendez-vous.
            </p>

            <h2 className="text-2xl font-semibold mt-6">2. Utilisation des informations</h2>
            <p>
              Toutes les informations que nous recueillons auprès de vous peuvent être utilisées pour :
            </p>
            <ul>
                <li>Personnaliser votre expérience et répondre à vos besoins individuels</li>
                <li>Fournir un contenu publicitaire personnalisé</li>
                <li>Améliorer notre site</li>
                <li>Faciliter la prise de rendez-vous et la communication avec les professionnels</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-6">3. Confidentialité</h2>
            <p>
              Nous sommes les seuls propriétaires des informations recueillies sur ce site. Vos informations personnelles ne seront pas vendues, échangées, transférées, ou données à une autre société sans votre consentement, en dehors de ce qui est nécessaire pour répondre à une demande (par exemple, transmettre les détails d'un rendez-vous au professionnel concerné).
            </p>
            
            <h2 className="text-2xl font-semibold mt-6">4. Consentement</h2>
            <p>
                En utilisant notre site, vous consentez à notre politique de confidentialité.
            </p>

             <p className="font-bold mt-8 text-red-600">
                AVERTISSEMENT : Ce texte est un exemple générique et ne constitue pas un avis juridique. Vous devez le remplacer par votre propre politique de confidentialité.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicyPage;