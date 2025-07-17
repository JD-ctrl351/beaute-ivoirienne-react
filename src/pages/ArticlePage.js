import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

function ArticlePage() {
  const { slug } = useParams(); // Récupère le "slug" de l'article depuis l'URL
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        // Cherche dans la collection "articles" où le champ "slug" est égal au slug de l'URL
        const q = query(collection(db, "articles"), where("slug", "==", slug));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Si on trouve l'article, on le stocke
          setArticle(querySnapshot.docs[0].data());
        } else {
          setArticle(null); // Sinon, on met à null
        }
      } catch (error) {
        console.error("Erreur de chargement de l'article:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [slug]); // On relance la recherche si le slug dans l'URL change

  if (loading) return <div className="text-center py-16">Chargement de l'article...</div>;
  if (!article) return <div className="text-center py-16 text-red-500">Oups ! Article non trouvé.</div>;

  return (
    <main className="container mx-auto px-4 py-16">
      <article className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">{article.title}</h1>
        <p className="text-gray-500 mb-6">Par {article.author} - Publié le {new Date(article.date.seconds * 1000).toLocaleDateString('fr-FR')}</p>
        <div className="prose max-w-none">
          {/* On affiche le contenu complet de l'article */}
          <p>{article.content}</p>
        </div>
        <div className="mt-8 pt-6 border-t">
          <Link to="/blog" className="text-orange-500 hover:underline font-semibold">
            <i className="fas fa-arrow-left mr-2"></i>Retour à tous les articles
          </Link>
        </div>
      </article>
    </main>
  );
}

export default ArticlePage;