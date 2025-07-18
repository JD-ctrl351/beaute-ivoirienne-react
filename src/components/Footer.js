import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          {/* Section Contact */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Contact</h3>
            <ul>
              <li className="mb-2">
                <a href="mailto:contact@beaute-ivoirienne.com" className="hover:text-orange-400 transition">contact@beaute-ivoirienne.com</a>
              </li>
              <li className="mb-2">
                <a href="tel:+2250102030405" className="hover:text-orange-400 transition">+225 01 02 03 04 05</a>
              </li>
              <li>
                <p>Abidjan, Côte d'Ivoire</p>
              </li>
            </ul>
          </div>

          {/* Section Navigation */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Navigation</h3>
            <ul>
              <li className="mb-2"><Link to="/liste-prestataires" className="hover:text-orange-400 transition">Trouver un prestataire</Link></li>
              <li className="mb-2"><Link to="/blog" className="hover:text-orange-400 transition">Conseils Beauté</Link></li>
              <li className="mb-2"><Link to="/a-propos" className="hover:text-orange-400 transition">À Propos de nous</Link></li>
              <li className="mb-2"><Link to="/prestataires" className="hover:text-orange-400 transition">Espace Pros</Link></li>
            </ul>
          </div>

          {/* Section Suivez-nous */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Suivez-nous</h3>
            <div className="flex justify-center md:justify-start space-x-4">
                <a href="#" className="hover:text-orange-400 transition text-2xl"><i className="fab fa-facebook"></i></a>
                <a href="#" className="hover:text-orange-400 transition text-2xl"><i className="fab fa-instagram"></i></a>
                <a href="#" className="hover:text-orange-400 transition text-2xl"><i className="fab fa-tiktok"></i></a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-500 text-sm">
            <p className="mb-4">&copy; 2025 Beauté Ivoirienne. Tous droits réservés.</p>
            <div className="flex justify-center space-x-4">
                <Link to="/cgv" className="hover:text-orange-400 transition">CGV</Link>
                <span>&middot;</span>
                <Link to="/politique-de-confidentialite" className="hover:text-orange-400 transition">Politique de Confidentialité</Link>
            </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;