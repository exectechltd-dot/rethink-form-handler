function submitForm() {
    // 1. Grab basic values
    const name = document.getElementById('firstName').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!name || !email) {
        document.getElementById('firstName').style.borderColor = name ? '' : 'var(--red)';
        document.getElementById('email').style.borderColor = email ? '' : 'var(--red)';
        return;
    }

    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'SENDING...';

    // 2. Create the data container manually (Matches your fetch call)
    const formData = new FormData(); 
    formData.append('first-name', name);
    formData.append('email', email);
    formData.append('business-name', document.getElementById('businessName').value);
    formData.append('phone', document.getElementById('phone').value);

    // Add quiz answers from your global 'answers' object
    for (let i = 1; i <= 5; i++) {
        formData.append(`q${i}`, (typeof answers !== 'undefined') ? answers[`q${i}`] : 'Not answered');
    }

    // 3. Send to your deployed Worker
    fetch('https://rethink-form-handler.paulaylett.workers.dev/', {
        method: 'POST',
        body: formData, // This now matches the 'const' above
        mode: 'no-cors' 
    })
    .then(() => {
        // Success: Hide form and show thank you message
        document.getElementById('formArea').querySelectorAll('.question-card, .contact-card, .progress-wrap').forEach(el => {
            el.style.display = 'none';
        });
        const ty = document.getElementById('thankyou');
        ty.classList.add('visible');
        ty.scrollIntoView({ behavior: 'smooth', block: 'start' });
    })
    .catch((error) => {
        console.error('Submission error:', error);
        btn.disabled = false;
        btn.textContent = 'Send my results to Paul';
    });
}
