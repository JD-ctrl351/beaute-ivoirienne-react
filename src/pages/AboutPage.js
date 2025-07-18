import React from 'react';

function AboutPage() {
  return (
    <div className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
            À Propos de Beauté Ivoirienne
          </h1>
          <div className="prose prose-lg max-w-none text-gray-700">
            <p>
              <strong>Notre Mission :</strong> "Remplacer ce texte par la mission de votre entreprise. Par exemple : Mettre en lumière les incroyables talents de la beauté en Côte d'Ivoire et permettre à chaque client de trouver et de réserver facilement des services de qualité en toute confiance."
            </p>
            <p>
              "Remplacer ce texte par l'histoire de votre projet. Comment l'idée est-elle née ? Quel problème cherchez-vous à résoudre ? Parlez de votre passion pour la beauté et l'artisanat local."
            </p>
            <h2 className="text-2xl font-semibold mt-8">Pourquoi nous existons</h2>
            <p>
              "Développez ici. Par exemple : Nous avons constaté qu'il était souvent difficile de trouver des informations fiables, des avis clients et des disponibilités pour les salons de coiffure et les instituts de beauté. Beauté Ivoirienne a été créé pour combler ce vide, en offrant une plateforme centralisée, moderne et simple d'utilisation pour les clients comme pour les professionnels."
            </p>
            <h2 className="text-2xl font-semibold mt-8">Notre Engagement</h2>
            <ul>
              <li><strong>Qualité :</strong> Nous nous engageons à ne présenter que des professionnels talentueux et vérifiés.</li>
              <li><strong>Simplicité :</strong> Une expérience de réservation fluide et sans tracas, accessible 24/7.</li>
              <li><strong>Communauté :</strong> Nous croyons en la force de la communauté et souhaitons créer un lien fort entre les artisans de la beauté et leurs clients.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;