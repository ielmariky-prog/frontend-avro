"use client";

import { useState } from 'react';

export default function Home() {
  // --- STATES ---
  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState(""); // Aperçu du JSON à gauche
  const [messageServeur, setMessageServeur] = useState("");
  const [isError, setIsError] = useState(false);
  
  const [generatedFiles, setGeneratedFiles] = useState([]); // Liste des noms de fichiers (.java)
  const [selectedCode, setSelectedCode] = useState(""); // Contenu de la classe cliquée
  const [loadingCode, setLoadingCode] = useState(false);

  // --- FONCTIONS ---

  // 1. Gérer la sélection du fichier et l'aperçu local
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setGeneratedFiles([]); // On vide la liste précédente
    setSelectedCode("");   // On vide le code précédent
    setMessageServeur("");

    const reader = new FileReader();
    reader.onload = (event) => {
      setFileContent(event.target.result);
    };
    reader.readAsText(selectedFile);
  };

  // 2. Envoyer au Backend pour générer les classes
  const envoyerAuServeur = async () => {
    if (!file) {
      alert("Sélectionnez un fichier d'abord !");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const reponse = await fetch("http://localhost:8080/api/avro/generate", { 
        method: "POST",
        body: formData,
      });

      if (reponse.ok) {
        const listeDesFichiers = await reponse.json(); // On attend une liste de String ["User.java", ...]
        setGeneratedFiles(listeDesFichiers);
        setIsError(false);
        setMessageServeur(`${listeDesFichiers.length} classes générées avec succès !`);
      } else {
        const erreur = await reponse.text();
        setIsError(true);
        setMessageServeur("Erreur : " + erreur);
      }
    } catch (error) {
      setIsError(true);
      setMessageServeur("Impossible de contacter le serveur Spring Boot.");
    }
  };

  // 3. Récupérer le contenu d'une classe Java spécifique
  const chargerContenuClasse = async (fileName) => {
    setLoadingCode(true);
    try {
      const reponse = await fetch(`http://localhost:8080/api/avro/content?fileName=${fileName}`);
      const code = await reponse.text();
      setSelectedCode(code);
    } catch (error) {
      alert("Erreur lors de la lecture du fichier Java.");
    } finally {
      setLoadingCode(false);
    }
  };

  const telechargerZip = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/avro/download-zip");
    
      if (response.ok) {
        // Transformer la réponse en "Blob" (données binaires)
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
      
      // Créer un lien invisible pour forcer le téléchargement
        const a = document.createElement('a');
        a.href = url;
        a.download = "mes_classes_java.zip";
        document.body.appendChild(a);
        a.click();
        a.remove(); // Nettoyage
      } else {
        alert("Erreur lors de la préparation du ZIP");
      }
    } catch (error) {
      alert("Impossible de joindre le serveur");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-black font-sans">
      
      {/* --- PARTIE GAUCHE : IMPORT --- */}
      <div className="w-1/3 p-6 border-r-2 border-gray-200 flex flex-col bg-white shadow-sm">
        <h2 className="text-2xl font-bold mb-6 text-blue-700 flex items-center">
          <span className="mr-2">📥</span> 1. Entrée .avsc
        </h2>
        
        <input 
          type="file" 
          accept=".avsc"
          onChange={handleFileChange} 
          className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
        />

        {fileContent && (
          <div className="flex-1 flex flex-col min-h-0">
            <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Aperçu du schéma</p>
            <pre className="flex-1 bg-gray-900 text-blue-300 p-4 rounded-lg text-xs overflow-auto border border-gray-700 font-mono">
              {fileContent}
            </pre>
          </div>
        )}

        <button 
          onClick={envoyerAuServeur}
          className="w-full mt-4 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition shadow-md active:scale-95"
        >
          Générer les classes Java
        </button>
      </div>

      {/* --- PARTIE DROITE : EXPLORATEUR ET CODE --- */}
      <div className="w-2/3 flex flex-col">
        
        {/* Barre d'état en haut */}
        <div className={`p-4 border-b flex items-center justify-between ${isError ? 'bg-red-50' : 'bg-green-50'}`}>
           <span className={`font-medium ${isError ? 'text-red-700' : 'text-green-700'}`}>
             {messageServeur || "En attente d'un schéma Avro..."}
           </span>
        </div>

        <div className="flex flex-1 min-h-0">
          
          {/* Liste des fichiers générés */}
          <div className="w-1/4 border-r border-gray-200 p-4 overflow-y-auto bg-gray-50">
            <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase">Fichiers générés</h3>
            {generatedFiles.length === 0 && <p className="text-xs text-gray-400 italic">Aucun fichier</p>}
            {generatedFiles.map((name) => (
              <button
                key={name}
                onClick={() => chargerContenuClasse(name)}
                className={`block w-full text-left p-2 mb-1 rounded text-sm transition ${
                  selectedCode.includes(`class ${name.replace('.java','')}`) 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white border border-gray-200 hover:bg-blue-50 text-gray-700'
                }`}
              >
                📄 {name}
              </button>
            ))}
          </div>
          {/* Liste des fichiers générés */}
          <div className="w-1/4 border-r border-gray-200 p-4 overflow-y-auto bg-gray-50">
            <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase">Fichiers générés</h3>
            
            {/* --- LE BOUTON ZIP AJOUTÉ ICI --- */}
            {generatedFiles.length > 0 && (
              <button 
                onClick={telechargerZip}
                className="w-full mb-4 bg-green-600 text-white font-bold py-2 rounded-lg hover:bg-green-700 transition shadow-md flex items-center justify-center gap-2"
              >
                <span>📦</span> Télécharger ZIP
              </button>
            )}

            {generatedFiles.length === 0 && <p className="text-xs text-gray-400 italic">Aucun fichier</p>}
            
            {generatedFiles.map((name) => (
              <button
                key={name}
                onClick={() => chargerContenuClasse(name)}
                className={`block w-full text-left p-2 mb-1 rounded text-sm transition ${
                  selectedCode.includes(`class ${name.replace('.java','').split('/').pop()}`) 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white border border-gray-200 hover:bg-blue-50 text-gray-700'
                }`}
              >
                📄 {name}
              </button>
            ))}
          </div>

          {/* Visionneuse de code Java */}
          <div className="w-3/4 p-4 bg-white flex flex-col min-h-0">
            <div className="flex-1 bg-gray-900 rounded-xl p-6 overflow-auto border border-gray-800 relative">
              <div className="absolute top-3 right-5 text-gray-600 text-xs font-mono uppercase tracking-tighter">Java Output</div>
              {loadingCode ? (
                <div className="text-blue-400 animate-pulse font-mono">Chargement du code...</div>
              ) : (
                <pre className="text-sm text-green-400 font-mono leading-relaxed">
                  {selectedCode || "// Sélectionnez une classe à gauche pour visualiser son contenu"}
                </pre>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}