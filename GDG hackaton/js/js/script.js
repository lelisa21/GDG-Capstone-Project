document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const themeSwitch = document.getElementById('theme-switch');
    const themeIcon = document.getElementById('theme-icon');
    const navLinks = document.querySelectorAll('nav ul li a');
    const sections = document.querySelectorAll('section');
    const heroSearch = document.getElementById('hero-search');
    const heroSearchBtn = document.getElementById('hero-search-btn');
    const bookSearch = document.getElementById('book-search');
    const searchBtn = document.getElementById('search-btn');
    const resultsGrid = document.getElementById('results-grid');
    const favoritesGrid = document.getElementById('favorites-grid');
    const noFavorites = document.getElementById('no-favorites');
    const exploreBooksBtn = document.getElementById('explore-books-btn');
    const pagination = document.getElementById('pagination');
    const loadingSpinner = document.getElementById('loading-spinner');
    const notification = document.getElementById('notification');
    const collectionCards = document.querySelectorAll('.collection-card');
    const suggestionsDropdown = document.createElement('div');
    suggestionsDropdown.className = 'suggestions-dropdown';
    bookSearch.parentNode.insertBefore(suggestionsDropdown, bookSearch.nextSibling);
    

    let currentPage = 1;
    let currentQuery = '';
    let currentSort = 'relevance';
    let currentLimit = 25;
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    let suggestionTimeout;
    
    
    checkThemePreference();
    updateFavoritesDisplay();
    fetchFeaturedBooks();
    
    
    themeSwitch.addEventListener('change', toggleTheme);
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.id.replace('-link', '-section');
            showSection(sectionId);
            
           
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            this.classList.add('active');
            
            
            if (sectionId === 'favorites-section') {
                updateFavoritesDisplay();
            }
        });
    });
    
    heroSearchBtn.addEventListener('click', function() {
        if (heroSearch.value.trim()) {
            currentQuery = heroSearch.value.trim();
            showSection('search-section');
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            document.getElementById('search-link').classList.add('active');
            searchBooks();
        }
    });
    
    heroSearch.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && heroSearch.value.trim()) {
            currentQuery = heroSearch.value.trim();
            showSection('search-section');
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            document.getElementById('search-link').classList.add('active');
            searchBooks();
        }
    });
    
    searchBtn.addEventListener('click', function() {
        if (bookSearch.value.trim()) {
            currentQuery = bookSearch.value.trim();
            currentPage = 1;
            searchBooks();
        }
    });
    
    bookSearch.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && bookSearch.value.trim()) {
            currentQuery = bookSearch.value.trim();
            currentPage = 1;
            searchBooks();
        }
    });
    
    // Search suggestions
    bookSearch.addEventListener('input', function() {
        clearTimeout(suggestionTimeout);
        const query = this.value.trim();
        
        if (query.length < 2) {
            suggestionsDropdown.style.display = 'none';
            return;
        }
        
        suggestionsDropdown.style.display = 'none';
        
        suggestionTimeout = setTimeout(async () => {
            try {
                const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`);
                const data = await response.json();
                
                if (data.docs && data.docs.length > 0) {
                    suggestionsDropdown.innerHTML = '';
                    data.docs.forEach(doc => {
                        const suggestion = document.createElement('div');
                        suggestion.className = 'suggestion-item';
                        suggestion.textContent = doc.title || 'Untitled';
                        if (doc.author_name) {
                            suggestion.textContent += ` by ${doc.author_name[0]}`;
                        }
                        suggestion.addEventListener('click', () => {
                            bookSearch.value = doc.title || '';
                            currentQuery = doc.title || '';
                            currentPage = 1;
                            searchBooks();
                            suggestionsDropdown.style.display = 'none';
                        });
                        suggestionsDropdown.appendChild(suggestion);
                    });
                    suggestionsDropdown.style.display = 'block';
                }
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            }
        }, 30);
    });
    
    document.addEventListener('click', function(e) {
        if (e.target !== bookSearch) {
            suggestionsDropdown.style.display = 'none';
        }
    });
    
    document.getElementById('sort-by').addEventListener('change', function() {
        currentSort = this.value;
        if (currentQuery) {
            searchBooks();
        }
    });
    
    document.getElementById('results-count').addEventListener('change', function() {
        currentLimit = parseInt(this.value);
        if (currentQuery) {
            searchBooks();
        }
    });
    
    exploreBooksBtn.addEventListener('click', function() {
        showSection('search-section');
        navLinks.forEach(navLink => navLink.classList.remove('active'));
        document.getElementById('search-link').classList.add('active');
    });
    
    collectionCards.forEach(card => {
        card.addEventListener('click', function() {
            const collection = this.getAttribute('data-collection');
            currentQuery = collection;
            currentPage = 1;
            showSection('search-section');
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            document.getElementById('search-link').classList.add('active');
            searchBooks();
        });
    });
    
    // Functions
    function checkThemePreference() {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            themeSwitch.checked = savedTheme === 'dark';
        } else if (prefersDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeSwitch.checked = true;
        }
        
        updateThemeIcon();
    }
    
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon();
    }
    
    function updateThemeIcon() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            themeIcon.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            themeIcon.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }
    
    function showSection(sectionId) {
        sections.forEach(section => {
            section.classList.remove('active-section');
        });
        document.getElementById(sectionId).classList.add('active-section');
    }
    
    async function searchBooks() {
        try {
            loadingSpinner.style.display = 'flex';
            resultsGrid.innerHTML = '';
          
            let url = `https://openlibrary.org/search.json?q=${encodeURIComponent(currentQuery)}&page=${currentPage}&limit=${currentLimit}`;
            
           
            if (currentSort === 'new') {
                url += '&sort=new';
            } else if (currentSort === 'old') {
                url += '&sort=old';
            }
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.docs && data.docs.length > 0) {
                displayBooks(data.docs);
                setupPagination(data.numFound);
            } else {
                resultsGrid.innerHTML = '<p class="no-results">No books found. Try a different search term.</p>';
                pagination.innerHTML = '';
            }
        } catch (error) {
            console.error('Error searching books:', error);
            showNotification('Error fetching books. Please try again.', 'error');
        } finally {
            loadingSpinner.style.display = 'none';
        }
    }
    
    function displayBooks(books) {
        resultsGrid.innerHTML = '';
        
        books.forEach(book => {
            const bookCard = document.createElement('div');
            bookCard.className = 'book-card';
            
            let coverUrl = '';
            if (book.cover_i) {
                coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`;
            }
            

            let authorName = 'Unknown Author';
            if (book.author_name && book.author_name.length > 0) {
                authorName = book.author_name.join(', ');
            }
            
            
            let firstPublishYear = '';
            if (book.first_publish_year) {
                firstPublishYear = book.first_publish_year;
            }
            
           
            const isFavorite = favorites.some(fav => fav.key === book.key);
            
            bookCard.innerHTML = `
                <div class="book-cover">
                    ${coverUrl ? `<img src="${coverUrl}" alt="${book.title} cover">` : '<div class="no-cover">No cover available</div>'}
                </div>
                <div class="book-info">
                    <h3 class="book-title">${book.title || 'Untitled'}</h3>
                    <p class="book-author">By ${authorName}</p>
                    ${firstPublishYear ? `<p class="book-year">First published in ${firstPublishYear}</p>` : ''}
                    <div class="book-actions">
                        <button class="details-btn" data-key="${book.key}">
                            <i class="fas fa-info-circle"></i> Details
                        </button>
                        <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" data-key="${book.key}">
                            <i class="fas ${isFavorite ? 'fa-check' : 'fa-heart'}"></i> ${isFavorite ? 'Saved' : 'Save'}
                        </button>
                        <button class="download-btn" data-key="${book.key}" data-title="${book.title || 'Untitled'}">
                            <i class="fas fa-download"></i> Download
                        </button>
                    </div>
                </div>
            `;
            
            resultsGrid.appendChild(bookCard);
        });
        
       
        document.querySelectorAll('.details-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const bookKey = this.getAttribute('data-key');
                showBookDetails(bookKey);
            });
        });
        
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const bookKey = this.getAttribute('data-key');
                const book = books.find(b => b.key === bookKey);
                if (book) {
                    toggleFavorite(book);
                }
            });
        });
        
        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const bookKey = this.getAttribute('data-key');
                const bookTitle = this.getAttribute('data-title');
                downloadBook(bookKey, bookTitle);
            });
        });
    }
    
    function setupPagination(totalResults) {
        pagination.innerHTML = '';
        const totalPages = Math.ceil(totalResults / currentLimit);
        const maxPagesToShow = 5;
        
        if (totalPages <= 1) return;
        
        
        if (currentPage > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            prevBtn.addEventListener('click', () => {
                currentPage--;
                searchBooks();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            pagination.appendChild(prevBtn);
        }
        
       
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
        
        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            if (i === currentPage) {
                pageBtn.classList.add('active');
            }
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                searchBooks();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            pagination.appendChild(pageBtn);
        }
        
       
        if (currentPage < totalPages) {
            const nextBtn = document.createElement('button');
            nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            nextBtn.addEventListener('click', () => {
                currentPage++;
                searchBooks();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            pagination.appendChild(nextBtn);
        }
    }
    
    async function showBookDetails(bookKey) {
        try {
            loadingSpinner.style.display = 'flex';
            
           
            const bookResponse = await fetch(`https://openlibrary.org${bookKey}.json`);
            const bookData = await bookResponse.json();
            
         
            let workData = null;
            if (bookData.works && bookData.works.length > 0) {
                const workResponse = await fetch(`https://openlibrary.org${bookData.works[0].key}.json`);
                workData = await workResponse.json();
            }
            
            
            let formats = [];
            if (bookData.formats) {
                formats = Object.entries(bookData.formats)
                    .filter(([format, url]) => 
                        ['pdf', 'epub', 'text', 'html'].includes(format.toLowerCase()) && 
                        url && !url.includes('archive.org/details')
                    )
                    .map(([format, url]) => ({ format, url }));
            }
            
          
            const modal = document.createElement('div');
            modal.className = 'modal show';
            modal.innerHTML = `
                <div class="modal-content">
                    <button class="modal-close">&times;</button>
                    <div class="modal-header">
                        ${bookData.covers ? `<img src="https://covers.openlibrary.org/b/id/${bookData.covers[0]}-M.jpg" alt="${bookData.title} cover">` : ''}
                        <div class="modal-header-info">
                            <h2>${bookData.title || 'Untitled'}</h2>
                            ${bookData.authors ? `<p>By ${bookData.authors.map(a => a.name).join(', ')}</p>` : ''}
                            ${bookData.first_publish_date ? `<p>First published: ${bookData.first_publish_date}</p>` : ''}
                        </div>
                    </div>
                    <div class="modal-body">
                        <div class="book-details-grid">
                            <div class="book-details-sidebar">
                                <div class="book-detail">
                                    <div class="book-detail-label">Pages</div>
                                    <div class="book-detail-value">${bookData.number_of_pages || 'Unknown'}</div>
                                </div>
                                ${bookData.publish_date ? `
                                <div class="book-detail">
                                    <div class="book-detail-label">Publish Date</div>
                                    <div class="book-detail-value">${bookData.publish_date}</div>
                                </div>
                                ` : ''}
                                ${bookData.publishers ? `
                                <div class="book-detail">
                                    <div class="book-detail-label">Publisher</div>
                                    <div class="book-detail-value">${bookData.publishers.join(', ')}</div>
                                </div>
                                ` : ''}
                                ${workData && workData.subjects ? `
                                <div class="book-detail">
                                    <div class="book-detail-label">Subjects</div>
                                    <div class="book-subjects">
                                        ${workData.subjects.slice(0, 5).map(subject => `
                                            <span class="subject-tag">${subject}</span>
                                        `).join('')}
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                            <div class="book-details-main">
                                ${workData && workData.description ? `
                                    <h3>Description</h3>
                                    <div class="book-description">
                                        ${typeof workData.description === 'string' ? workData.description : workData.description.value || 'No description available.'}
                                    </div>
                                ` : '<p>No description available.</p>'}
                                
                                ${formats.length > 0 ? `
                                <div class="download-options">
                                    <h3>Download Options</h3>
                                    <div class="format-buttons">
                                        ${formats.map(f => `
                                            <a href="${f.url}" target="_blank" class="format-btn ${f.format}">
                                                <i class="fas fa-download"></i> ${f.format.toUpperCase()}
                                            </a>
                                        `).join('')}
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
         
            modal.querySelector('.modal-close').addEventListener('click', () => {
                modal.remove();
            });
            
          
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        } catch (error) {
            console.error('Error fetching book details:', error);
            showNotification('Error loading book details. Please try again.', 'error');
        } finally {
            loadingSpinner.style.display = 'none';
        }
    }
    
    async function downloadBook(bookKey, bookTitle) {
        try {
            
            const bookPageUrl = `https://openlibrary.org${bookKey}`;
            
           
            window.open(bookPageUrl, '_blank');
            showNotification(`Redirecting to Open Library download page for ${bookTitle}`, 'success');
        } catch (error) {
            console.error('Error redirecting to book page:', error);
            showNotification('Error redirecting to the book page. Please try again.', 'error');
        }
    }
    
    function toggleFavorite(book) {
        const existingIndex = favorites.findIndex(fav => fav.key === book.key);
        
        if (existingIndex >= 0) {
            favorites.splice(existingIndex, 1);
            showNotification('Book removed from favorites', 'success');
        } else {
           
            favorites.push({
                key: book.key,
                title: book.title,
                author_name: book.author_name,
                first_publish_year: book.first_publish_year,
                cover_i: book.cover_i
            });
            showNotification('Book added to favorites', 'success');
        }
        
        
        localStorage.setItem('favorites', JSON.stringify(favorites));
        
       
        if (document.querySelector('.active-section').id === 'favorites-section') {
            updateFavoritesDisplay();
        } else {
            
            const favBtn = document.querySelector(`.favorite-btn[data-key="${book.key}"]`);
            if (favBtn) {
                const isFavorite = favorites.some(fav => fav.key === book.key);
                favBtn.innerHTML = `<i class="fas ${isFavorite ? 'fa-check' : 'fa-heart'}"></i> ${isFavorite ? 'Saved' : 'Save'}`;
                favBtn.classList.toggle('favorited', isFavorite);
            }
        }
    }
    
    function updateFavoritesDisplay() {
        if (favorites.length === 0) {
            noFavorites.style.display = 'flex';
            favoritesGrid.innerHTML = '';
        } else {
            noFavorites.style.display = 'none';
            favoritesGrid.innerHTML = '';
            
            favorites.forEach(book => {
                const bookCard = document.createElement('div');
                bookCard.className = 'book-card';
                
                
                let coverUrl = '';
                if (book.cover_i) {
                    coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`;
                }
                
                
                let authorName = 'Unknown Author';
                if (book.author_name && book.author_name.length > 0) {
                    authorName = book.author_name.join(', ');
                }
                
                bookCard.innerHTML = `
                    <div class="book-cover">
                        ${coverUrl ? `<img src="${coverUrl}" alt="${book.title} cover">` : '<div class="no-cover">No cover available</div>'}
                    </div>
                    <div class="book-info">
                        <h3 class="book-title">${book.title || 'Untitled'}</h3>
                        <p class="book-author">By ${authorName}</p>
                        ${book.first_publish_year ? `<p class="book-year">First published in ${book.first_publish_year}</p>` : ''}
                        <div class="book-actions">
                            <button class="details-btn" data-key="${book.key}">
                                <i class="fas fa-info-circle"></i> Details
                            </button>
                            <button class="download-btn" data-key="${book.key}" data-title="${book.title || 'Untitled'}">
                                <i class="fas fa-download"></i> Download
                            </button>
                            <button class="remove-btn" data-key="${book.key}">
                                <i class="fas fa-trash"></i> Remove
                            </button>
                        </div>
                    </div>
                `;
                
                favoritesGrid.appendChild(bookCard);
            });
            
            
            document.querySelectorAll('.details-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const bookKey = this.getAttribute('data-key');
                    showBookDetails(bookKey);
                });
            });
            
            document.querySelectorAll('.download-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const bookKey = this.getAttribute('data-key');
                    const bookTitle = this.getAttribute('data-title');
                    downloadBook(bookKey, bookTitle);
                });
            });
            
            document.querySelectorAll('.remove-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const bookKey = this.getAttribute('data-key');
                    const bookIndex = favorites.findIndex(fav => fav.key === bookKey);
                    if (bookIndex >= 0) {
                        favorites.splice(bookIndex, 1);
                        localStorage.setItem('favorites', JSON.stringify(favorites));
                        updateFavoritesDisplay();
                        showNotification('Book removed from favorites', 'success');
                    }
                });
            });
        }
    }
    
    function showNotification(message, type) {
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            ${message}
        `;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const bookKey = this.getAttribute('data-key');
            const bookTitle = this.getAttribute('data-title');
            downloadBook(bookKey, bookTitle);
        });
    });

    async function fetchFeaturedBooks() {
        try {
           
            const response = await fetch('https://openlibrary.org/search.json?q=the&limit=50');
            const data = await response.json();
    
            if (data.docs && data.docs.length > 0) {
               
                const shuffledBooks = data.docs.sort(() => 0.5 - Math.random());
                const featuredBooks = shuffledBooks.slice(0, 10);
    
                displayFeaturedBooks(featuredBooks);
            } else {
                document.getElementById('featured-books-grid').innerHTML = '<p>No featured books available.</p>';
            }
        } catch (error) {
            console.error('Error fetching featured books:', error);
            showNotification('Error loading featured books. Please try again.', 'error');
        }
    }

    function displayFeaturedBooks(books) {
        const featuredBooksGrid = document.getElementById('featured-books-grid');
        featuredBooksGrid.innerHTML = '';        console.log('Displaying featured books:', books);

        books.forEach(book => {
            const bookCard = document.createElement('div');
            bookCard.className = 'book-card';

            let coverUrl = '';
            if (book.cover_i) {
                coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`;
            }

            let authorName = 'Unknown Author';
            if (book.author_name && book.author_name.length > 0) {
                authorName = book.author_name.join(', ');
            }

            bookCard.innerHTML = `
                <div class="book-cover">
                    ${coverUrl ? `<img src="${coverUrl}" alt="${book.title} cover">` : '<div class="no-cover">No cover available</div>'}
                </div>
                <div class="book-info">
                    <h3 class="book-title">${book.title || 'Untitled'}</h3>
                    <p class="book-author">By ${authorName}</p>
                    ${book.first_publish_year ? `<p class="book-year">First published in ${book.first_publish_year}</p>` : ''}
                    <div class="book-actions">
                        <button class="details-btn" data-key="${book.key}">
                            <i class="fas fa-info-circle"></i> Details
                        </button>
                        <button class="download-btn" data-key="${book.key}" data-title="${book.title || 'Untitled'}">
                            <i class="fas fa-download"></i> Download
                        </button>
                    </div>
                </div>
            `;

            featuredBooksGrid.appendChild(bookCard);
        });

        console.log('Featured books displayed successfully.');

       
        document.querySelectorAll('.details-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const bookKey = this.getAttribute('data-key');
                showBookDetails(bookKey);
            });
        });

        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const bookKey = this.getAttribute('data-key');
                const bookTitle = this.getAttribute('data-title');
                downloadBook(bookKey, bookTitle);
            });
        });
    }
});



document.addEventListener('DOMContentLoaded', function () {
    fetchFeaturedBooks();
});