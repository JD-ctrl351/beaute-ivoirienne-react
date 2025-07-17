import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';

function BlogPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("1. Lancement du chargement des articles..."); // LIGNE ESPIONNE 1

    const fetchArticles = async () => {
      try {
        const articlesRef = collection(db, 'articles');
        const q = query(articlesRef, orderBy('date', 'desc'));

        console.log("2. Envoi de la requête à Firebase..."); // LIGNE ESPIONNE 2
        const querySnapshot = await getDocs(q);

        console.log("3. Réponse reçue ! Nombre d'articles trouvés :", querySnapshot.size); // LIGNE ESPIONNE 3

        const articlesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setArticles(articlesData);

      } catch (error) {
        console.error("4. UNE ERREUR EST SURVENUE :", error); // LIGNE ESPIONNE 4
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  if (loading) return <div className="text-center py-16">Chargement des articles...</div>;

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">Nos Conseils Beauté</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">Découvrez les astuces et tendances de nos experts.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map(article => (
          <div key={article.id} className="bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden">
            <div className="p-6 flex-grow">
              <p className="text-sm text-gray-500 mb-2">{article.author} - {new Date(article.date.seconds * 1000).toLocaleDateString('fr-FR')}</p>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">{article.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{article.excerpt}</p>
            </div>
            <div className="bg-gray-50 p-4">
              <Link to={`/blog/${article.slug}`} className="text-center w-full text-orange-500 font-semibold hover:underline">
                Lire la suite <i className="fas fa-arrow-right ml-1"></i>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BlogPage;