// Основной класс приложения для работы с фильмами
class MoviesApp {
    constructor() {
        // Инициализация избранного списка из localStorage или создание пустого массива
        this.watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
        this.setupEventListeners(); // Установка обработчиков событий
        this.loadPopularMovies();   // Загрузка популярных фильмов при старте
    }

    setupEventListeners() {
        // Обработчик ввода текста в строке поиска с дебаунсом
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', this.debounce((e) => this.handleSearch(e), 300));

        // Обработчик выбора сортировки
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.handleSort(e.target.value);
        });

        // Обработчик для открытия избранного списка
        document.getElementById('watchlistBtn').addEventListener('click', () => {
            this.showWatchlist();
        });

        // Обработчики для закрытия модальных окон
        document.querySelectorAll('.close').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.style.display = 'none';
                });
            });
        });

        // Закрытие модального окна при клике вне его
        window.addEventListener('click', (e) => {
            document.querySelectorAll('.modal').forEach(modal => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }

    // Метод для добавления задержки (дебаунс) при выполнении функции
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Метод для получения данных с API
    async fetchData(endpoint, params = {}) {
        const queryString = new URLSearchParams({
            api_key: config.apiKey,
            ...params
        }).toString();
        
        try {
            const response = await fetch(`${config.baseUrl}${endpoint}?${queryString}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching data:', error);
            return null;
        }
    }

    // Загрузка популярных фильмов с API
    async loadPopularMovies() {
        const data = await this.fetchData('/movie/popular');
        if (data && data.results) {
            this.displayMovies(data.results);
        }
    }

    // Обработка поиска по введённому тексту
    async handleSearch(event) {
        const query = event.target.value.trim();
        if (query.length < 2) {
            document.getElementById('autoSuggest').style.display = 'none';
            return;
        }

        const data = await this.fetchData('/search/movie', { query });
        if (data && data.results) {
            this.displayAutoSuggestions(data.results.slice(0, 5));
        }
    }

    // Отображение списка подсказок для поиска
    displayAutoSuggestions(movies) {
        const autoSuggest = document.getElementById('autoSuggest');
        autoSuggest.innerHTML = '';
        autoSuggest.style.display = movies.length ? 'block' : 'none';

        movies.forEach(movie => {
            const div = document.createElement('div');
            div.className = 'suggest-item';
            div.textContent = movie.title;
            div.addEventListener('click', () => {
                this.showMovieDetails(movie.id);
                autoSuggest.style.display = 'none';
                document.getElementById('searchInput').value = movie.title;
            });
            autoSuggest.appendChild(div);
        });
    }

    // Обработка сортировки фильмов
    async handleSort(sortBy) {
        let endpoint = '/discover/movie';
        let params = {};

        switch (sortBy) {
            case 'release_date':
                params.sort_by = 'release_date.desc';
                break;
            case 'rating':
                params.sort_by = 'vote_average.desc';
                break;
            default:
                params.sort_by = 'popularity.desc';
        }

        const data = await this.fetchData(endpoint, params);
        if (data && data.results) {
            this.displayMovies(data.results);
        }
    }

    // Отображение списка фильмов на странице
    displayMovies(movies) {
        const grid = document.getElementById('movieGrid');
        grid.innerHTML = '';

        movies.forEach(movie => {
            const card = document.createElement('div');
            card.className = 'movie-card';
            card.innerHTML = `
                <img class="movie-poster" 
                     src="${movie.poster_path ? config.imageBaseUrl + movie.poster_path : 'placeholder.jpg'}" 
                     alt="${movie.title}">
                <div class="movie-info">
                    <div class="movie-title">${movie.title}</div>
                    <div>${movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}</div>
                </div>
            `;
            card.addEventListener('click', () => this.showMovieDetails(movie.id));
            grid.appendChild(card);
        });
    }

    // Показ деталей фильма в модальном окне
    async showMovieDetails(movieId) {
        const [movieData, credits] = await Promise.all([
            this.fetchData(`/movie/${movieId}`),
            this.fetchData(`/movie/${movieId}/credits`)
        ]);

        if (!movieData) return;

        const modal = document.getElementById('movieModal');
        const details = document.getElementById('movieDetails');
        
        details.innerHTML = `
            <img src="${movieData.poster_path ? config.imageBaseUrl + movieData.poster_path : 'placeholder.jpg'}" 
                 alt="${movieData.title}">
            <div class="movie-details-info">
                <h2>${movieData.title} (${movieData.release_date ? new Date(movieData.release_date).getFullYear() : 'N/A'})</h2>
                <p><strong>Rating:</strong> ${movieData.vote_average}/10</p>
                <p><strong>Runtime:</strong> ${movieData.runtime || 'N/A'} minutes</p>
                <p><strong>Overview:</strong> ${movieData.overview || 'No overview available.'}</p>
                <button class="watchlist-toggle" onclick="app.toggleWatchlist(${movieId})">
                    ${this.watchlist.includes(movieId) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                </button>
                <h3>Cast</h3>
                <div class="cast-grid">
                    ${credits && credits.cast ? credits.cast.slice(0, 6).map(actor => `
                        <div class="cast-card">
                            <img src="${actor.profile_path ? config.imageBaseUrl + actor.profile_path : 'placeholder.jpg'}" 
                                 alt="${actor.name}">
                            <p>${actor.name}</p>
                            <p>${actor.character}</p>
                        </div>
                    `).join('') : 'No cast information available.'}
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    // Показ избранного списка
    async showWatchlist() {
        const watchlistModal = document.getElementById('watchlistModal');
        const content = document.getElementById('watchlistContent');
        content.innerHTML = '';

        if (this.watchlist.length === 0) {
            content.innerHTML = '<p>Your watchlist is empty</p>';
            watchlistModal.style.display = 'block';
            return;
        }

        for (const movieId of this.watchlist) {
            const movie = await this.fetchData(`/movie/${movieId}`);
            if (movie) {
                const div = document.createElement('div');
                div.className = 'movie-card';
                div.innerHTML = `
                    <img class="movie-poster" 
                         src="${movie.poster_path ? config.imageBaseUrl + movie.poster_path : 'placeholder.jpg'}" 
                         alt="${movie.title}">
                    <div class="movie-info">
                        <div class="movie-title">${movie.title}</div>
                        <button onclick="app.removeFromWatchlist(${movie.id})">Remove</button>
                    </div>
                `;
                content.appendChild(div);
            }
        }

        watchlistModal.style.display = 'block';
    }

    // Добавление и удаление фильмов в избранном
    toggleWatchlist(movieId) {
        if (this.watchlist.includes(movieId)) {
            this.removeFromWatchlist(movieId);
        } else {
            this.addToWatchlist(movieId);
        }
        this.showMovieDetails(movieId); // Обновление кнопки в деталях фильма
    }

    // Добавление фильма в избранное
    addToWatchlist(movieId) {
        if (!this.watchlist.includes(movieId)) {
            this.watchlist.push(movieId);
            this.saveWatchlist();
        }
    }

    // Удаление фильма из избранного
    removeFromWatchlist(movieId) {
        this.watchlist = this.watchlist.filter(id => id !== movieId);
        this.saveWatchlist();
        this.showWatchlist
