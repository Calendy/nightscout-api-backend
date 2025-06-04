// Documentation page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Set the base URL dynamically
    const baseUrlElement = document.getElementById('base-url');
    if (baseUrlElement) {
        baseUrlElement.textContent = window.location.origin + '/api/v1';
    }
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Copy to clipboard function
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;
    
    navigator.clipboard.writeText(text).then(function() {
        // Show success feedback
        const button = element.parentNode.querySelector('.copy-btn');
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.background = 'rgba(34, 197, 94, 0.3)';
        button.style.borderColor = '#22c55e';
        button.style.color = '#4ade80';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = 'rgba(59, 130, 246, 0.2)';
            button.style.borderColor = 'rgba(59, 130, 246, 0.3)';
            button.style.color = '#60a5fa';
        }, 2000);
    }).catch(function(err) {
        console.error('Failed to copy text: ', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    });
}

// API Tester function
async function testEndpoint() {
    const endpointSelect = document.getElementById('endpoint-select');
    const apiSecretInput = document.getElementById('api-secret-input');
    const resultElement = document.getElementById('test-result');

    const endpoint = endpointSelect.value;
    const apiSecret = apiSecretInput.value.trim();

    // Show loading state
    resultElement.textContent = 'Se încarcă...';
    resultElement.style.color = '#60a5fa';

    try {
        const headers = {
            'Content-Type': 'application/json'
        };

        // Add authentication if provided
        if (apiSecret) {
            headers['api-secret'] = apiSecret;
            console.log('Adding API secret to headers:', apiSecret.substring(0, 8) + '...');
        } else {
            console.log('No API secret provided');
        }

        console.log('Making request to:', endpoint);
        console.log('Headers:', headers);

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: headers
        });

        const data = await response.json();

        // Format and display the response
        const formattedResponse = {
            status: response.status,
            statusText: response.statusText,
            requestHeaders: headers,
            responseHeaders: {
                'content-type': response.headers.get('content-type'),
                'content-length': response.headers.get('content-length')
            },
            data: data
        };

        resultElement.textContent = JSON.stringify(formattedResponse, null, 2);

        // Color code based on status
        if (response.ok) {
            resultElement.style.color = '#4ade80';
        } else {
            resultElement.style.color = '#f87171';
        }

    } catch (error) {
        resultElement.textContent = JSON.stringify({
            error: 'Eroare de Rețea',
            message: error.message,
            details: 'Nu s-a putut conecta la API. Asigură-te că serverul rulează.'
        }, null, 2);
        resultElement.style.color = '#f87171';
    }
}

// Add copy buttons to all code blocks
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.code-block:not(.copy-btn-added)').forEach((block, index) => {
        if (!block.querySelector('.copy-btn')) {
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.textContent = 'Copy';
            copyBtn.onclick = function() {
                const code = block.querySelector('code, pre');
                const text = code ? code.textContent : block.textContent;
                
                navigator.clipboard.writeText(text).then(function() {
                    copyBtn.textContent = 'Copied!';
                    copyBtn.style.background = 'rgba(34, 197, 94, 0.3)';
                    copyBtn.style.borderColor = '#22c55e';
                    copyBtn.style.color = '#4ade80';
                    
                    setTimeout(() => {
                        copyBtn.textContent = 'Copy';
                        copyBtn.style.background = 'rgba(59, 130, 246, 0.2)';
                        copyBtn.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                        copyBtn.style.color = '#60a5fa';
                    }, 2000);
                }).catch(function(err) {
                    console.error('Failed to copy: ', err);
                });
            };
            block.appendChild(copyBtn);
            block.classList.add('copy-btn-added');
        }
    });
});
