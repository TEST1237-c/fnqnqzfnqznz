document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addForm');
    const imgFileWrap = document.getElementById('imgFileWrap');
    const imgUrlWrap = document.getElementById('imgUrlWrap');
    const imageFile = document.getElementById('imageFile');
    const imageUrl = document.getElementById('imageUrl');
    const categorySelect = document.getElementById('category');
    const editIdInput = document.getElementById('editId');
    const editCatInput = document.getElementById('editCat');
    const submitBtn = document.getElementById('submitBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    document.querySelectorAll('.option-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.option-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const val = tab.dataset.option;
            if (val === 'file') {
                imgFileWrap.classList.remove('hidden');
                imgUrlWrap.classList.add('hidden');
            } else {
                imgFileWrap.classList.add('hidden');
                imgUrlWrap.classList.remove('hidden');
            }
        });
    });

    document.querySelectorAll('.list-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.list-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('filmsList').classList.toggle('hidden', tab.dataset.list !== 'films');
            document.getElementById('seriesList').classList.toggle('hidden', tab.dataset.list !== 'series');
        });
    });

    cancelEditBtn.addEventListener('click', () => {
        editIdInput.value = '';
        editCatInput.value = '';
        form.reset();
        imageFile.value = '';
        submitBtn.textContent = 'Ajouter au site';
        cancelEditBtn.classList.add('hidden');
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const category = categorySelect.value;
        const title = document.getElementById('title').value.trim();
        const description = document.getElementById('description').value.trim();
        const videoUrl = document.getElementById('videoUrl').value.trim();
        const duration = document.getElementById('duration').value.trim();
        const year = document.getElementById('year').value.trim();
        const genre = document.getElementById('genre').value.trim();

        let image = '';
        const useFile = document.querySelector('input[name="imgType"]:checked').value === 'file';

        if (useFile && imageFile.files.length) {
            image = await fileToBase64(imageFile.files[0]);
        } else if (!useFile && imageUrl.value.trim()) {
            image = imageUrl.value.trim();
        } else if (!editIdInput.value) {
            alert('Choisis une image (fichier ou URL).');
            return;
        }

        const isEditing = editIdInput.value && editCatInput.value;

        if (isEditing) {
            const updates = { title, description: description || '', videoUrl, duration: duration || '-', year: year || '-', genre: genre || '-' };
            if (image) updates.image = image;
            try {
                const ok = await updateItem(editCatInput.value, editIdInput.value, updates);
                if (!ok) return;
                editIdInput.value = '';
                editCatInput.value = '';
                form.reset();
                imageFile.value = '';
                submitBtn.textContent = 'Ajouter au site';
                cancelEditBtn.classList.add('hidden');
                showSuccessEdit();
                renderLists();
            } catch (err) {
                const errMsg = (err.message || '').toLowerCase();
                const needsDescriptionCol = errMsg.includes('column') || errMsg.includes('description');
                const msg = needsDescriptionCol 
                    ? 'La colonne "description" n\'existe pas. Ouvre le fichier supabase-add-description.sql, copie son contenu, et exécute-le dans Supabase (SQL Editor).'
                    : 'Erreur lors de la modification. Vérifie ta config Supabase.\n\n' + (err.message || '');
                alert(msg);
            }
        } else {
            if (!image) {
                alert('Choisis une image (fichier ou URL).');
                return;
            }
            const item = {
                title,
                description: description || '',
                image,
                videoUrl,
                duration: duration || '-',
                year: year || '-',
                genre: genre || '-'
            };
            try {
                await addItem(category, item);
                form.reset();
                imageFile.value = '';
                showSuccess();
                renderLists();
            } catch (err) {
                alert('Erreur lors de l\'ajout. Vérifie ta config Supabase.');
            }
        }
    });

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function showSuccess() {
        const existing = document.querySelector('.msg-success');
        if (existing) existing.remove();
        const msg = document.createElement('div');
        msg.className = 'msg-success';
        msg.textContent = '✓ Contenu ajouté ! Il apparaît maintenant sur le site.';
        form.insertBefore(msg, form.firstChild);
        setTimeout(() => msg.remove(), 3000);
    }

    function showSuccessEdit() {
        const existing = document.querySelector('.msg-success');
        if (existing) existing.remove();
        const msg = document.createElement('div');
        msg.className = 'msg-success';
        msg.textContent = '✓ Contenu modifié !';
        form.insertBefore(msg, form.firstChild);
        setTimeout(() => msg.remove(), 3000);
    }

    function loadItemForEdit(id, cat) {
        const item = getItemById(cat, id);
        if (!item) return;
        editIdInput.value = id;
        editCatInput.value = cat;
        categorySelect.value = cat === 'film' ? 'film' : 'serie';
        document.getElementById('title').value = item.title || '';
        document.getElementById('description').value = item.description || '';
        document.getElementById('videoUrl').value = item.videoUrl || '';
        document.getElementById('duration').value = (item.duration && item.duration !== '-') ? item.duration : '';
        document.getElementById('year').value = (item.year && item.year !== '-') ? item.year : '';
        document.getElementById('genre').value = (item.genre && item.genre !== '-') ? item.genre : '';
        if (item.image) {
            document.querySelector('input[name="imgType"][value="url"]').checked = true;
            document.querySelector('.option-tab[data-option="file"]').classList.remove('active');
            document.querySelector('.option-tab[data-option="url"]').classList.add('active');
            imgFileWrap.classList.add('hidden');
            imgUrlWrap.classList.remove('hidden');
            imageUrl.value = item.image;
        }
        imageFile.value = '';
        submitBtn.textContent = 'Modifier';
        cancelEditBtn.classList.remove('hidden');
    }

    function renderLists() {
        const content = getContent();

        const filmsList = document.getElementById('filmsList');
        filmsList.innerHTML = content.films.map(item => renderItem(item, 'film')).join('');

        const seriesList = document.getElementById('seriesList');
        seriesList.innerHTML = content.series.map(item => renderItem(item, 'serie')).join('');

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const cat = btn.dataset.cat;
                if (confirm('Supprimer ce contenu ?')) {
                    try {
                        await deleteItem(cat, id);
                        renderLists();
                    } catch (err) {
                        alert('Erreur lors de la suppression.');
                    }
                }
            });
        });

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                loadItemForEdit(btn.dataset.id, btn.dataset.cat);
            });
        });
    }

    function renderItem(item, cat) {
        const imgHtml = item.image
            ? `<img src="${item.image}" alt="${item.title}">`
            : `<div class="item-placeholder">?</div>`;
        const meta = [item.genre, item.year].filter(v => v && v !== '-').join(' • ') || '-';
        const canDelete = !!item.id;
        const delBtn = canDelete
            ? `<button class="btn-delete" data-id="${item.id}" data-cat="${cat}">Supprimer</button>`
            : '';
        const canEdit = !!item.id;
        const editBtn = canEdit
            ? `<button class="btn-edit" data-id="${item.id}" data-cat="${cat}">Modifier</button>`
            : '';
        return `
            <div class="content-item">
                ${imgHtml}
                <div class="content-item-info">
                    <h4>${item.title}</h4>
                    <span>${meta}</span>
                </div>
                <div class="content-item-actions">
                    ${editBtn}
                    ${delBtn}
                </div>
            </div>
        `;
    }

    loadContentAsync().then(() => renderLists());
});
