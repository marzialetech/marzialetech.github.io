// Bible books metadata
const BOOKS = [
    { name: 'Genesis', abbrev: 'gn', chapters: 50 },
    { name: 'Exodus', abbrev: 'ex', chapters: 40 },
    { name: 'Leviticus', abbrev: 'lv', chapters: 27 },
    { name: 'Numbers', abbrev: 'nm', chapters: 36 },
    { name: 'Deuteronomy', abbrev: 'dt', chapters: 34 },
    { name: 'Joshua', abbrev: 'jos', chapters: 24 },
    { name: 'Judges', abbrev: 'jdgs', chapters: 21 },
    { name: 'Ruth', abbrev: 'ru', chapters: 4 },
    { name: '1 Samuel', abbrev: '1sm', chapters: 31 },
    { name: '2 Samuel', abbrev: '2sm', chapters: 24 },
    { name: '1 Kings', abbrev: '1kgs', chapters: 22 },
    { name: '2 Kings', abbrev: '2kgs', chapters: 25 },
    { name: '1 Chronicles', abbrev: '1chr', chapters: 29 },
    { name: '2 Chronicles', abbrev: '2chr', chapters: 36 },
    { name: 'Ezra', abbrev: 'ezr', chapters: 10 },
    { name: 'Nehemiah', abbrev: 'neh', chapters: 13 },
    { name: 'Esther', abbrev: 'est', chapters: 10 },
    { name: 'Job', abbrev: 'job', chapters: 42 },
    { name: 'Psalms', abbrev: 'ps', chapters: 150 },
    { name: 'Proverbs', abbrev: 'prv', chapters: 31 },
    { name: 'Ecclesiastes', abbrev: 'eccl', chapters: 12 },
    { name: 'Song of Solomon', abbrev: 'ssol', chapters: 8 },
    { name: 'Isaiah', abbrev: 'is', chapters: 66 },
    { name: 'Jeremiah', abbrev: 'jer', chapters: 52 },
    { name: 'Lamentations', abbrev: 'lam', chapters: 5 },
    { name: 'Ezekiel', abbrev: 'ez', chapters: 48 },
    { name: 'Daniel', abbrev: 'dn', chapters: 12 },
    { name: 'Hosea', abbrev: 'hos', chapters: 14 },
    { name: 'Joel', abbrev: 'jl', chapters: 3 },
    { name: 'Amos', abbrev: 'am', chapters: 9 },
    { name: 'Obadiah', abbrev: 'ob', chapters: 1 },
    { name: 'Jonah', abbrev: 'jon', chapters: 4 },
    { name: 'Micah', abbrev: 'mic', chapters: 7 },
    { name: 'Nahum', abbrev: 'nah', chapters: 3 },
    { name: 'Habakkuk', abbrev: 'hab', chapters: 3 },
    { name: 'Zephaniah', abbrev: 'zep', chapters: 3 },
    { name: 'Haggai', abbrev: 'hag', chapters: 2 },
    { name: 'Zechariah', abbrev: 'zec', chapters: 14 },
    { name: 'Malachi', abbrev: 'mal', chapters: 4 },
    { name: 'Matthew', abbrev: 'mt', chapters: 28 },
    { name: 'Mark', abbrev: 'mk', chapters: 16 },
    { name: 'Luke', abbrev: 'lk', chapters: 24 },
    { name: 'John', abbrev: 'jo', chapters: 21 },
    { name: 'Acts', abbrev: 'act', chapters: 28 },
    { name: 'Romans', abbrev: 'rm', chapters: 16 },
    { name: '1 Corinthians', abbrev: '1co', chapters: 16 },
    { name: '2 Corinthians', abbrev: '2co', chapters: 13 },
    { name: 'Galatians', abbrev: 'gal', chapters: 6 },
    { name: 'Ephesians', abbrev: 'eph', chapters: 6 },
    { name: 'Philippians', abbrev: 'phi', chapters: 4 },
    { name: 'Colossians', abbrev: 'col', chapters: 4 },
    { name: '1 Thessalonians', abbrev: '1th', chapters: 5 },
    { name: '2 Thessalonians', abbrev: '2th', chapters: 3 },
    { name: '1 Timothy', abbrev: '1tm', chapters: 6 },
    { name: '2 Timothy', abbrev: '2tm', chapters: 4 },
    { name: 'Titus', abbrev: 'tit', chapters: 3 },
    { name: 'Philemon', abbrev: 'phm', chapters: 1 },
    { name: 'Hebrews', abbrev: 'heb', chapters: 13 },
    { name: 'James', abbrev: 'jm', chapters: 5 },
    { name: '1 Peter', abbrev: '1pe', chapters: 5 },
    { name: '2 Peter', abbrev: '2pe', chapters: 3 },
    { name: '1 John', abbrev: '1jo', chapters: 5 },
    { name: '2 John', abbrev: '2jo', chapters: 1 },
    { name: '3 John', abbrev: '3jo', chapters: 1 },
    { name: 'Jude', abbrev: 'jd', chapters: 1 },
    { name: 'Revelation', abbrev: 'rev', chapters: 22 }
];

