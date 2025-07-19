/**
 * Todo App - Application de gestion de tâches
 * Développée avec JavaScript vanilla
 */

class TodoApp {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.editingTaskId = null;
        
        // Éléments DOM
        this.elements = {
            addTaskForm: document.getElementById('addTaskForm'),
            taskInput: document.getElementById('taskInput'),
            tasksList: document.getElementById('tasksList'),
            emptyState: document.getElementById('emptyState'),
            taskCount: document.getElementById('taskCount'),
            filterBtns: document.querySelectorAll('.filter-btn'),
            bulkActions: document.getElementById('bulkActions'),
            markAllCompleted: document.getElementById('markAllCompleted'),
            deleteCompleted: document.getElementById('deleteCompleted')
        };
        
        this.init();
    }
    
    /**
     * Initialisation de l'application
     */
    init() {
        this.loadTasks();
        this.bindEvents();
        this.render();
        this.updateTaskCount();
        this.updateBulkActions();
    }
    
    /**
     * Liaison des événements
     */
    bindEvents() {
        // Formulaire d'ajout de tâche
        this.elements.addTaskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });
        
        // Filtres
        this.elements.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
        
        // Actions en masse
        this.elements.markAllCompleted.addEventListener('click', () => {
            this.markAllCompleted();
        });
        
        this.elements.deleteCompleted.addEventListener('click', () => {
            this.deleteCompletedTasks();
        });
        
        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }
    
    /**
     * Gestion des raccourcis clavier
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + Enter pour ajouter une tâche
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && document.activeElement === this.elements.taskInput) {
            this.addTask();
        }
        
        // Échap pour annuler l'édition
        if (e.key === 'Escape' && this.editingTaskId) {
            this.cancelEdit();
        }
    }
    
    /**
     * Ajouter une nouvelle tâche
     */
    addTask() {
        const text = this.elements.taskInput.value.trim();
        
        if (!text) {
            this.showNotification('Veuillez saisir une tâche', 'warning');
            return;
        }
        
        const task = {
            id: this.generateId(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.tasks.unshift(task);
        this.saveTasks();
        this.render();
        this.updateTaskCount();
        this.updateBulkActions();
        
        // Réinitialiser le formulaire
        this.elements.taskInput.value = '';
        this.elements.taskInput.focus();
        
        this.showNotification('Tâche ajoutée avec succès !', 'success');
    }
    
    /**
     * Supprimer une tâche
     */
    deleteTask(taskId) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            const task = this.tasks[taskIndex];
            this.tasks.splice(taskIndex, 1);
            this.saveTasks();
            this.render();
            this.updateTaskCount();
            this.updateBulkActions();
            
            this.showNotification(`Tâche "${task.text}" supprimée`, 'info');
        }
    }
    
    /**
     * Basculer le statut d'une tâche
     */
    toggleTask(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasks();
            this.render();
            this.updateTaskCount();
            this.updateBulkActions();
            
            const status = task.completed ? 'terminée' : 'réactivée';
            this.showNotification(`Tâche "${task.text}" marquée comme ${status}`, 'success');
        }
    }
    
    /**
     * Commencer l'édition d'une tâche
     */
    startEdit(taskId) {
        this.editingTaskId = taskId;
        this.render();
        
        // Focus sur le champ d'édition
        setTimeout(() => {
            const editInput = document.querySelector(`[data-id="${taskId}"] .edit-input`);
            if (editInput) {
                editInput.focus();
                editInput.select();
            }
        }, 100);
    }
    
    /**
     * Sauvegarder l'édition d'une tâche
     */
    saveEdit(taskId) {
        const editInput = document.querySelector(`[data-id="${taskId}"] .edit-input`);
        const newText = editInput.value.trim();
        
        if (!newText) {
            this.showNotification('Le texte de la tâche ne peut pas être vide', 'warning');
            return;
        }
        
        const task = this.tasks.find(task => task.id === taskId);
        
        if (task) {
            const oldText = task.text;
            task.text = newText;
            task.updatedAt = new Date().toISOString();
            this.saveTasks();
            this.editingTaskId = null;
            this.render();
            
            this.showNotification(`Tâche modifiée : "${oldText}" → "${newText}"`, 'success');
        }
    }
    
    /**
     * Annuler l'édition d'une tâche
     */
    cancelEdit() {
        this.editingTaskId = null;
        this.render();
    }
    
    /**
     * Définir le filtre actuel
     */
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Mettre à jour les boutons de filtre
        this.elements.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.render();
    }
    
    /**
     * Marquer toutes les tâches comme terminées
     */
    markAllCompleted() {
        const activeTasks = this.tasks.filter(task => !task.completed);
        
        if (activeTasks.length === 0) {
            this.showNotification('Aucune tâche active à marquer', 'info');
            return;
        }
        
        activeTasks.forEach(task => {
            task.completed = true;
            task.completedAt = new Date().toISOString();
        });
        
        this.saveTasks();
        this.render();
        this.updateTaskCount();
        this.updateBulkActions();
        
        this.showNotification(`${activeTasks.length} tâche(s) marquée(s) comme terminée(s)`, 'success');
    }
    
    /**
     * Supprimer toutes les tâches terminées
     */
    deleteCompletedTasks() {
        const completedTasks = this.tasks.filter(task => task.completed);
        
        if (completedTasks.length === 0) {
            this.showNotification('Aucune tâche terminée à supprimer', 'info');
            return;
        }
        
        if (confirm(`Êtes-vous sûr de vouloir supprimer ${completedTasks.length} tâche(s) terminée(s) ?`)) {
            this.tasks = this.tasks.filter(task => !task.completed);
            this.saveTasks();
            this.render();
            this.updateTaskCount();
            this.updateBulkActions();
            
            this.showNotification(`${completedTasks.length} tâche(s) terminée(s) supprimée(s)`, 'success');
        }
    }
    
    /**
     * Filtrer les tâches selon le filtre actuel
     */
    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(task => !task.completed);
            case 'completed':
                return this.tasks.filter(task => task.completed);
            default:
                return this.tasks;
        }
    }
    
    /**
     * Rendu de l'interface
     */
    render() {
        const filteredTasks = this.getFilteredTasks();
        const hasTasks = this.tasks.length > 0;
        const hasFilteredTasks = filteredTasks.length > 0;
        
        // Afficher/masquer l'état vide
        this.elements.emptyState.style.display = hasTasks ? 'none' : 'block';
        
        // Rendu de la liste des tâches
        if (hasFilteredTasks) {
            this.elements.tasksList.innerHTML = filteredTasks.map(task => this.renderTask(task)).join('');
            this.bindTaskEvents();
        } else if (hasTasks) {
            this.elements.tasksList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-filter"></i>
                    <h3>Aucune tâche trouvée</h3>
                    <p>Aucune tâche ne correspond au filtre sélectionné.</p>
                </div>
            `;
        } else {
            this.elements.tasksList.innerHTML = '';
        }
    }
    
    /**
     * Rendu d'une tâche individuelle
     */
    renderTask(task) {
        const isEditing = this.editingTaskId === task.id;
        const completedClass = task.completed ? 'completed' : '';
        
        return `
            <div class="task-item ${completedClass}" data-id="${task.id}">
                <div class="task-content" ${isEditing ? 'style="display: none;"' : ''}>
                    <label class="checkbox-container">
                        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                        <span class="checkmark"></span>
                    </label>
                    <span class="task-text">${this.escapeHtml(task.text)}</span>
                    <div class="task-actions">
                        <button class="task-btn edit-btn" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="task-btn delete-btn" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="task-edit-form" ${isEditing ? '' : 'style="display: none;"'}>
                    <input type="text" class="edit-input" value="${this.escapeHtml(task.text)}" maxlength="100">
                    <div class="edit-actions">
                        <button class="save-btn" title="Sauvegarder">
                            <i class="fas fa-save"></i>
                        </button>
                        <button class="cancel-btn" title="Annuler">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Liaison des événements pour les tâches
     */
    bindTaskEvents() {
        // Checkbox pour marquer comme terminé
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const taskId = e.target.closest('.task-item').dataset.id;
                this.toggleTask(taskId);
            });
        });
        
        // Bouton d'édition
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('.task-item').dataset.id;
                this.startEdit(taskId);
            });
        });
        
        // Bouton de suppression
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('.task-item').dataset.id;
                if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
                    this.deleteTask(taskId);
                }
            });
        });
        
        // Boutons d'édition (sauvegarder/annuler)
        document.querySelectorAll('.save-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('.task-item').dataset.id;
                this.saveEdit(taskId);
            });
        });
        
        document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('.task-item').dataset.id;
                this.cancelEdit();
            });
        });
        
        // Entrée pour sauvegarder l'édition
        document.querySelectorAll('.edit-input').forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const taskId = e.target.closest('.task-item').dataset.id;
                    this.saveEdit(taskId);
                } else if (e.key === 'Escape') {
                    this.cancelEdit();
                }
            });
        });
    }
    
    /**
     * Mettre à jour le compteur de tâches
     */
    updateTaskCount() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const activeTasks = totalTasks - completedTasks;
        
        let countText = '';
        
        switch (this.currentFilter) {
            case 'active':
                countText = `${activeTasks} tâche(s) active(s)`;
                break;
            case 'completed':
                countText = `${completedTasks} tâche(s) terminée(s)`;
                break;
            default:
                countText = `${totalTasks} tâche(s) au total`;
        }
        
        this.elements.taskCount.textContent = countText;
    }
    
    /**
     * Mettre à jour l'affichage des actions en masse
     */
    updateBulkActions() {
        const hasTasks = this.tasks.length > 0;
        const hasCompletedTasks = this.tasks.some(task => task.completed);
        const hasActiveTasks = this.tasks.some(task => !task.completed);
        
        this.elements.bulkActions.style.display = hasTasks ? 'block' : 'none';
        this.elements.markAllCompleted.style.display = hasActiveTasks ? 'inline-flex' : 'none';
        this.elements.deleteCompleted.style.display = hasCompletedTasks ? 'inline-flex' : 'none';
    }
    
    /**
     * Sauvegarder les tâches dans le localStorage
     */
    saveTasks() {
        try {
            localStorage.setItem('todoApp_tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des tâches:', error);
            this.showNotification('Erreur lors de la sauvegarde', 'error');
        }
    }
    
    /**
     * Charger les tâches depuis le localStorage
     */
    loadTasks() {
        try {
            const savedTasks = localStorage.getItem('todoApp_tasks');
            if (savedTasks) {
                this.tasks = JSON.parse(savedTasks);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des tâches:', error);
            this.showNotification('Erreur lors du chargement des données', 'error');
            this.tasks = [];
        }
    }
    
    /**
     * Générer un ID unique
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    /**
     * Échapper le HTML pour éviter les injections
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Afficher une notification
     */
    showNotification(message, type = 'info') {
        // Créer l'élément de notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Styles pour la notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 400px;
        `;
        
        // Ajouter au DOM
        document.body.appendChild(notification);
        
        // Animation d'entrée
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Fermer automatiquement après 4 secondes
        const autoClose = setTimeout(() => {
            this.closeNotification(notification);
        }, 4000);
        
        // Bouton de fermeture
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            clearTimeout(autoClose);
            this.closeNotification(notification);
        });
    }
    
    /**
     * Fermer une notification
     */
    closeNotification(notification) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
    
    /**
     * Obtenir l'icône pour le type de notification
     */
    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }
    
    /**
     * Obtenir la couleur pour le type de notification
     */
    getNotificationColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#6366f1'
        };
        return colors[type] || colors.info;
    }
}

// Styles pour les notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        transition: background-color 0.2s;
    }
    
    .notification-close:hover {
        background: rgba(255,255,255,0.2);
    }
`;
document.head.appendChild(notificationStyles);

// Initialiser l'application quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
}); 