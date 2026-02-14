// Données des films et séries - Supabase (partagé) ou localStorage (fallback)
const STORAGE_KEY = 'novaStream_content';

// Cache local (mis à jour par Supabase ou localStorage)
let contentCache = { films: [], series: [] };

function isSupabaseConfigured() {
    return typeof SUPABASE_URL === 'string' && SUPABASE_URL.length > 0 &&
           typeof SUPABASE_ANON_KEY === 'string' && SUPABASE_ANON_KEY.length > 0;
}

function supabaseFetch(path, options = {}) {
    if (!isSupabaseConfigured()) return Promise.reject(new Error('Supabase non configuré'));
    const url = SUPABASE_URL.replace(/\/$/, '') + '/rest/v1' + path;
    return fetch(url, {
        ...options,
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
            ...options.headers
        }
    });
}

// Charge le contenu depuis Supabase (visible par tous)
async function loadContentAsync() {
    if (!isSupabaseConfigured()) {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                contentCache = {
                    films: data.films || [],
                    series: data.series || []
                };
            }
        } catch (e) {}
        return contentCache;
    }

    try {
        const [filmsRes, seriesRes] = await Promise.all([
            supabaseFetch('/content?type=eq.film&order=created_at.asc&select=*'),
            supabaseFetch('/content?type=eq.serie&order=created_at.asc&select=*')
        ]);

        const filmsData = filmsRes.ok ? await filmsRes.json() : [];
        const seriesData = seriesRes.ok ? await seriesRes.json() : [];

        const toItem = (row) => ({
            id: row.id,
            title: row.title,
            description: row.description || '',
            image: row.image || '',
            videoUrl: row.video_url,
            duration: row.duration || '-',
            year: row.year || '-',
            genre: row.genre || '-'
        });

        contentCache = {
            films: filmsData.map(toItem),
            series: seriesData.map(toItem)
        };

        // Fusionne avec localStorage pour récupérer la description si elle n'est pas en Supabase
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const local = JSON.parse(saved);
                const mergeDesc = (target, source) => {
                    if (!source || !Array.isArray(source)) return;
                    target.forEach((item, i) => {
                        const localItem = source.find(l => l.id === item.id);
                        if (localItem && localItem.description && !item.description) {
                            item.description = localItem.description;
                        }
                    });
                };
                mergeDesc(contentCache.films, local.films);
                mergeDesc(contentCache.series, local.series);
            }
        } catch (e) {}

        localStorage.setItem(STORAGE_KEY, JSON.stringify(contentCache));
    } catch (e) {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                contentCache = {
                    films: data.films || [],
                    series: data.series || []
                };
            }
        } catch (err) {}
    }
    return contentCache;
}

function getContent() {
    return contentCache;
}

function saveContentLocal(content) {
    contentCache = content;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
}

async function addItem(category, item) {
    const type = category === 'film' ? 'film' : 'serie';
    const row = {
        type,
        title: item.title,
        description: item.description || '',
        image: item.image || '',
        video_url: item.videoUrl,
        duration: item.duration || '-',
        year: item.year || '-',
        genre: item.genre || '-'
    };

    if (isSupabaseConfigured()) {
        try {
            const res = await supabaseFetch('/content', {
                method: 'POST',
                body: JSON.stringify(row)
            });
            if (!res.ok) throw new Error(await res.text());
            const [created] = await res.json();
            const newItem = {
                id: created.id,
                title: created.title,
                description: created.description || '',
                image: created.image,
                videoUrl: created.video_url,
                duration: created.duration,
                year: created.year,
                genre: created.genre
            };
            const content = getContent();
            if (type === 'film') {
                content.films.push(newItem);
            } else {
                content.series.push(newItem);
            }
            saveContentLocal(content);
            return newItem;
        } catch (e) {
            console.error('Erreur Supabase:', e);
            throw e;
        }
    }

    item.id = 'item_' + Date.now();
    const content = getContent();
    const list = type === 'film' ? content.films : content.series;
    list.push(item);
    saveContentLocal(content);
    return item;
}

async function deleteItem(category, id) {
    const type = category === 'film' ? 'film' : 'serie';

    if (isSupabaseConfigured() && !id.startsWith('item_')) {
        try {
            const res = await supabaseFetch('/content?id=eq.' + id, { method: 'DELETE' });
            if (!res.ok) throw new Error(await res.text());
        } catch (e) {
            console.error('Erreur Supabase:', e);
            throw e;
        }
    }

    const content = getContent();
    const list = type === 'film' ? content.films : content.series;
    const filtered = list.filter(item => item.id !== id);
    if (type === 'film') {
        content.films = filtered;
    } else {
        content.series = filtered;
    }
    saveContentLocal(content);
}

async function updateItem(category, id, updates) {
    const type = category === 'film' ? 'film' : 'serie';
    const content = getContent();
    const list = type === 'film' ? content.films : content.series;
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return false;

    if (isSupabaseConfigured() && !id.startsWith('item_')) {
        const buildBody = (includeDesc) => {
            const body = {};
            if (updates.title !== undefined) body.title = updates.title;
            if (includeDesc && updates.description !== undefined) body.description = updates.description || '';
            if (updates.image !== undefined) body.image = updates.image;
            if (updates.videoUrl !== undefined) body.video_url = updates.videoUrl;
            if (updates.duration !== undefined) body.duration = updates.duration;
            if (updates.year !== undefined) body.year = updates.year;
            if (updates.genre !== undefined) body.genre = updates.genre;
            return body;
        };

        const doPatch = (body) => supabaseFetch('/content?id=eq.' + encodeURIComponent(id), {
            method: 'PATCH',
            body: JSON.stringify(body)
        });

        try {
            const res = await doPatch(buildBody(true));
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText);
            }
        } catch (e) {
            console.error('Erreur Supabase:', e);
            throw e;
        }
    }

    list[index] = { ...list[index], ...updates };
    saveContentLocal(content);
    return true;
}

function getItemById(category, id) {
    const content = getContent();
    const list = category === 'film' ? content.films : content.series;
    return list.find(item => item.id === id) || null;
}