// State
let bibleData = null;
let currentBookIndex = null;
let currentChapter = 1;
let currentVerseIndex = 0;
let allVerses = [];
let isPlaying = false;
let speed = 1;
let selectedVoice = null;
let voices = [];
let dataLoaded = false;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    populateBooks();
    populateVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoices;
    }
    
    // Load Bible data
    try {
        document.getElementById('subtitle').textContent = 'Loading Bible data...';
        const res = await fetch('bible.json');
        if (!res.ok) throw new Error('Failed to fetch');
        bibleData = await res.json();
        dataLoaded = true;
        document.getElementById('subtitle').textContent = 'Select a book to begin reading';
        console.log('Bible data loaded:', bibleData.length, 'books');
    } catch (err) {
        document.getElementById('subtitle').textContent = 'Failed to load Bible data: ' + err.message;
        console.error('Load error:', err);
    }
});

function populateBooks() {
    const select = document.getElementById('book-select');
    BOOKS.forEach((book, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = book.name;
        select.appendChild(opt);
    });
}

function populateVoices() {
    const select = document.getElementById('voice-select');
    voices = speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
    
    select.innerHTML = '';
    let defaultIndex = 0;
    
    voices.forEach((voice, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `${voice.name} (${voice.lang})`;
        select.appendChild(opt);
        if (voice.name.toLowerCase().includes('superstar')) defaultIndex = i;
    });
    
    if (voices.length > 0) {
        select.value = defaultIndex;
        selectedVoice = voices[defaultIndex];
    }
}

function setVoice(index) {
    if (voices[index]) selectedVoice = voices[index];
}

