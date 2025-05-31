document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    const inputCount = document.getElementById('input-count');
    const originalLength = document.getElementById('original-length');
    const summaryLengthStat = document.getElementById('summary-length-stat');
    const reductionPercent = document.getElementById('reduction-percent');
    const summarizeBtn = document.getElementById('summarize-btn');
    const clearBtn = document.getElementById('clear-btn');
    const pasteBtn = document.getElementById('paste-btn');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');
    const fileInput = document.getElementById('file-input');
    const summaryStyle = document.getElementById('summary-style');
    const summaryLength = document.getElementById('summary-length');
    const toast = document.getElementById('toast');
    const themeToggle = document.getElementById('theme-toggle');
    const loadingSpinner = document.getElementById('loading-spinner');
    const summarizeText = document.getElementById('summarize-text');

    // Theme Management
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    themeToggle.addEventListener('click', toggleTheme);

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    }

    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }

    // Character count update
    inputText.addEventListener('input', function() {
        const count = this.value.length;
        inputCount.textContent = count;
    });

    // Clear button
    clearBtn.addEventListener('click', function() {
        inputText.value = '';
        outputText.textContent = '';
        inputCount.textContent = '0';
        originalLength.textContent = '0';
        summaryLengthStat.textContent = '0';
        reductionPercent.textContent = '0';
        showToast('Cleared all content');
    });

    // Paste button
    pasteBtn.addEventListener('click', function() {
        navigator.clipboard.readText()
            .then(text => {
                inputText.value = text;
                inputCount.textContent = text.length;
                showToast('Pasted from clipboard');
            })
            .catch(err => {
                showToast('Failed to read clipboard', 'error');
                console.error('Failed to read clipboard:', err);
            });
    });

    // Copy button
    copyBtn.addEventListener('click', function() {
        if (outputText.textContent.trim()) {
            navigator.clipboard.writeText(outputText.textContent)
                .then(() => showToast('Summary copied to clipboard'))
                .catch(err => {
                    showToast('Failed to copy', 'error');
                    console.error('Failed to copy:', err);
                });
        } else {
            showToast('No summary to copy', 'warning');
        }
    });

    // Download button
    downloadBtn.addEventListener('click', function() {
        if (outputText.textContent.trim()) {
            const blob = new Blob([outputText.textContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'summary.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Summary downloaded');
        } else {
            showToast('No summary to download', 'warning');
        }
    });

    // File upload
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const fileType = file.type;
        const validTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

        if (!validTypes.includes(fileType)) {
            showToast('Invalid file type. Please upload a TXT, PDF, or DOCX file.', 'error');
            return;
        }

        if (fileType === 'text/plain') {
            readTextFile(file);
        } else {
            // For PDF and DOCX, we'll send to the server for processing
            uploadFile(file);
        }
    });

    function readTextFile(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            inputText.value = e.target.result;
            inputCount.textContent = e.target.result.length;
            showToast('Text file loaded');
        };
        reader.readAsText(file);
    }

    function uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        toggleLoading(true);

        fetch('/api/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('File processing failed');
            }
            return response.json();
        })
        .then(data => {
            inputText.value = data.text;
            inputCount.textContent = data.text.length;
            showToast(`${file.type.includes('pdf') ? 'PDF' : 'DOCX'} file processed`);
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Failed to process file', 'error');
        })
        .finally(() => {
            toggleLoading(false);
        });
    }

    // Summarize button
    summarizeBtn.addEventListener('click', function() {
        const text = inputText.value.trim();
        if (!text) {
            showToast('Please enter some text to summarize', 'warning');
            return;
        }

        const style = summaryStyle.value;
        const length = summaryLength.value;

        summarizeText.textContent = 'Summarizing...';
        toggleLoading(true);

        fetch('/api/summarize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                style: style,
                length: length
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Summarization failed');
            }
            return response.json();
        })
        .then(data => {
            outputText.textContent = data.summary;
            updateStats(text.length, data.summary.length);
            showToast('Summary generated successfully');
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Failed to generate summary', 'error');
            outputText.textContent = 'An error occurred while generating the summary. Please try again.';
        })
        .finally(() => {
            summarizeText.textContent = 'Summarize';
            toggleLoading(false);
        });
    });

    function updateStats(originalLengthValue, summaryLengthValue) {
        originalLength.textContent = originalLengthValue;
        summaryLengthStat.textContent = summaryLengthValue;
        
        const reduction = Math.round(((originalLengthValue - summaryLengthValue) / originalLengthValue) * 100);
        reductionPercent.textContent = reduction;
    }

    function toggleLoading(isLoading) {
        if (isLoading) {
            loadingSpinner.classList.remove('hidden');
            summarizeBtn.disabled = true;
        } else {
            loadingSpinner.classList.add('hidden');
            summarizeBtn.disabled = false;
        }
    }

    function showToast(message, type = 'success') {
        toast.textContent = message;
        toast.className = 'toast';
        
        switch (type) {
            case 'error':
                toast.style.backgroundColor = 'var(--error-color)';
                break;
            case 'warning':
                toast.style.backgroundColor = 'var(--warning-color)';
                break;
            default:
                toast.style.backgroundColor = 'var(--success-color)';
        }
        
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
});