// Charge et affiche les films/séries - les cartes mènent à la page détail
function renderMediaGrid(container, items, type) {
    if (!container) return;

    const categoryLabel = type === 'series' ? 'Série' : 'Film';
    const urlType = type === 'series' ? 'serie' : 'film';

    if (!items || items.length === 0) {
        container.innerHTML = '<p class="empty-msg">Aucun contenu pour le moment.</p>';
        return;
    }

    container.innerHTML = items.map(item => {
        const duration = item.duration && item.duration !== '-' ? item.duration + ' min' : '';
        const year = item.year && item.year !== '-' ? item.year : '';
        const metaTop = [duration, year].filter(Boolean).join(' ');
        const genre = item.genre && item.genre !== '-' ? item.genre : '';
        const detailUrl = 'media.html?id=' + encodeURIComponent(item.id) + '&type=' + urlType;

        return `
        <a href="${detailUrl}" class="film-card">
            <div class="film-poster">
                ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">` : '<div class="placeholder-poster">?</div>'}
                <div class="play-overlay">
                    <span class="play-icon"><svg viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg></span>
                </div>
                <div class="film-shine"></div>
            </div>
            <div class="film-info">
                ${metaTop ? `<span class="film-duration">${escapeHtml(metaTop)}</span>` : ''}
                <h3>${escapeHtml(item.title)}</h3>
                <div class="film-info-row">
                    <span class="film-genre">${escapeHtml(genre) || '-'}</span>
                    <span class="film-badge">${categoryLabel}</span>
                </div>
            </div>
        </a>
    `}).join('');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
