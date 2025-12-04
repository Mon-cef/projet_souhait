// backend/index.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());

// --- SERVIR LE FRONTEND ---
app.use(express.static(path.join(__dirname, '../frontend')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// --- 1. INITIALISATION DE LA BASE DE DONNÉES ET DONNÉES INITIALES ---
const db = new sqlite3.Database('./souhaits.db', (err) => {
  if (err) {
    console.error('Erreur de connexion à la BDD:', err.message);
  } else {
    console.log('Connecté à la base de données SQLite "souhaits.db".');
  }
});

// Données par défaut extraites du document du projet (Vos souhaits)
const defaultWishes = [
    { titre: "Rédiger un journal intime", mois: "Janvier", description: "Commencer à écrire un journal pour mettre de l'ordre dans ses idées." },
    { titre: "Redécorer la maison pour me sentir bien", mois: "Février", description: "Faire de sa maison un espace agréable pour déconnecter." },
    { titre: "Prendre soin de soi", mois: "Mars", description: "Arrêter de fumer, faire plus d'exercice, mieux manger, méditer, etc." },
    { titre: "Soyez gentil", mois: "Avril", description: "Être gentil avec les gens et chercher à rendre les autres heureux avec de petits gestes." },
    { titre: "Faites quelque chose que vous n'avez jamais fait auparavant", mois: "Mai", description: "S'inscrire à un marathon, prendre des cours de salsa, apprendre à crocheter, etc." },
    { titre: "Passez du temps avec le vôtre", mois: "Juin", description: "Se retrouver le temps d'un week-end, sortir dîner, ou juste un geste tendre." },
    { titre: "Aller à un concert et danser", mois: "Juillet", description: "Profiter des festivals d'été et des grandes vacances." },
    { titre: "Dormir une nuit sur la plage", mois: "Août", description: "Contempler les étoiles et profiter du lever du soleil." },
    { titre: "Découvrez le monde", mois: "Septembre", description: "Sortir de sa zone de confort, explorer de nouveaux terrains ou sentiers de randonnée." },
    { titre: "Étudiez", mois: "Octobre", description: "Se recycler, acquérir de nouvelles connaissances, faire des recherches." },
    { titre: "Apprendre à jouer d'un instrument", mois: "Novembre", description: "Le ukulélé est suggéré comme un instrument à la mode et simple à apprendre." },
    { titre: "Respirez consciencieusement", mois: "Décembre", description: "Mettre la conscience dans le souffle pendant 5 minutes chaque jour." }
];

// Création de la table 'souhaits' et insertion des données initiales
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS souhaits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titre TEXT NOT NULL,
      mois TEXT NOT NULL,
      description TEXT,
      date_creation DATE DEFAULT CURRENT_TIMESTAMP,
      statut TEXT DEFAULT 'En Cours'
    )
  `);

  // Insertion des données par défaut si la table est vide (Exigence du document)
  db.get("SELECT COUNT(*) AS count FROM souhaits", (err, row) => {
    if (row.count === 0) {
      console.log('Insertion des 12 souhaits par défaut...');
      const stmt = db.prepare("INSERT INTO souhaits (titre, mois, description) VALUES (?, ?, ?)");
      defaultWishes.forEach(wish => {
        stmt.run(wish.titre, wish.mois, wish.description);
      });
      stmt.finalize(() => {
        console.log('Base de données initialisée avec les 12 souhaits.');
      });
    }
  });
});

// --- 2. ENDPOINT DE CRÉATION DE SOUHAIT (POST /api/souhaits) ---
app.post('/api/souhaits', (req, res) => {
    const { titre, mois } = req.body; 
    const sql = `INSERT INTO souhaits (titre, mois, description) VALUES (?, ?, ?)`;
    db.run(sql, [titre, mois, 'Souhait ajouté par l\'utilisateur'], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Souhait créé avec succès', id: this.lastID, titre });
    });
});

// --- 3. ENDPOINT D'AFFICHAGE DE TOUS LES SOUHAITS (GET /api/souhaits) ---
app.get('/api/souhaits', (req, res) => {
    db.all('SELECT * FROM souhaits ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ souhaits: rows });
    });
});

// --- 4. ENDPOINT LOGIQUE DE RAPPEL (GET /statut) [cite: 21, 23, 26, 28] ---
app.get('/statut', (req, res) => {
    const today = new Date().getDate();
    let message = "";

    if (today <= 15) {
        // Logique "Avant le 15 du mois" [cite: 23]
        message = "Il vous reste encore du temps pour avancer: assurez-vous d'être en bonne voie pour atteindre les objectifs que vous vous êtes fixés[cite: 24].";
    } else {
        // Logique "Après le 15 du mois" [cite: 26]
        message = "Nous avons dépassé la moitié du mois[cite: 27]. Il devient urgent de finaliser vos objectifs en cours[cite: 28].";
    }

    res.status(200).json({
        titre: "Suivi de vos objectifs mensuels",
        date_du_jour: today,
        message_rappel: message
    });
});

// --- 5. ENDPOINT DE SUPPRESSION DE SOUHAIT (DELETE /api/souhaits/:id) ---
app.delete('/api/souhaits/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM souhaits WHERE id = ?', id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Souhait non trouvé.' });
        res.json({ message: 'Souhait supprimé avec succès.' });
    });
});

// --- 6. DÉMARRAGE DU SERVEUR ---
app.listen(port, () => {
  console.log(`Application web complète démarrée : http://localhost:${port}`);
});
