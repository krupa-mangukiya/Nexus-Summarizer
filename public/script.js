document.addEventListener('DOMContentLoaded', function() {
    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const moonIcon = themeToggle.querySelector('.fa-moon');
    const sunIcon = themeToggle.querySelector('.fa-sun');
    
    // Check for saved theme preference or use preferred color scheme
    const savedTheme = localStorage.getItem('theme') || 
                      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    if (savedTheme === 'light') {
        moonIcon.classList.add('hidden');
        sunIcon.classList.remove('hidden');
    }
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        moonIcon.classList.toggle('hidden');
        sunIcon.classList.toggle('hidden');
    });
    
    // Character Counter
    const inputText = document.getElementById('input-text');
    const inputCount = document.getElementById('input-count');
    
    inputText.addEventListener('input', () => {
        inputCount.textContent = inputText.value.length;
    });
    
    // Toolbar Buttons
    document.getElementById('clear-btn').addEventListener('click', () => {
        inputText.value = '';
        inputCount.textContent = '0';
    });
    
    document.getElementById('paste-btn').addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            inputText.value = text;
            inputCount.textContent = text.length;
            showToast('Text pasted from clipboard');
        } catch (err) {
            showToast('Failed to paste from clipboard', 'error');
        }
    });
    
    // File Upload
    document.getElementById('file-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            inputText.value = event.target.result;
            inputCount.textContent = inputText.value.length;
            showToast(`File "${file.name}" loaded`);
        };
        
        if (file.type === 'application/pdf') {
            // PDF handling would require a library like pdf.js
            showToast('PDF processing not implemented', 'warning');
        } else {
            reader.readAsText(file);
        }
    });
    
    // Copy Button
    document.getElementById('copy-btn').addEventListener('click', () => {
        const outputText = document.getElementById('output-text').textContent;
        if (!outputText.trim()) {
            showToast('No summary to copy', 'warning');
            return;
        }
        
        navigator.clipboard.writeText(outputText)
            .then(() => showToast('Summary copied to clipboard'))
            .catch(() => showToast('Failed to copy', 'error'));
    });
    
    // Download Button
    document.getElementById('download-btn').addEventListener('click', () => {
        const outputText = document.getElementById('output-text').textContent;
        if (!outputText.trim()) {
            showToast('No summary to download', 'warning');
            return;
        }
        
        const blob = new Blob([outputText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'summary.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Summary downloaded');
    });
    
    // Summarize Button (Mock Functionality)
    document.getElementById('summarize-btn').addEventListener('click', () => {
        const text = inputText.value.trim();
        if (!text) {
            showToast('Please enter some text to summarize', 'warning');
            return;
        }
        
        const style = document.getElementById('summary-style').value;
        const length = document.getElementById('summary-length').value;
        
        // Show loading state
        const spinner = document.getElementById('loading-spinner');
        const buttonText = document.getElementById('summarize-text');
        spinner.classList.remove('hidden');
        buttonText.textContent = 'Summarizing...';
        
        // Mock API call (in a real app, this would be a fetch to your backend)
        setTimeout(() => {
            const mockSummary = generateMockSummary(text, style, length);
            document.getElementById('output-text').textContent = mockSummary;
            
            // Update stats
            const originalLength = text.length;
            const summaryLength = mockSummary.length;
            const reduction = Math.round((1 - (summaryLength / originalLength)) * 100);
            
            document.getElementById('original-length').textContent = originalLength;
            document.getElementById('summary-length-stat').textContent = summaryLength;
            document.getElementById('reduction-percent').textContent = reduction;
            
            // Reset button
            spinner.classList.add('hidden');
            buttonText.textContent = 'Summarize';
            
            showToast('Summary generated');
        }, 1500);
    });
    
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Toast Notification Function
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast';
        
        // Add type class if provided
        if (type) {
            toast.classList.add(type);
        }
        
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    // Mock Summary Generator (for demo purposes)
    function generateMockSummary(text, style, length) {
        const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
        let summaryLength;
        
        switch (length) {
            case 'very-short': summaryLength = Math.max(1, Math.floor(sentences.length * 0.1)); break;
            case 'short': summaryLength = Math.max(1, Math.floor(sentences.length * 0.25)); break;
            case 'medium': summaryLength = Math.max(1, Math.floor(sentences.length * 0.4)); break;
            case 'long': summaryLength = Math.max(1, Math.floor(sentences.length * 0.6)); break;
            case 'detailed': summaryLength = Math.max(1, Math.floor(sentences.length * 0.8)); break;
            default: summaryLength = Math.max(1, Math.floor(sentences.length * 0.4));
        }
        
        let summary = sentences.slice(0, summaryLength).join(' ');
        
        switch (style) {
            case 'bullet':
                summary = sentences.slice(0, summaryLength)
                    .map(s => `• ${s.trim()}`)
                    .join('\n');
                break;
            case 'academic':
                summary = `This text discusses several key points:\n\n${sentences.slice(0, summaryLength).join(' ')}\n\nIn conclusion, the main ideas are clearly presented.`;
                break;
            case 'narrative':
                summary = `The content begins by explaining that ${sentences[0].toLowerCase()} ${sentences.slice(1, summaryLength).join(' ')}`;
                break;
        }
        
        return summary;
    }
});