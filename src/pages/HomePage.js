import React from 'react';

function HomePage() {
  return (
    <>
      <section className="bg-gradient-to-r from-orange-100 to-yellow-100 py-20 text-center md:text-left">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between z-10 relative">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 leading-tight">La beauté ivoirienne à portée de clic</h2>
            <p className="text-lg text-gray-700 mb-8 max-w-md mx-auto md:mx-0">Découvrez les meilleurs talents de la coiffure, esthétique et bien-être en Côte d'Ivoire.</p>
            {/* Les boutons seront reconnectés plus tard si besoin */}
          </div>
          <div className="md:w-1/2 flex justify-center">
            <img src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=2070&auto=format&fit=crop" alt="Salon de beauté ivoirien" className="rounded-lg shadow-xl w-full max-w-md" />
          </div>
        </div>
      </section>
      <section id="services" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Nos Catégories de Services</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Explorez tout ce que nos professionnels ont à offrir.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"><div className="flex items-center mb-4"><i className="fas fa-cut text-3xl text-orange-500"></i><h3 className="text-xl font-semibold ml-4">Coiffure</h3></div><p className="text-gray-600">Coupes, tresses, tissages, colorations et soins capillaires sur mesure.</p></div>
            <div className="bg-gray-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"><div className="flex items-center mb-4"><i className="fas fa-spa text-3xl text-orange-500"></i><h3 className="text-xl font-semibold ml-4">Soins & Esthétique</h3></div><p className="text-gray-600">Soins du visage et du corps, gommages et épilation pour une peau éclatante.</p></div>
            <div className="bg-gray-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"><div className="flex items-center mb-4"><i className="fas fa-hand-sparkles text-3xl text-orange-500"></i><h3 className="text-xl font-semibold ml-4">Onglerie</h3></div><p className="text-gray-600">Manucure, pédicure, pose de gel, résine et nail art pour des mains parfaites.</p></div>
          </div>
        </div>
      </section>
    </>
  );
}

export default HomePage;