function loadBook() {
    if (!dataLoaded || !bibleData) {
        alert('Bible data is still loading. Please wait.');
        return;
    }
    
    const bookIndex = parseInt(document.getElementById('book-select').value);
    if (isNaN(bookIndex) || bookIndex < 0) {
        alert('Please select a book');
        return;
    }
    
    console.log('Loading book index:', bookIndex);
    
    currentBookIndex = bookIndex;
    currentChapter = 1;
    currentVerseIndex = 0;
    
    const book = BOOKS[bookIndex];
    const bookData = bibleData[bookIndex];
    
    if (!bookData) {
        alert('Book data not found');
        console.error('No data for book index:', bookIndex);
        return;
    }
    
    console.log('Book data:', book.name, 'chapters in data:', bookData.chapters.length);
    
    document.getElementById('book-title').textContent = book.name;
    document.getElementById('subtitle').style.display = 'none';
    document.getElementById('current-ref').textContent = `${book.name} 1:1`;
    document.getElementById('bottom-nav').style.display = 'block';
    
    // Build table of contents
    const numChapters = bookData.chapters.length;
    let tocHtml = '';
    for (let i = 1; i <= numChapters; i++) {
        tocHtml += `<a href="#ch${i}">${i}</a>`;
    }
    document.getElementById('toc').innerHTML = tocHtml;
    
    // Build all chapters
    let chaptersHtml = '';
    allVerses = [];
    
    for (let ch = 1; ch <= numChapters; ch++) {
        const chapterVerses = bookData.chapters[ch - 1] || [];
        
        const prevCh = ch > 1 ? `<a href="#ch${ch-1}">← Prev</a>` : '';
        const nextCh = ch < numChapters ? `<a href="#ch${ch+1}">Next →</a>` : '';
        
        chaptersHtml += `
            <div class="chapter-section" id="section-${ch}">
                <div class="chapter-header">
                    <h2 id="ch${ch}">Chapter ${ch}</h2>
                </div>
                <div class="nav">${prevCh} <a href="#top">Top</a> <a href="#bottom">Bottom</a> ${nextCh}</div>
            </div>
        `;
        
        let versesHtml = '<p>';
        chapterVerses.forEach((text, i) => {
            const verseNum = i + 1;
            const cleanText = text.replace(/\{[^}]*\}/g, '');
            
            allVerses.push({
                chapter: ch,
                num: verseNum,
                text: cleanText,
                globalIndex: allVerses.length
            });
            
            versesHtml += `<span class="verse" data-chapter="${ch}" data-verse="${verseNum}"><span class="verse-num">${verseNum}</span>${cleanText} </span>`;
            
            if (verseNum % 4 === 0 && verseNum < chapterVerses.length) {
                versesHtml += '</p><p>';
            }
        });
        versesHtml += '</p>';
        
        chaptersHtml += versesHtml;
    }
    
    document.getElementById('chapters').innerHTML = chaptersHtml;
    
    // Add click handlers
    document.querySelectorAll('.verse').forEach(el => {
        el.addEventListener('click', () => {
            const ch = parseInt(el.dataset.chapter);
            const v = parseInt(el.dataset.verse);
            goToVerse(ch, v);
        });
    });
    
    console.log('Loaded', allVerses.length, 'verses');
    
    // Highlight first verse
    highlightVerse(1, 1);
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function highlightVerse(chapter, verseNum) {
    document.querySelectorAll('.verse.reading').forEach(el => el.classList.remove('reading'));
    
    const verse = document.querySelector(`.verse[data-chapter="${chapter}"][data-verse="${verseNum}"]`);
    if (verse) {
        verse.classList.add('reading');
        verse.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    currentChapter = chapter;
    const book = BOOKS[currentBookIndex];
    document.getElementById('current-ref').textContent = `${book.name} ${chapter}:${verseNum}`;
    
    currentVerseIndex = allVerses.findIndex(v => v.chapter === chapter && v.num === verseNum);
}

function goToVerse(chapter, verseNum) {
    highlightVerse(chapter, verseNum);
    
    if (isPlaying) {
        speechSynthesis.cancel();
        speakCurrentVerse();
    }
}

function speakCurrentVerse() {
    if (!isPlaying || currentVerseIndex >= allVerses.length) {
        if (currentVerseIndex >= allVerses.length) {
            isPlaying = false;
        }
        return;
    }
    
    const verse = allVerses[currentVerseIndex];
    highlightVerse(verse.chapter, verse.num);
    
    const utterance = new SpeechSynthesisUtterance(verse.text);
    utterance.rate = speed;
    if (selectedVoice) utterance.voice = selectedVoice;
    
    utterance.onend = () => {
        if (isPlaying) {
            currentVerseIndex++;
            speakCurrentVerse();
        }
    };
    
    utterance.onerror = (e) => console.log('Speech error:', e);
    
    speechSynthesis.speak(utterance);
}

function playFromCurrent() {
    if (allVerses.length === 0) {
        alert('Please load a book first');
        return;
    }
    isPlaying = true;
    speakCurrentVerse();
}

function pausePlayback() {
    isPlaying = false;
    speechSynthesis.cancel();
}

function prevVerse() {
    if (currentVerseIndex > 0) {
        currentVerseIndex--;
        const verse = allVerses[currentVerseIndex];
        highlightVerse(verse.chapter, verse.num);
        if (isPlaying) {
            speechSynthesis.cancel();
            speakCurrentVerse();
        }
    }
}

function nextVerse() {
    if (currentVerseIndex < allVerses.length - 1) {
        currentVerseIndex++;
        const verse = allVerses[currentVerseIndex];
        highlightVerse(verse.chapter, verse.num);
        if (isPlaying) {
            speechSynthesis.cancel();
            speakCurrentVerse();
        }
    }
}

function prevChapter() {
    if (currentChapter > 1) {
        goToVerse(currentChapter - 1, 1);
    }
}

function nextChapter() {
    const bookData = bibleData[currentBookIndex];
    if (currentChapter < bookData.chapters.length) {
        goToVerse(currentChapter + 1, 1);
    }
}

function restartCurrentChapter() {
    goToVerse(currentChapter, 1);
}

function setSpeed(newSpeed) {
    speed = newSpeed;
    
    document.querySelectorAll('[data-speed]').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`[data-speed="${speed}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    if (isPlaying) {
        speechSynthesis.cancel();
        speakCurrentVerse();
    }
}
