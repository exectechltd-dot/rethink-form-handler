function submitForm() {
    const name = document.getElementById('firstName').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!name || !email) {
        document.getElementById('firstName').style.borderColor = name ? '' : 'var(--red)';
        document.getElementById('email').style.borderColor = email ? '' : 'var(--red)';
        return;
    }

    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    // Ensure the variable is declared clearly within this scope
    const healthCheckData = new FormData(); 
    
    healthCheckData.append('first-name', name);
    healthCheckData.append('business-name', document.getElementById('businessName').value);
    healthCheckData.append('email', email);
    healthCheckData.append('phone', document.getElementById('phone').value);

    // Using your global 'answers' object
    for (let i = 1; i <= 5; i++) {
        healthCheckData.append(`q${i}`, answers[`q${i}`] || 'Not answered');
    }

    fetch('https://rethink-form-handler.paulaylett.workers.dev/', {
        method: 'POST',
        body: healthCheckData, // Matching variable name
        mode: 'no-cors'
    })
    .then(() => {
        document.getElementById('formArea').querySelectorAll('.question-card, .contact-card, .progress-wrap').forEach(el => {
            el.style.display = 'none';
        });
        document.getElementById('thankyou').classList.add('visible');
    })
    .catch(err => {
        console.error("Submission failed:", err);
        btn.disabled = false;
        btn.textContent = 'Send my results to Paul';
    });
}
