// frontend/script.js
const API_URL = ''; // Laissez vide car le Frontend est servi par le Backend sur le même hôte/port

document.addEventListener('DOMContentLoaded', () => {
    fetchRappelStatus();
    fetchSouhaits();
    document.getElementById('form-souhait').addEventListener('submit', handleAddSouhait);
});

// 1. Récupère le statut de rappel (J-15)
// frontend/script.js - Fonction fetchRappelStatus
function fetchRappelStatus() {
    fetch(`${API_URL}/statut`)
        .then(response => response.json())
        .then(data => {
            const rappelDiv = document.getElementById('rappel-message');
            rappelDiv.textContent = data.message_rappel;

            if (data.date_du_jour > 15) {
                // Style d'alerte critique (Rouge)
                rappelDiv.style.backgroundColor = '#f8d7da'; 
                rappelDiv.style.color = '#721c24';
                rappelDiv.style.border = '1px solid #f5c6cb';
            } else {
                // Style d'alerte succès/normal (Vert/Jaune)
                rappelDiv.style.backgroundColor = '#d4edda'; 
                rappelDiv.style.color = '#155724';
                rappelDiv.style.border = '1px solid #c3e6cb';
            }
        })
        .catch(error => console.error('Erreur lors de la récupération du statut:', error));
}

// 2. Affiche la liste des souhaits
function fetchSouhaits() {
    fetch(`${API_URL}/api/souhaits`)
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('souhaits-list-container');
            container.innerHTML = '';
            
            if (data.souhaits && data.souhaits.length > 0) {
                data.souhaits.forEach(souhait => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span>${souhait.titre} (${souhait.mois}) - Statut: ${souhait.statut}</span>
                        <button class="delete-btn" data-id="${souhait.id}">Supprimer</button>
                    `;
                    container.appendChild(li);
                });
                document.querySelectorAll('.delete-btn').forEach(button => {
                    button.addEventListener('click', handleDeleteSouhait);
                });
            } else {
                container.innerHTML = '<li>Aucun souhait trouvé. Fixez vos objectifs!</li>';
            }
        })
        .catch(error => console.error('Erreur lors de la récupération des souhaits:', error));
}

// 3. Gère l'ajout d'un souhait (requête POST)
function handleAddSouhait(event) {
    event.preventDefault();
    
    const titre = document.getElementById('titre-souhait').value;
    const mois = document.getElementById('mois-souhait').value;
    
    fetch(`${API_URL}/api/souhaits`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ titre, mois })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Échec de la création du souhait');
        }
        document.getElementById('form-souhait').reset();
        
        // CORRECTION CLÉ : Appeler la fonction de rechargement de la liste
        fetchSouhaits(); 
    })
    .catch(error => console.error('Erreur lors de l\'ajout:', error));
}
// 4. Gère la suppression d'un souhait (requête DELETE)
function handleDeleteSouhait(event) {
    const id = event.target.dataset.id;
    
    fetch(`${API_URL}/api/souhaits/${id}`, {
        method: 'DELETE',
    })
    .then(response => {
        if (response.ok) {
            // C'est ici que l'appel dynamique se fait après la suppression
            fetchSouhaits(); 
        } else {
            alert('Échec de la suppression du souhait.');
        }
    })
    .catch(error => console.error('Erreur lors de la suppression:', error));
}
